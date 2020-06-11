```javascript

// import controller constructor function
const { controller } = require('@schnapps/core')

// Create new controller
const AccessController = controller()

// add handlers
AccessController
  .do(parseAuthorizationHeader)
  .do(decodeJwtToken)

const UserAccess = controller(AccessController, userAccess);
const ManagerAccess = controller(AccessController, managerAccess);
const AdminAccess = controller(AccessController, adminAccess);
...

const DoSomethingAsAdmin = controller(AdminAccess);

DoSomethingAsAdmin
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