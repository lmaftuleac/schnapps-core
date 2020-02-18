// default branch options
const BRANCH_OPTS = {
  reroute: true
}


const cycleRunner = (req, res, handler, customData, errCb, doneCb) => {
  let errorCalled = false;
  let nextCalled = false;

  const next = (...args) => {
    // prevent going into next if error was called previously
    if (errorCalled) {
      throw new Error('Cannot call Next after Error was called');
    }

    // prevent multiple next calls
    if (nextCalled) {
      throw new Error('next() was already called');
    }

    // mark as called
    nextCalled = true;

    let branch, data, opts;

    // get data inputs : check whether a branch was sent
    if (args[0] instanceof ControllerChain) {
      branch = args[0];
      opts = {...BRANCH_OPTS, ...args[1]}
      data = args[2];
    } else {
      data = args[0];
    }
    
    // handle branch redirects
    if (branch) {
      const { reroute } = opts;

      // re-routing to separate branch
      if (reroute) {
        return branch.run(req, res, data);
      }

      // simple call branch
      const branchHandler = branch.nodes[0];
      if (branchHandler) {

        // success callback for child branch
        const done = () => {
          if (handler.next) {
            return cycleRunner(req, res, handler.next, data, errCb, doneCb);
          } else if (doneCb) {
            return doneCb(req, res, data);
          }
        }
        
        // start branch chain
        return cycleRunner(req, res, branchHandler, data, errCb, done);
      } else {
        throw new Error('Provided branch has no services');
      }
    }

    //continue to next handler
    if (handler.next) {
      return cycleRunner(req, res, handler.next, data, errCb, doneCb);
    } else if (doneCb) {
      return doneCb(req, res, data);
    }
  }

  const error = (err) => {
    // prevent going into next if error was called previously
    if (errorCalled) {
      throw new Error('error() was already called');
    }

    // prevent multiple next calls
    if (nextCalled) {
      throw new Error('Cannot call Error after Next was called');
    }

    // mark as called
    errorCalled = true;

    return errCb(req, res, err);
  }
  
  return handler.fn(req, res, next, error, customData);
}


class ControllerChain {

  constructor() {
    this.nodes = [];
    this.endCallback = null;
    this.catchCallback = null;

    // bind context
    this.use = this.use.bind(this);
    this.run = this.run.bind(this);
    this.catch = this.catch.bind(this);
    this.end = this.end.bind(this);
    this.before = this.before.bind(this);
    
    // add chainable methods to run
    this.run.use = this.use;
    this.run.case = this.case;
    this.run.end = this.end;
    this.run.catch = this.catch;
    this.run.before = this.before;
  }

  // PRIVATE

  chainHandlers(node, lastNode) {
    if (node && lastNode) {
      node.next = lastNode;
    }
  }

  prepend(fn) {
    // first handler
    const firstHandler = this.nodes[0];

    // generate handler object
    const handler = {
      fn,
      next: firstHandler,
    }

    // previous handler to current
    this.chainHandlers(handler, firstHandler);

    // include as first handler
    this.nodes.unshift(handler);
  }

  append(fn) {
    // get last registered handler
    const lastIndex = this.nodes.length - 1;
    const lastHandler = this.nodes[lastIndex];

    // generate handler object
    const handler = {
      fn,
      next: null,
    }

    // previous handler to current
    this.chainHandlers(lastHandler, handler);

    this.nodes.push(handler);
  }

  // PUBLIC

  use(fn) {
    if (typeof fn === 'function') {
      this.append(fn);
    }
    else if (fn instanceof ControllerChain) {
      const ourLastHandler = this.nodes[this.nodes.length - 1];
      const firstForeignHandler = fn.nodes[0];
      if (firstForeignHandler) {
        this.chainHandlers(ourLastHandler, firstForeignHandler);
        this.nodes = this.nodes.concat(fn.nodes);
      }
    }
    return this.run;
  }

  before(fn) {
    if (typeof fn === 'function') {
      this.prepend(fn);
    }
    else if (fn instanceof ControllerChain) {
      const lastForeignHandler = fn.nodes[fn.nodes.length - 1];
      const ourFirstHandler = this.nodes[0];
      if (lastForeignHandler && ourFirstHandler) {
        this.chainHandlers(lastForeignHandler, ourFirstHandler);
        this.nodes = fn.nodes.concat(this.nodes);
      }
    }
    return this.run;
  }

  catch(errorHandler) {
    this.catchCallback = errorHandler;
    return this.run;
  }

  end(endCallback) {
    this.endCallback = endCallback;
    return this.run;
  }

  run(req, res, initData) {
    const firstInQ = this.nodes[0];

    // error callback for cycle runner
    const errCb = (req, res, err) => {
      if (this.catchCallback) {
        return this.catchCallback(req, res, err);
      }
      return ControllerChain.__errorHandler(req, res, err);
    }

    // success callback for cycle runner
    const doneCb = (...args) => {
      if (this.endCallback) {
        this.endCallback.apply(this, args);
      }
    }

    if (firstInQ) {
      return cycleRunner(req, res, firstInQ, initData, errCb, doneCb);
    }
  }

  static __errorHandler(req, res, error) {
    res.send('SERVER ERROR');
  }

  static setDefaultErrorHandler(customErrorHandler) {
    ControllerChain.__errorHandler = customErrorHandler;
  }

}

module.exports = ControllerChain;

