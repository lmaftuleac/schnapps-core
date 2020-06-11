```javascript

// import controller constructor function
const { controller } = require('@schnapps/core')

// Create new controller
const UserAccessController = controller()

// add handlers
UserAccessController
  .do(parseAuthorizationHeader)
  .do(decodeJwtToken)
  .do(userAccess)
  .do((req, res, next, errCb, data) => {
    // do something here as authorized user
    ...
    next('any data')
  })
  // OPTIONAL
  /**
   * Handlers declared within .end() will allways be triggered last in the call chain
   * this is why its missing next().
   */
  .end((req, res, errCb, data) => {
    // submit a response
  })
  /**
   *  Any errors triggered above will endup here
   */
  .catch((req, res, error) => {
    // submit an error
  })
```