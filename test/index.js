/* eslint-disable no-undef */
const { expect } = require('chai')
const { controller } = require('../dist')
const { ControllerBackbone } = require('../dist/controller-backbone')
const { LayerNode } = require('../dist/layer-node')

describe('Test Controller creation', function () {
  it('should create chainable controller', function () {
    const chain = controller()

    expect(typeof chain).to.equal('function')
    expect(typeof chain.catch).to.equal('function')
    expect(typeof chain.end).to.equal('function')
    expect(typeof chain.do).to.equal('function')
    expect(chain.backbone instanceof ControllerBackbone).to.be.equal(true)
  })

  it('should add nodes to chain', function () {
    const chain = controller()
    const handler1 = (req, res, next, errCb, data) => {}
    const handler2 = (req, res, next, errCb, data) => {}

    expect(chain.backbone.nodes.length).to.equal(0)
    chain.do(handler1)
    expect(chain.backbone.nodes.length).to.equal(1)

    const layerNode = chain.backbone.getFirstNode()

    expect(layerNode instanceof LayerNode).to.equal(true)
    expect(layerNode.handler).to.equal(handler1)
    expect(layerNode.nextNode).to.equal(null)
    chain.do(handler2)
    expect(chain.backbone.nodes.length).to.equal(2)
    expect(layerNode.nextNode instanceof LayerNode).to.equal(true)
  })

  it('should add handlers to chain', function () {
    const chain = controller()
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
    expect(responseAfterDo.backbone instanceof ControllerBackbone).to.equal(true)

    chain
      .do(handler2)
      .end(end)
      .catch(error)(reqMock, resMock, initialData)
  })

  it('should use a branch using next', function () {
    const chain = controller()
    const branch = controller()

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
    const chain = controller()
    const branch = controller()

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
    const chain = controller()
    const branch1 = controller()
    const branch2 = controller()

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
    const chain1 = controller()
    const chain2 = controller()
    const branch1 = controller()
    const branch2 = controller()

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

  it('should include handlers using beforeAll', function () {
    const chain = controller()

    const reqMock = {}
    const resMock = {}

    chain
      .do((req, res, next, errCb, data) => {
        data.push('handler_1')
        next(data)
      })
      .do((req, res, next, errCb, data) => {
        data.push('handler_2')
        next(data)
      })
      .beforeAll((req, res, next, errCb, data) => {
        data.push('handler_3')
        next(data)
      })
      .beforeAll((req, res, next, errCb, data) => {
        data.push('handler_4')
        next(data)
      })
      .do((req, res, next, errCb, data) => {
        data.push('handler_5')
        next(data)
      })

    const data = []
    chain(reqMock, resMock, data)
    expect(data[0]).to.equal('handler_4')
    expect(data[1]).to.equal('handler_3')
    expect(data[2]).to.equal('handler_1')
    expect(data[3]).to.equal('handler_2')
    expect(data[4]).to.equal('handler_5')
  })

  it('should include branches using beforeAll', function () {
    const chain = controller()
    const branch1 = controller()
    const branch2 = controller()

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

    chain
      .do(branch1)
      .beforeAll(branch2)
      .do((req, res, next, errCb, data) => {
        data.push('chain1_handler_2')
      })

    const data = []
    chain(reqMock, resMock, data)
    expect(data[0]).to.equal('branch2')
    expect(data[1]).to.equal('branch1_handler_1')
    expect(data[2]).to.equal('branch1_handler_2')
  })

  it('should use a global error handler', function () {
    const chain = controller()
    const branch1 = controller()

    const reqMock = {}
    const resMock = {}

    controller.setDefaultErrorHandler((req, res, data) => {
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
    const chain = controller()
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
    const chain = controller()
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
    const chain = controller()
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
    const chain = controller()
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
    const chain = controller()
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
    const branch = controller()
    const chain = controller()

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
    const branch1 = controller()
    const branch2 = controller()
    const chainError = controller()
    const chainOk = controller()

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
    const chainOk = controller()

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

  it('should create a controller with handlers as constructor input', async () => {

    const handler1 = (req, res, next, errCb, data) => {
      data.push('handler 1')
      next(data)
    }

    const handler2 = (req, res, next, errCb, data) => {
      data.push('handler 2')
      next(data)
    }
    
    const ctrl = controller(handler1, handler2)

    const reqMock = {}
    const resMock = {}
    const data = []

    ctrl
      .end((req, res, errCb, data) => {
        data.push('end')
      })

    ctrl(reqMock, resMock, data);
    expect(data[0]).to.equal('handler 1')
    expect(data[1]).to.equal('handler 2')
    expect(data[2]).to.equal('end')
  })
  
  it('should create a controller with other controllers as constructor input', async () => {

    const handler1 = (req, res, next, errCb, data) => {
      data.push('handler 1')
      next(data)
    }

    const handler2 = (req, res, next, errCb, data) => {
      data.push('handler 2')
      next(data)
    }
    
    const ctrl1 = controller()

    ctrl1.do((req, res, next, errCb, data) => {
      data.push('handler 3')
      next(data);
    })

    const ctrl2 = controller(handler1, handler2, ctrl1)
    

    const reqMock = {}
    const resMock = {}
    const data = []

    ctrl2
      .end((req, res, errCb, data) => {
        data.push('end')
      })

    ctrl2(reqMock, resMock, data);
    expect(data[0]).to.equal('handler 1')
    expect(data[1]).to.equal('handler 2')
    expect(data[2]).to.equal('handler 3')
    expect(data[3]).to.equal('end')
  })
  
  it('should throw error if constructor input is not a valid handler', () => {
    try {
      const ctrl = controller('bad input')
    } catch( error ) {
      expect(error.message).to.equal('Bad input type provided')
    }
  })

  it('should handle error in catch when an exception is thrown', () => {
    const ctrl = controller();
    controller.setDefaultErrorHandler((req, res, error) => {
      expect(error.message).to.equal("Cannot set property 'b' of undefined");
    })

    ctrl.do((req, res, errCb, data) => {
      const a = undefined;
      a.b = 1;
    })
    
    const ctrl2 = controller(ctrl);

    ctrl2.catch((req, res, error) => {
      expect(error.message).to.equal("Cannot set property 'b' of undefined");
    })

    const ctrl3 = controller(ctrl);

    const reqMock = {}
    const resMock = {}
    const data = []

    ctrl2(reqMock, resMock, data);
    ctrl3(reqMock, resMock, data);
  })

})
