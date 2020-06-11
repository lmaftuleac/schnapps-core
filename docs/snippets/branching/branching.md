```javascript
const { controller } = require('@schnapps/core')

const CreateUser = controller()
CreateUser
  .do((req, res, next, errCb, body) => {
    // code for creating user
    // ...
    next(newUser)
  })

const RewardPartner = controller()
RewardPartner
  .do((req, res, next, errCb, newUser) => {
    // code for rewarding partner
    // ...
    next(newUser)
  })

const RewardUser = controller()
RewardUser
  .do((req, res, next, errCb, newUser) => {
    // code for rewarding user
    // ...
    next(newUser)
  })

const RegisterUser = controller()
RegisterUser
  .do((req, res, next, errCb) => {
    // take user raw data from body and pass it as input for creating user
    const body = req.body;

    // we can as well validate it against a schema at this point
    if (userSchema.validate(body)) {
      return next(body);
    } else {
      return errCb({
        code: 400,
        mesage: 'Invalid input data'
      })
    }
  })
  .do(CreateUser)
  .do(async (req, res, next, errCb, newUser) => {
    const { referrerCode } = newUser;

    // No referrer code, skip to next handler
    if (!referrerCode) {
      return next(newUser);
    }

    // check role
    const role = await db.selet('*').from('users').where('refCode', referrerCode);

    /** 
     * next() can be used to redirect the flow to another controller.
     * Simply pass the controller as first parameter.
     * The second parameter represents the input data to that controller.
     * Once all handlers are passed, the flow will resume further down the current pipeline
     * In case an error is triggered within a child controller, it will be cought by the
     * error handler in the current pipeline
     */
    switch(role) {
      case 'PARTNER':
        return next(RewardPartner, newUser)
      case 'USER':
        return next(RewardUser, newUser)
      default:
        return errCb({
          code: 500,
          message: 'Server Error'
        })
    }
  })
  .do((req, res, errCb, user) => {
    // Our flow will resume here
    next(user);
  })
  .end((req, res, errCb, user) => {
    res.json(user);
  })
  .catch((req, res, error) => {
    res.status(error.code).send(error.message);
  })

```