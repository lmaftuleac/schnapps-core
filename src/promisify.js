const { Chain, callNode } = require('./chain')

function promisify (chain) {
  if (
    chain &&
    typeof chain === 'function' &&
    chain.__self__ instanceof Chain
  ) {
    return (req, res, data) => {
      return new Promise((resolve, reject) => {
        const firstNode = chain.getFirstNode()

        const ok = (req, res, errCb, data) => {
          return resolve(data)
        }

        callNode(req, res, firstNode, data, reject, ok)
      })
    }
  }
}

module.exports = promisify
