```javascript

// define a global error handler
controller
  .setDefaultErrorHandler((req, res, error) => {
    console.log(error);
  })

const controlerOne = controller();
controlerOne
  .do((req, res, next, errorCb) => {
    // will be handled in .catch below
    errorCb('ouch!')
  })
  .catch((req, res, error) => {
    // ouch!
    console.log(error);
  })

const controllerTwo = controller();
  .do((req, res, next, errorCb) => {
    // will be handled by the global error handler
    errorCb('OUCH!');
  })

controllerOne(req, res);
controllerTwo(req, res);

```
