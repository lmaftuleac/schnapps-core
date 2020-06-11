```javascript

/**
 * Using next() to pass data
 */
 
const controllerInstance = controller();

controllerInstance
  .do((req, res, next, errorCb ) => {
    return next('hello world!');
  })
  .end((req, res, next, errorCb, data) => {
    // hello world!
    console.log(data);
  });

controllerInstance(req, res);

/**
 * Using next() to include a child controller
 */
const controlerOne = controller();
controlerOne
  .do((req, res, next, errorCb, data) => {
    data.push('This')
    return next(data);
  })
  .do((req, res, next, errorCb, data) => {
    data.push('is')
    return next(data);
  })
  // these will be ignored
  .end(...)
  .catch(...)
  

const controllerTwo = controller();
controllerTwo
  .do((req, res, next, errorCb, data) => {
    return next(controlerOne, data);
  })
  .do((req, res, next, errorCb, data) => {
    data.push('controllerTwo');
    return next(data)
  })
  .end((req, res, errorCb, data) => {
    // This is controllerTwo
    console.log(data.join(' '));
  })

controllerTwo(req, res, []);


/**
 * Using next() to re-route the flow
 */

const controlerOne = controller();
controlerOne
  .do((req, res, next, errorCb, data) => {
    data.push('controlerOne')
    return next(data);
  })
  .end((req, res, errorCb, data) => {
     // This is controlerOne
    console.log(data.join(' '));
  })

const controllerTwo = controller();
controllerTwo
  .do((req, res, next, errorCb, data) => {
    data.push('controllerTwo');
    return next(data)
  })
  .end((req, res, errorCb, data) => {
    // This is controllerTwo
    console.log(data.join(' '));
  })

const controllerThree = controller();
controllerThree
  .do((req, res, next, errorCb, data) => {
    data.push('This')
    return next(data);
  })
  .do((req, res, next, errorCb, data) => {
    data.push('is')
    return next(data);
  })
  .do((req, res, next, errorCb, data) => {
    const random = (Math.floor((Math.random() * 10)) % 2);

    if (random) {
      return next(controllerOne, data, {reroute: true})
    } else {
      return next(controllerTwo, data, {reroute: true})
    }
  })
  // these will be ignored
  .end(...)
  .catch(...)


controllerThree(req, res, []);

```
