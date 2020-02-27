# Controller Chain

Chain multiple services into a single controller, similar to express middleware. Supports branching and error handling. Unlike express middleware, `controller-chain` allows to pass data through next() function. This allows to create re-usable services and re-usable service sequences.

## Controller Chain Object
A controller is an object that chains multiple handlers together. It can be regarded as a wrapper that chains a set of handlers (services) in a specific order

```
const { Chain } = require('controller-chain')

// Create a new controller
const Controller = new Chain()

// add handlers
Controller
  .do(<handler>) 
  .do(<handler>)
  .do(<handler>)
  /* optional */
  .end(<handler>)
  .catch(<errorHandler>)

// use with express
express.get('/', (req, res) => Controller(req, res, {data: 'some-initial-data'}))

```

## Handler function
A handler is a function similar to a middleware in express. It is used for a specific task, when 
```
/**
 * Add two numbers together
 * @param  {Object} req Express request object
 * @param  {Object} res Express response object
 * @param  {Function} next A callback function, triggers next handler defined in controller chain
 * @param  {Function} errCb error callback function.
 * @param  {Any} data Data object passed from previous handler
 */
const handler = function (req, res, next, errCb, data) {
	// do something here
};
```

## next function
similar to express, `next()` triggers next handler, with a small difference: instead of passing an error (in express) it passes data to the next handler. We can also use next() re-use another chain controller
```
const getUserIdHandler = (req, res, next, errCb, data) {
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

const GetUserController = new Chain();

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
In case we want to re-use another controller, pass controller as first parameter and data as second. 
In this case however only the handlers will be called from `GetUserController` without calling `.end()` or `.catch()` since parent controller has it's own end and catch functions.

```
Controller = new Chain()

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
In case we want to completely reroute our request, we need to pas a third parameter with `{ reroute: true }` in this case request will be completely handled by the controller passed in next() function, and the handlers below will be ignored along with `.catch` and `.end` functions


```
Controller = new Chain()

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
    // this will be ignored
  })
  .end((req, res, errCb, user) => {
    // this will be ignored
  })
  .catch((req, res, error) => {
    // this will be ignored
  })

```

---
# Examples

### Create a Chain 
```
const { Chain } = require('controller-chain')

// create a chain
const GetUserController = new Chain()

// add handlers, similar to express route.use
GetUserController
  .do(( req, res, next, errCb, data) => {
    console.log('user', data.user);
    data.today = new Date();
    return next(data)
  })
  .do(( req, res, next, errCb, data) => {
    return res.send(data)
  })

express.get('/user', (req, res) => {
  const someInitialData = {
    user: 'John Doe';
  }
  // call chain controller
  GetUserController(req, res, someInitialData)
})

```

### Using Branches

```
const { Chain } = require('controller-chain')

const MainController = new Chain()
const BranchA = new Chain()
const BranchB = new Chain()


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

const SecondController = new Chain()

SecondController.do(BranchA)

express.get('/return-A', (req, res) => {
  SecondController(req, res)
})

```

### Promisify

use `promisify(chain)(req, res, data)` to call a chain  as a promise

```
const { Chain, promisify } = require('controller-chain')

const MainController = new Chain()
const BranchA = new Chain()
const BranchB = new Chain()


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
    data = await promisify(MainController)(req, res, { ver })
    res.send(data)
  } catch(error) {
    res.send(error)
  }
})

```

### Global Error Handler

Provide a global error handler

```
const { Chain } = require('controller-chain')

Chain.setDefaultErrorHandler((req, res, error) => {
  // hanlde error
  res.status(error.status).send(error.message)
})

const firstController = new Chain()
const secondController = new Chain()

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

run tests
```
npm test
```

or, for a nyc html report
```
npm test:nyc
```

