const ControllerChain = require('../index');

const firstBranch = new ControllerChain();

firstBranch
  .use((req, res, next, error, data) => {
    const { throwMessage } = data;

    if (throwMessage) {
      error(throwMessage);
    } else {
      next();
    }
  })
  .catch((req, res, errorData) => {
    console.log('first branch error', errorData);
    res.send(`first branch error: ${errorData}`);
  })
  .end((req, res, data) => {
    res.send('First branch greets you');
  })

module.exports = firstBranch;