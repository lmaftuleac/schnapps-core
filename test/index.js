/* eslint-disable no-undef */
const { expect } = require('chai')
const ControllerChain = require('../index')
const LayerNode = require('../src/layer-node')

describe('Test ChainController creation', function () {
  it('should create chainable controller', function () {
    const chain = new ControllerChain()

    expect(chain.nodes).to.be.an('array')
    expect(typeof chain).to.equal('function')
    expect(typeof chain.catch).to.equal('function')
    expect(typeof chain.end).to.equal('function')
    expect(typeof chain.getFirstNode).to.equal('function')
    expect(typeof chain.getLastNode).to.equal('function')
    expect(typeof chain.do).to.equal('function')
    expect(chain.__self__ instanceof ControllerChain).to.be.equal(true)
  })

  it('should add nodes to chain', function () {
    const chain = new ControllerChain()
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
    const chain = new ControllerChain()
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
    expect(responseAfterDo.__self__ instanceof ControllerChain).to.equal(true)

    chain
      .do(handler2)
      .end(end)
      .catch(error)(reqMock, resMock, initialData)
  })

  it('should use a branch using next', function () {
    const chain = new ControllerChain()
    const branch = new ControllerChain()

    const reqMock = {}
    const resMock = {}

    branch
      .do((req, res, next, errCb, data) => {
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
    const chain = new ControllerChain()
    const branch = new ControllerChain()

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
    const chain = new ControllerChain()
    const branch1 = new ControllerChain()
    const branch2 = new ControllerChain()

    const reqMock = {}
    const resMock = {}

    branch1
      .do((req, res, next, errCb, data) => {
        data.passedBranch1 = true
        next(data)
      })

    branch2
      .do((req, res, next, errCb, data) => {
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

  it('should use a global error handler', function () {
    const chain = new ControllerChain()
    const branch1 = new ControllerChain()

    const reqMock = {}
    const resMock = {}

    ControllerChain.setDefaultErrorHandler((req, res, data) => {
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
    const chain = new ControllerChain()
    const reqMock = {}
    const resMock = {}

    chain
      .do((req, res, next, errCb, data) => {
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
    const chain = new ControllerChain()
    const reqMock = {}
    const resMock = {}

    chain
      .do((req, res, next, errCb, data) => {
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
    const chain = new ControllerChain()
    const reqMock = {}
    const resMock = {}

    chain
      .do((req, res, next, errCb, data) => {
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
    const chain = new ControllerChain()
    const reqMock = {}
    const resMock = {}

    chain
      .do((req, res, next, errCb, data) => {
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
    const chain = new ControllerChain()
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
    const branch = new ControllerChain()
    const chain = new ControllerChain()

    chain.do((req, res, next, errCb, data) => {
      next(branch)
    })

    try {
      chain({}, {}, {})
    } catch (error) {
      expect(error.message).to.equals('Provided branch does not have nodes')
    }
  })
})
