```javascript

/** Passing handlers */

mainController = controller();

mainController
  .do((req, res, next, errorCb, data) => {
    // first in pipeline
    ...
  })
  .do((req, res, next, errorCb, data) => {
    // second in pipeline
    ...
  });


/** Passing controller */
mainController = controller();
childController =  controller();

childController
  .do((req, res, next, errorCb, data) => {
    // second in pipeline
    ...
  })
  .do((req, res, next, errorCb, data) => {
    // third in pipeline
    ...
  });

mainController
  .do((req, res, next, errorCb, data) => {
    // first in pipeline
    ...
  });
  .do(childController);


```
