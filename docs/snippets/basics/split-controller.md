```javascript

// import controller constructor function
const { controller } = require('@schnapps/core')

// Create new controller
const AccessController = controller()

// add handlers
AccessController
  .do(parseAuthorizationHeader)
  .do(decodeJwtToken)

// extend Access controller
const UserAccess = controller(AccessController)
UserAccess
  .do(userAccess);

// or simply
const UserAccess = controller(AccessController, userAccess);

...

UserAccess
  .do((req, res, next, errCb, data) => {
    // do something here as authorized user
    ...
    next('any data')
  })
  .end((req, res, errCb, data) => {
    // submit a response
  })
  .catch((req, res, error) => {
    // Any errors triggered above will endup here
  })
```