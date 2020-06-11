```javascript
// create a new controller instance
const controllerInstance = controller();

// define the pipline
controllerInstance
  .do((req, res, next, errorCb, data ) => {
    data.push('na');
    return next(data);
  })
  .do((req, res, next, errorCb, data ) => {
    data.push('na')
    return next(data);
  })
  .do((req, res, next, errorCb, data ) => {
    data.push('na')
    return next(data);
  })
  .do((req, res, next, errorCb, data ) => {
    data.push('Batman!')
    return next(data);
  })
  .end((req, res, errorCb, data) => {
    // na,na,na,Batman!
    console.log(data.join())
  });

// initial input is a blank array
const initialData = [];

// mock request/response objects
const req = {};
const res = {};

controllerInstance(req, res, initialData)

```
