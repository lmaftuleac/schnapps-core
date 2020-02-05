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
    console.log('second branch error', errorData);
    res.send(`second branch error: ${errorData}`);
  })
  .end((req, res, data) => {
    res.send('Second branch greets you');
  })

module.exports = firstBranch;