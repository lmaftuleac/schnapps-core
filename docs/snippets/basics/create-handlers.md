```javascript

/**
 * 1. Parsing and substracting Bearer Token
 */

const parseAuthorizationHeader = (req, res, next, errCb, data) => {
    /**
     * Each handler function has four parameters
     * req - request object
     * res - response object
     * next - callback to trigger next handler
     * errorCb - callback for throwing errors
     * data - optional parameter, passed by previous handler
     */

    // Check whether an authorization header is present
    const { headers } = req;
    if (!headers.authorization) {
      // Terminate flow with a 401 error
      return errorCb({
        code: 401,
        message: 'Missing Authorization Header'
      });
    }

    // Substract our session token
    const match = headers.authorization.match(/^Bearer (.*)$/)
    if (!match) {
      // Bad Header
      return errorCb({
        code: 401,
        message: 'Bad Authorization Header Format'
      });
    }
    const token = match[1];

    /**
     * NOTE: 
     * Schnapps uses next(value) to pass data to the next handler
     * while Express uses next(value) for throwing errors
     */
    return next({ token })
}

/**
 * 2. Decode Token, substract userId and role
 */

const decodeJwtToken = async (req, res, next, errCb, { token }) => {
  try {
    /**
     * At this point we should receive the token from our previous handler
     */
    const { userId, role } = await jwtVerify(token, JWT_SECRET);

    // pass role value to the next handler
    return next({ role });
  } catch(error) {

    if (error.name === 'TokenExpiredError') {
      return errCb({
        code: 401,
        message: 'Session Expired'
      });
    }

    return errCb({
      code: 401,
      message: 'Bad Authentication Token'
    });
  }
}

/**
 * 3. Access based on user role: we'll use one of these handlers to limit user access
 */

const userAccess = async (req, res, next, errCb, { role }) => {
  const accessLevel = ['USER','MAGANGER','ADMIN'];
  if ( accessLevel.contains(role) ) {
    return next({ role });
  } else {
    errorCb({
      code: 403,
      message: 'Forbidden'
    })
  }
}

const managerAccess = async (req, res, next, errCb, { role }) => {
  const accessLevel = ['MAGANGER','ADMIN'];
  if ( accessLevel.contains(role) ) {
    return next({ role });
  } else {
    errorCb({
      code: 403,
      message: 'Forbidden'
    })
  }
}

const adminAccess = async (req, res, next, errCb, { role }) => {
  const accessLevel = ['ADMIN'];
  if ( accessLevel.contains(role) ) {
    return next({ role });
  } else {
    errorCb({
      code: 403,
      message: 'Forbidden'
    })
  }
}

```
