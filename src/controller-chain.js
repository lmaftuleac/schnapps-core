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
    
    // add chainable methods to run
    this.run.use = this.use;
    this.run.case = this.case;
    this.run.end = this.end;
    this.run.catch = this.catch;
  }

  register(fn) {
    // get last registered handler
    const lastIndex = this.nodes.length - 1;
    const lastHandler = this.nodes[lastIndex];

    // generate handler object
    const handler = {
      fn,
      next: null,
    }

    // previous handler to current
    if (lastHandler) {
      lastHandler.next = handler;
    }

    this.nodes.push(handler);
  }

  use(fn) {
    this.register(fn);
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
    ControllerChain.__error = customErrorHandler;
  }

}

module.exports = ControllerChain;

