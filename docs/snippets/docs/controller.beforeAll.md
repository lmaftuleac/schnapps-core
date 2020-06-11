```javascript
controllerInstance
  .beforeAll((req, res, next, errorCb, data) => {
    // handler body;
    // second in pipeline
  })
  .beforeAll((req, res, next, errorCb, data) => {
    // handler body
    // first in pipeline
  });;

```
