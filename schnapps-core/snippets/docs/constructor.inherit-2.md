```javascript
const  { controller } = require('@schnapps/core')

const parentController = controller();

controllerInstance
  .do(firstHandler)
  .do(secondHandler)

// childController will inherit firstHandler, secondHandler
const childController = controller(parent);
```
