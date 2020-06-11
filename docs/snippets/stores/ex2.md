```javascript
const  { controller, session, shared } = require('@schnapps/core')

const UserDetailsWithBalance = controller(session, shared);

UserDetailsWithBalance
  // ... 
  .do((req, res, next, errCb, data) => { 
    const { userId } = req.session;
    return next({ userId });
  })
  .do(UserService.getUserDetailsByUserId)
  .do((req, res, next, errCb, userDetails) => {
    req.setShared({details: userDetails});
    const { userId } = req.session;
    return next({ userId });
  })
  .do(BalanceService.getBalanceByUserId)
  .do((req, res, next, errCb, userBalance) => {
    req.setShared({balance: userBalance});
    return next();
  })
  .end((req, res, next, errCb) => {
    const { details, balance } = req.shared;
    res.status(200).json({
      details, 
      balance
    })
  })
  .catch((req, res, error) => {
    res.status(error.code).send(error.message);
  })

```
