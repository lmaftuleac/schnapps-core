# Controller Chain

Chain multiple services into a single controller, similar to express middleware. Supports branching and error handling. Unlike express middleware, `controller-chain` allows to pass data through next() function. This allows to create re-usable services.


## Create a Chain 
```
const ControllerChain = require('controller-chain')

// create a chain service
const GetUserController = new ControllerChain()

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

## Using Branches

```
const ControllerChain = require('controller-chain')

// create a chain service
const MainController = new ControllerChain()
const BranchA = new ControllerChain()
const BranchB = new ControllerChain()


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
  .catch((req, res, error) => {
    res.status(500).send(error)
  })

express.get('/user/:ver', (req, res) => {
  const ver = req.params
  MainController(req, res, { ver })
})

```





