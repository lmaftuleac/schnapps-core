const ControllerChain = require('../index');
const firstBranch = require('./first-branch');
const secondBranch = require('./second-branch');

const controller = new ControllerChain();

controller
  // NOT TO BE CONFUSED WITH EXPRESS MIDDLEWARE
  .use((req, res, next) => {
    // get params
    const { branch, throwMessage } = req.query;
    
    // pass params to next function 
    // NOTE: unlike express, next(data) passes data to next function
    next({ branch, throwMessage });
  })
  .use((req, res, next, error, data) => {
    // data from previous next({...})
    const { branch, throwMessage } = data;

    if (branch === 'first') {
      // NOTE: redirect to another controller branch
      return next(
        firstBranch,      // redirect branch
        {},               // redirect options  
        { throwMessage }  // passing custom data
      );
    }

    if (branch === 'second') {
      // NOTE: redirect to another controller branch
      return next(
        secondBranch,      // redirect branch
        {},               // redirect options  
        { throwMessage }  // passing custom data
      );
    }
    
    //otherwise continue
    next()
  })
  .use((req, res, next, error) => {
    const name = 'John';
    next({ name });
  })
  .use((req, res, next, error, { name }) => {
    
    const { throwMessage } = req.query; // querry is still accessible

    if (throwMessage) {
      error({ name });
    } else {
      next({ name });
    }
    
  })
  .use((req, res, next, error, data) => {
    const { name } = data;
    next({ message: `Hello ${name}`});
  })
  .catch((req, res, errorData) => {
    const { name } = errorData;
    res.send(`sorry ${name}, we got an error`);
  })
  .end((req, res, { message }) => {
    res.send(message);
  });


module.exports = controller;