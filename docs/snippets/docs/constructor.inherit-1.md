```javascript
const  { controller } = require('@schnapps/core')

const primary = controller();
primary
  .do(handler1)
  .do(handler2)

const secondary = controller();
secondary
  .do(handler3)
  .do(handler4)

const handler5 = (req, res, next, errorCb) => {
  // ...
}

// childController will inherit : 
// handler1, handler2, handler3, handler4, handler5 
const childController = controller(primary, secondary, handler5);

```
