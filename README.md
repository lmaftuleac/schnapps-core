# Controller Chain

Chain multiple services into a single controller, similar to express middleware. Supports branching and error handling. Unlike express middleware, `controller-chain` allows to pass data through next() function. This allows to create re-usable services.

## Create a Chain 
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

## Using Branches

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

```
## Promisify

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

## Run Tests

run tests
```
npm test
```

or, for a nyc html report
```
npm test:nyc
```

