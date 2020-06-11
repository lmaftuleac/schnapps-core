```javascript
const  { controller } = require('@schnapps/core')

controller.setDefaultErrorHandler((req, res, error) => {
  // Handle errors here
})

const ControllerWithoutHandler = controller();

ControllerWithoutHandler
  .do((req, res, next, errCb) => {
    return errCb('this error goes to global handler')
  })

const ControllerWithHandler = controller();

ControllerWithoutHandler
  .do((req, res, next, errCb) => {
    return errCb('this error goes to local handler')
  })
  .catch((req, res, error) => {
  // Handle errors here
  })

```
