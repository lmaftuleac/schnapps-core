```javascript
const  { controller } = require('@schnapps/core')

// Create a new controller
const SchnappsController = controller()

// add handlers
SchnappsController
  .do(handler)
  .do(handler)
  .do(handler)
  /* optional */
  .end(endHandler)
  .catch(errorHandler)

// use with express
express.get('/', (req, res) => SchnappsController(req, res, {data: 'some-initial-data'}))

// use with hapi
server.route({
    method: 'GET',
    path:'/',
    handler: (request, h) => SchnappsController(request, h, {data: 'some-initial-data'})
});

```