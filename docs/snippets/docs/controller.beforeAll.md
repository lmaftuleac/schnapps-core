```javascript

/** Passing handlers */

mainController = controller();

mainController
  .beforeAll((req, res, next, errorCb, data) => {
    // second in pipeline
    ...
  })
  .beforeAll((req, res, next, errorCb, data) => {
    // first in pipeline
    ...
  });


/** Passing controller */
mainController = controller();
childController =  controller();

childController
  .beforeAll((req, res, next, errorCb, data) => {
    // third in pipeline
    ...
  })
  .beforeAll((req, res, next, errorCb, data) => {
    // second in pipeline
    ...
  });

mainController
  .beforeAll(childController);
  .beforeAll((req, res, next, errorCb, data) => {
    // first in pipeline
    ...
  });


```
