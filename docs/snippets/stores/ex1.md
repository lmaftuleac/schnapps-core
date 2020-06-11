```javascript
const  { controller, session } = require('@schnapps/core')

const myController = controller(session)

myController
  .do((req, res, next, errCb, data) => { 
    req.setSession({ userId: 1 })
  })
  .do((req, res, next, errCb, data) => {
    const { userId } = req.session;
  })

```
