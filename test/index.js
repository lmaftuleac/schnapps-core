/* eslint-disable no-undef */
const { expect } = require('chai')
const Controller = require('../index')
const LayerNode = require('../src/layer-node')

describe('Test ChainController creation', function () {
  it('should create chainable controller', function () {
    const chain = new Controller()

    expect(chain.nodes).to.be.an('array')
    expect(typeof chain).to.equal('function')
    expect(typeof chain.catch).to.equal('function')
    expect(typeof chain.end).to.equal('function')
    expect(typeof chain.getFirstNode).to.equal('function')
    expect(typeof chain.getLastNode).to.equal('function')
    expect(typeof chain.do).to.equal('function')
    expect(chain.__self__ instanceof Controller).to.be.equal(true)
  })

  it('should add nodes to chain', function () {
    const chain = new Controller()
    const handler1 = (req, res, next, errCb, data) => {}
    const handler2 = (req, res, next, errCb, data) => {}

    expect(chain.nodes.length).to.equal(0)
    chain.do(handler1)
    expect(chain.nodes.length).to.equal(1)

    const layerNode = chain.getFirstNode()

    expect(layerNode instanceof LayerNode).to.equal(true)
    expect(layerNode.handler).to.equal(handler1)
    expect(layerNode.nextNode).to.equal(null)
    chain.do(handler2)
    expect(chain.nodes.length).to.equal(2)
    expect(layerNode.nextNode instanceof LayerNode).to.equal(true)
  })

  it('should add handlers to chain', function () {
    const chain = new Controller()
    const reqMock = {}
    const resMock = {}
    const initialData = {
      passedHandler1: false,
      passedHandler2: false,
      errorCalled: false
    }

    const handler1 = (req, res, next, errCb, data) => {
      expect(req).to.equal(reqMock)
      expect(res).to.equal(resMock)
      expect(data).to.equal(initialData)
      data.passedHandler1 = true
      next(data)
    }

    const handler2 = (req, res, next, errCb, data) => {
      expect(data).to.equal(initialData)
      expect(data.passedHandler1).to.equal(true)
      data.passedHandler2 = true
      next(data)
    }

    const end = (req, res, errCb, data) => {
      expect(data).to.equal(initialData)
      expect(data.passedHandler2).to.equal(true)
      data.errorCalled = true
      errCb(data)
    }

    const error = (req, res, data) => {
      expect(req).to.equal(reqMock)
      expect(res).to.equal(resMock)
      expect(data).to.equal(initialData)
      expect(data.errorCalled).to.equal(true)
    }

    const responseAfterDo = chain.do(handler1)
    expect(typeof responseAfterDo).to.equal('function')
    expect(typeof responseAfterDo.do).to.equal('function')
    expect(responseAfterDo.__self__ instanceof Controller).to.equal(true)

    chain
      .do(handler2)
      .end(end)
      .catch(error)(reqMock, resMock, initialData)
  })

  it('should use a branch using next', function () {
    const chain = new Controller()
    const branch = new Controller()

    const reqMock = {}
    const resMock = {}

    branch.do((req, res, next, errCb, data) => {
      data.passedBranch = true
      next(data)
    })

    chain
      .do((req, res, next, errCb, data) => {
        data.startInChain = true
        next(branch, data)
      })
      .do((req, res, next, errCb, data) => {
        data.backFromBranch = true
        next(data)
      })
      .end((req, res, errCb, data) => {
        data.endInMainChain = true
      })
      .catch((req, res, data) => {})

    const data1 = {}
    chain(reqMock, resMock, data1)
    expect(data1.startInChain).to.equal(true)
    expect(data1.passedBranch).to.equal(true)
    expect(data1.backFromBranch).to.equal(true)
    expect(data1.endInMainChain).to.equal(true)
  })

  it('should reroute to branch using next', function () {
    const chain = new Controller()
    const branch = new Controller()

    const reqMock = {}
    const resMock = {}

    branch
      .do((req, res, next, errCb, data) => {
        data.passedBranch = true
        next(data)
      })
      .end((req, res, errCb, data) => {
        data.endInBranch = true
        errCb(data)
      })
      .catch((req, res, data) => {
        data.errorInBranch = true
      })

    chain
      .do((req, res, next, errCb, data) => {
        data.startInChain = true
        next(branch, data, { reroute: true })
      })
      .end((req, res, errCb, data) => {
        data.endInMainChain = true
      })
      .catch((req, res, data) => {})

    const data2 = {}
    chain(reqMock, resMock, data2)
    expect(data2.startInChain).to.equal(true)
    expect(data2.passedBranch).to.equal(true)
    expect(data2.endInBranch).to.equal(true)
    expect(data2.errorInBranch).to.equal(true)
  })

  it('should include branch directly into chain', function () {
    const chain = new Controller()
    const branch1 = new Controller()
    const branch2 = new Controller()

    const reqMock = {}
    const resMock = {}

    branch1.do((req, res, next, errCb, data) => {
      data.passedBranch1 = true
      next(data)
    })

    branch2.do((req, res, next, errCb, data) => {
      data.passedBranch2 = true
      next(data)
    })

    chain
      .do((req, res, next, errCb, data) => {
        data.startInChain = true
        next(data)
      })
      .do(branch1)
      .do(branch2)
      .do((req, res, next, errCb, data) => {
        data.backInChain = true
        next(data)
      })
      .end((req, res, errCb, data) => {
        data.endInMainChain = true
        errCb(data)
      })
      .catch((req, res, data) => {
        data.errorInChain = true
      })

    const data = {}
    chain(reqMock, resMock, data)
    expect(data.startInChain).to.equal(true)
    expect(data.passedBranch1).to.equal(true)
    expect(data.passedBranch2).to.equal(true)
    expect(data.backInChain).to.equal(true)
    expect(data.endInMainChain).to.equal(true)
    expect(data.errorInChain).to.equal(true)
  })

  it('should include branches in many chains', function () {
    const chain1 = new Controller()
    const chain2 = new Controller()
    const branch1 = new Controller()
    const branch2 = new Controller()

    const reqMock = {}
    const resMock = {}

    branch1
      .do((req, res, next, errCb, data) => {
        data.push('branch1_handler_1')
        next(data)
      })
      .do((req, res, next, errCb, data) => {
        data.push('branch1_handler_2')
        next(data)
      })

    branch2.do((req, res, next, errCb, data) => {
      data.push('branch2')
      next(data)
    })

    chain1
      .do((req, res, next, errCb, data) => {
        data.push('chain1_handler_1')
        next(data)
      })
      .do(branch1)
      .do(branch2)
      .do((req, res, next, errCb, data) => {
        data.push('chain1_handler_2')
        errCb(data)
      })
      .catch((req, res, data) => {
        data.push('chain1_error')
      })

    chain2
      .do((req, res, next, errCb, data) => {
        data.push('chain2_handler_1')
        next(data)
      })
      .do(branch1)
      .do(branch2)
      .do((req, res, next, errCb, data) => {
        data.push('chain2_handler_2')
        next(data)
      })
      .end((req, res, errCb, data) => {
        data.push('chain2_end')
        errCb(data)
      })
      .catch((req, res, data) => {
        data.push('chain2_error')
      })

    const data1 = []
    chain1(reqMock, resMock, data1)
    expect(data1[0]).to.equal('chain1_handler_1')
    expect(data1[1]).to.equal('branch1_handler_1')
    expect(data1[2]).to.equal('branch1_handler_2')
    expect(data1[3]).to.equal('branch2')
    expect(data1[4]).to.equal('chain1_handler_2')
    expect(data1[5]).to.equal('chain1_error')
    expect(data1.length).to.equal(6)

    const data2 = []
    chain2(reqMock, resMock, data2)
    expect(data2[0]).to.equal('chain2_handler_1')
    expect(data2[1]).to.equal('branch1_handler_1')
    expect(data2[2]).to.equal('branch1_handler_2')
    expect(data2[3]).to.equal('branch2')
    expect(data2[4]).to.equal('chain2_handler_2')
    expect(data2[5]).to.equal('chain2_end')
    expect(data2[6]).to.equal('chain2_error')
    expect(data2.length).to.equal(7)
  })

  it('should use a global error handler', function () {
    const chain = new Controller()
    const branch1 = new Controller()

    const reqMock = {}
    const resMock = {}

    Controller.setDefaultErrorHandler((req, res, data) => {
      data.catchErrorInGlobalHandler = true
    })

    branch1
      .do((req, res, next, errCb, data) => {
        data.passedBranch1 = true
        next(data)
      })
      .do((req, res, next, errCb, data) => {
        errCb(data)
      })

    chain
      .do((req, res, next, errCb, data) => {
        data.startInChain = true
        next(data)
      })
      .do(branch1)
      .do((req, res, next, errCb, data) => {
        // should not reach
        data.finalHandlerReached = true
      })

    const data1 = {}
    branch1(reqMock, resMock, data1)
    expect(data1.passedBranch1).to.equal(true)
    expect(data1.catchErrorInGlobalHandler).to.equal(true)

    const data2 = { finalHandlerReached: false }
    chain(reqMock, resMock, data2)
    expect(data2.passedBranch1).to.equal(true)
    expect(data2.catchErrorInGlobalHandler).to.equal(true)
    expect(data2.finalHandlerReached).to.equal(false)
  })

  it('should throw error on double next calls', function () {
    const chain = new Controller()
    const reqMock = {}
    const resMock = {}

    chain.do((req, res, next, errCb, data) => {
      next(data)
      next(data)
    })

    try {
      chain(reqMock, resMock, {})
    } catch (error) {
      expect(error.message).to.equals('next() was already called')
    }
  })

  it('should throw error on double error calls', function () {
    const chain = new Controller()
    const reqMock = {}
    const resMock = {}

    chain.do((req, res, next, errCb, data) => {
      errCb(data)
      errCb(data)
    })

    try {
      chain(reqMock, resMock, {})
    } catch (error) {
      expect(error.message).to.equals('error() was already called')
    }
  })

  it('should throw error on call error after next', function () {
    const chain = new Controller()
    const reqMock = {}
    const resMock = {}

    chain.do((req, res, next, errCb, data) => {
      next(data)
      errCb(data)
    })

    try {
      chain(reqMock, resMock, {})
    } catch (error) {
      expect(error.message).to.equals('Cannot call Error after Next was called')
    }
  })

  it('should throw error on call error after next', function () {
    const chain = new Controller()
    const reqMock = {}
    const resMock = {}

    chain.do((req, res, next, errCb, data) => {
      errCb(data)
      next(data)
    })

    try {
      chain(reqMock, resMock, {})
    } catch (error) {
      expect(error.message).to.equals('Cannot call Next after Error was called')
    }
  })

  it('should throw error on chains with no handlers', function () {
    const chain = new Controller()
    const reqMock = {}
    const resMock = {}

    try {
      chain(reqMock, resMock, {})
    } catch (error) {
      expect(error.message).to.equals('No handlers found for curent controller')
    }
  })

  it('should throw error when linking layer to itself', function () {
    const node = new LayerNode(() => {})

    try {
      node.link(node)
    } catch (error) {
      expect(error.message).to.equals('Cannot link layer to itself')
    }
  })

  it('should throw error when a branch with no layers is passed to next', function () {
    const branch = new Controller()
    const chain = new Controller()

    chain.do((req, res, next, errCb, data) => {
      next(branch)
    })

    try {
      chain({}, {}, {})
    } catch (error) {
      expect(error.message).to.equals('Provided branch does not have nodes')
    }
  })

  it('should run a chain as promise', async () => {
    const branch1 = new Controller()
    const branch2 = new Controller()
    const chainError = new Controller()
    const chainOk = new Controller()

    const reqMock = {}
    const resMock = {}

    branch1.do((req, res, next, errCb, data) => {
      data.push('passBranch1')
      next(data)
    })

    branch2.do((req, res, next, errCb, data) => {
      data.push('passBranch2')
      next(data)
    })

    chainError
      .do(branch1)
      .do(branch2)
      .do((req, res, next, errCb, data) => {
        data.push('errorInChain')
        errCb(data)
      })

    chainOk
      .do(branch1)
      .do(branch2)
      .do((req, res, next, errCb, data) => {
        data.push('ok')
        next(data)
      })
      .end((req, res, errCb, data) => {
        data.push('not_called_on_promise')
      })

    const data1 = []
    try {
      await chainError.promise(reqMock, resMock, data1)
    } catch (error) {
      expect(error[0]).to.equal('passBranch1')
      expect(error[1]).to.equal('passBranch2')
      expect(error[2]).to.equal('errorInChain')
      expect(error.length).to.equal(3)
    }

    const data2 = []
    const response = await chainOk.promise(reqMock, resMock, data2)
    expect(response[0]).to.equal('passBranch1')
    expect(response[1]).to.equal('passBranch2')
    expect(response[2]).to.equal('ok')
    expect(response.length).to.equal(3)

    const data3 = []
    chainOk(reqMock, resMock, data3)
    expect(data3[0]).to.equal('passBranch1')
    expect(data3[1]).to.equal('passBranch2')
    expect(data3[2]).to.equal('ok')
    expect(data3[3]).to.equal('not_called_on_promise')
    expect(data3.length).to.equal(4)
  })

  it('should run a chain as express middleware', async () => {
    const chainOk = new Controller()

    const reqMock = {}
    const resMock = {}
    const data = []

    chainOk
      .do((req, res, next, errCb) => {
        next(data)
      })
      .do((req, res, next, errCb, data) => {
        data.push('ok')
        next(data)
      })
      .end((req, res, errCb, data) => {
        data.push('not_called_on_middlewares')
      })

    const middleware = chainOk.toMiddleware()
    const next = () => {
      data.push('express_next_called')
    }
    expect(typeof middleware).to.equal('function')
    middleware(reqMock, resMock, next)

    expect(data[0]).to.equal('ok')
    expect(data[1]).to.equal('express_next_called')
  })
})
