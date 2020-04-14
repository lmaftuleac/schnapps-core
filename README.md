Chain multiple services into a single controller, similar to express middleware. Supports branching and error handling. Unlike express middleware, `@schnapps/controller` allows to pass data through next() function. This allows to create re-usable services and re-usable service sequences.

### Controller Object
A controller is an object that chains multiple handlers together. It can be regarded as a wrapper that chains a set of handlers (services) in a specific order

```javascript
const  Controller = require('@schnapps/controller')

// Create a new controller
const Controller = new Controller()

// add handlers
Controller
  .do(handler) 
  .do(handler)
  .do(handler)
  /* optional */
  .end(endHandler)
  .catch(errorHandler)

// use with express
express.get('/', (req, res) => Controller(req, res, {data: 'some-initial-data'}))

```

### Handler function
A handler function similar to a [middleware](https://expressjs.com/en/guide/using-middleware.html) in express. The following statement is also true for controller handlers:

`
Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle. The next middleware function is commonly denoted by a variable named next. If the current middleware function does not end the request-response cycle, it must call next() to pass control to the next middleware function. Otherwise, the request will be left hanging.
`

```javascript
/**
 * Handler function
 * @param  {Object} req         express request object
 * @param  {Object} res         express response object
 * @param  {Function} next      callback function, triggers next handler
 * @param  {Function} errorCb   error callback function.
 * @param  {Any} data           Data object passed from previous handler
 */
const handler = function (req, res, next, errCb, data) {
	// do something here
};
```

### Using next()
similar to express, `next()` triggers next handler, with a small difference: instead of passing an error (in express) it passes data to the next handler. We can also use next() to re-chain to another controller

```javascript
/**
 * Next function
 * @param  {Any} data Data object passed from previous handler
 */
const next = function (data) {
  // triggers next handler, with data as input
};
/**
 * OR
 * @param  {Controller} controller  another controller object
 * @param  {Any} data               data passed to controller. Optional
 * @param  {Object} options         option object { reroute: <boolean> } Optional 
 */
const next = function (controller, data, options) {
	// triggers controller handlers, with data as input
};
```

```javascript

const getUserIdHandler = (req, res, next, errCb, data) => {
    const { userId } = req.body
    // pass userId to next handler
    next({ userId })
}

const getUserHandler = async (req, res, next, errCb, { userId }) => {
  try {
    const user = await db.select(`select * from users where users.id == ${userId}`)
    next(user)
  } catch(error) {
    errCb({
      status: 500,
      message: 'Cannot Find User'
    })
  }
}

const GetUserController = new Controller();

GetUserController
  .do(getUserIdHandler)
  .do(getUserHandler)
  .end((req, res, errCb, user) => {
    res.status(200).send(user)
  })
  .catch((req, res, error) => {
    res.status(error.status).send(error.message)
  })

```

In case we want to re-use another controller, pass it as first parameter and data as second. 
In this case however, only the handlers will be called in `GetUserController` without `.end()` or `.catch()` since parent controller has it's own `end` and `catch` functions.

```javascript
Controller = new Controller()

Controller
  .do((req, res, next, errCb, user) => {
    if (req.body.userId) {
      // here second parameter is optional
      next(
        GetUserController,  // controller chain
        { foo: 'bar' },     // some data
      )
    } else {
      errCb({
        status:500,
        message: 'Invalid Parameters'
      })
    }
  })
  .do((req, res, next, errCb, user) => {
    // received user here
    // do some stuff
    next(user)
  })
  .end((req, res, errCb, user) => {
    res.status(200).send(user)
  })
  .catch((req, res, error) => {
    res.status(error.status).send(error.message)
  })

```
In case we need to reroute our request completely, we need to pas a third parameter with `{ reroute: true }`. Further executions will be completeley handled by the child controller. Handlers in parent controller below rerouting, will be ignored along with `.catch` and `.end` functions


```javascript
Controller = new Controller()

Controller
  .do((req, res, next, errCb, user) => {
      next(
        GetUserController,  // controller chain
        { foo: 'bar' },     // some data
        { reroute: true }   // reroute to GetUserController
      )
    }
  })
  .do((req, res, next, errCb, user) => {
    // will be ignored
  })
  .end((req, res, errCb, user) => {
    // will be ignored
  })
  .catch((req, res, error) => {
    // will be ignored
  })

```
### Using ErrorCallback

Error callback is used to pass errors in handlers; A call to errorCb will stop chain execution and redirect to `.catch()` function. If `.catch` was not defined in controller it will be redirected to `globalErrorHandler`.

### Using Branches

```javascript
const  Controller = require('@schnapps/controller')

const MainController = new Controller()
const BranchA = new Controller()
const BranchB = new Controller()


BranchA
  .do(( req, res, next, errCb, data) => {
    return res.send('controller A')
  })

BranchB
  .do(( req, res, next, errCb, data) => {
    return res.send('controller B')
  })

// add handlers, similar to express route.use
MainController
  .do(( req, res, next, errCb, data) => {
    const { ver } = data;

    // passing branches through next()

    if (ver === 'a') {
      // use BranchA
      return next(BranchA, data)
    }

    if (ver === 'b') {
      // use BranchB
      return next(BranchB, data)
    }

    return errCb('Unknown Parameter')
  })
  .catch((req, res, error) => {
    res.status(500).send(error)
  })

express.get('/user/:ver', (req, res) => {
  const { ver } = req.params
  MainController(req, res, { ver })
})


// OR pass a branch directly in do()

const SecondController = new Controller()

SecondController.do(BranchA)

express.get('/return-A', (req, res) => {
  SecondController(req, res)
})

```

### Using .promise()

use `chain.promise(req, res, data)` to call a chain as a promise

```javascript
const Controller = require('@schnapps/controller')

const MainController = new Controller()
const BranchA = new Controller()
const BranchB = new Controller()


BranchA
  .do(( req, res, next, errCb, data) => {
    return res.send('controller A')
  })

BranchB
  .do(( req, res, next, errCb, data) => {
    return res.send('controller B')
  })

// add handlers, similar to express route.use
MainController
  .do(( req, res, next, errCb, data) => {
    const { ver } = data;

    if (ver === 'a') {
      // use BranchA
      return next(BranchA, data)
    }

    if (ver === 'b') {
      // use BranchB
      return next(BranchB, data)
    }

    return errCb('Unknown Parameter')
  })



express.get('/user/:ver', async (req, res) => {
  const { ver } = req.params
  
  try {
    data = await MainController.promise(req, res, { ver })
    res.send(data)
  } catch(error) {
    res.send(error)
  }
})

```

### Using .toMiddleware()

`chain.toMiddleware()` returns a middleware functions compatible with express

```javascript
const Controller = require('@schnapps/controller')

const controllerA = new Controller()
const controllerB = new Controller()

controllerA
  .do(( req, res, next, errCb, data) => {
    // do some stuff
  })

controllerB
  .do(( req, res, next, errCb, data) => {
    // do some stuff
  })

express.get('/user/:ver', controllerA.toMiddleware(), controllerB.toMiddleware())

```

### Global Error Handler

Provide a global error handler

```javascript
const  Controller = require('@schnapps/controller')

Chain.setDefaultErrorHandler((req, res, error) => {
  // hanlde error
  res.status(error.status).send(error.message)
})

const firstController = new Controller()
const secondController = new Controller()

firstController
  .do((req, res, next, errCb, data) => {
    errCb({ status: 500, message: 'Error in Controller 1' })
  })

secondController
  .do((req, res, next, errCb, data) => {
    errCb({ status: 500, message: 'Error in Controller 2' })
  })


// connect to express
express.get('/something-1', (req, res) => {
  firstController(req, res)
})

express.get('/something-2', async (req, res) => {
  secondController(req, res)
})

```
---
### Run Tests

Run tests
```
npm test
```

For a [nyc](https://www.npmjs.com/package/nyc) html report
```
npm test:nyc
```

