import { LayerNode } from './layer-node'
import {
  RequestObj,
  ResponseObj,
  ControllerBackboneClass,
  ControllerFunction,
  LayerNodeType,
  EndChainCallback,
  ErrorCallback,
  CatchErrorCallback,
  HandlerFunction,
  NextFunction,
  BranchOptions,
} from './types'

const BRANCH_OPTS: BranchOptions = {
  reroute: false
}

const isHandler = (fn: any) => typeof fn === 'function' && !(fn.backbone instanceof ControllerBackbone)
const isController = (fn: any) => (typeof fn === 'function' && fn.backbone instanceof ControllerBackbone)

export class ControllerBackbone implements ControllerBackboneClass {
  nodes: LayerNodeType[] = []
  endCallback: EndChainCallback | null = null
  catchCallback: CatchErrorCallback | null = null
  catchFn = null
  controller: ControllerFunction

  constructor () {
    this.controller = function(req: RequestObj, res: ResponseObj, data: any) {
      // @ts-ignore
      this.start(req, res, data)
    }.bind(this)
  }

  /** Private */

  start (req: RequestObj, res: ResponseObj, data: any) {
    const firstNode = this.getFirstNode()

    if (!firstNode) {
      throw new Error('No handlers found for curent controller')
    }

    // error callback for cycle runner
    const errCb: ErrorCallback = (err) => {
      if (typeof this.catchCallback === 'function') {
        return this.catchCallback(req, res, err)
      }
      return ControllerBackbone.__errorHandler(req, res, err)
    }

    // success callback for cycle runner
    const doneCb = (req: RequestObj, res: ResponseObj, errCb: ErrorCallback, data: any) => {
      if (this.endCallback) {
        this.endCallback(req, res, errCb, data)
      }
    }

    return callNode(req, res, firstNode, data, errCb, doneCb)
  }

  getFirstNode (): LayerNodeType | undefined {
    if (this.nodes[0]) {
      return this.nodes[0]
    }
  }

  getLastNode (): LayerNodeType | undefined {
    if (this.nodes.length) {
      return this.nodes[this.nodes.length - 1]
    }
  }

  pushNode (node: LayerNodeType) {
    const lastNode = this.getLastNode()
    if (lastNode) {
      lastNode.link(node)
    }
    this.nodes.push(node)
  }

  unshiftNode (node: LayerNodeType) {
    const firstNode = this.getFirstNode()
    if (firstNode) {
      node.link(firstNode)
    }
    this.nodes.unshift(node)
  }

  appendNodes (nodes: LayerNodeType[]) {
    nodes.forEach((node) => {
      const { handler } = node
      const nodeCopy = new LayerNode(handler)
      this.pushNode(nodeCopy)
    })
  }

  prependNodes (nodes: LayerNodeType[]) {
    nodes.slice().reverse().forEach((node) => {
      const { handler } = node
      const nodeCopy = new LayerNode(handler)
      this.unshiftNode(nodeCopy)
    })
  }

  /** Public */

  beforeAll (handler) {
    if (isHandler(handler)) {
      // include handler function
      const node = new LayerNode(handler)
      this.unshiftNode(node)
    } else if (isController(handler)) {
      // include another Controller
      const childBranch = handler
      const childNodes = childBranch.backbone.nodes
      if (!childNodes.length) {
        throw new Error('Provided branch does not have nodes')
      }
      this.prependNodes(childNodes)
    } else {
      throw new Error('Bad input type provided')
    }
    return this.controller
  }

  do (handler) {
    if (isHandler(handler)) {
      
      // include handler function
      const node = new LayerNode(handler)
      this.pushNode(node)
    } else if (isController(handler)) {
      // include another Controller
      const childBranch = handler
      const childNodes = childBranch.backbone.nodes
      if (!childNodes.length) {
        throw new Error('Provided branch does not have nodes')
      }
      this.appendNodes(childNodes)
    } else {
      throw new Error('Bad input type provided')
    }
    return this.controller
  }

  middleware () {
    return (req: RequestObj, res: ResponseObj, expressNext: Function) => {
      const firstNode = this.getFirstNode()
      if (!firstNode) {
        throw new Error('Provided branch does not have nodes')
      }
      const doneCb = () => expressNext()
      const errCb: ErrorCallback = (err) => {
        if (typeof this.catchCallback === 'function') {
          return this.catchCallback(req, res, err)
        }
        return ControllerBackbone.__errorHandler(req, res, err)
      }

      callNode(req, res, firstNode, {}, errCb, doneCb)
    }
  }

  promise (req: RequestObj, res: ResponseObj, data: any) {
    const firstNode = this.getFirstNode()
    
    if (!firstNode) {
      throw new Error('Provided branch does not have nodes')
    }

    return new Promise((resolve, reject) => {
      const ok = (req: RequestObj, res: ResponseObj, errCb: ErrorCallback, data: any) => {
        return resolve(data)
      }

      callNode(req, res, firstNode, data, reject, ok)
    })
  }

  catch (errorHandler: CatchErrorCallback) {
    if (typeof errorHandler === 'function') {
      this.catchCallback = errorHandler
    }
    return this.controller
  }

  end (endCallback: EndChainCallback) {
    if (typeof endCallback === 'function') {
      this.endCallback = endCallback
    }
    return this.controller
  }

  static __errorHandler (req: RequestObj, res: ResponseObj, error: any) {
    throw new Error(error);
  }

  static setDefaultErrorHandler (customErrorHandler: CatchErrorCallback) {
    ControllerBackbone.__errorHandler = customErrorHandler
  }
}

const callNode = (req: RequestObj, res: ResponseObj, node: LayerNodeType, customData: any, errCb: ErrorCallback, doneCb: Function) => {
  let errorCalled = false
  let nextCalled = false

  const next: NextFunction = (...args) => {
    // prevent going into next if error was called previously
    if (errorCalled) {
      throw new Error('Cannot call Next after Error was called')
    }

    // prevent multiple next calls
    if (nextCalled) {
      throw new Error('next() was already called')
    }

    // mark as called
    nextCalled = true

    let branch, data, opts

    // get data inputs
    if (typeof args[0] === 'function' && (args[0].backbone instanceof ControllerBackbone)) {
      branch = args[0]
      opts = { ...BRANCH_OPTS, ...args[2] }
      data = args[1]
    } else {
      data = args[0]
    }

    // handle branch redirects
    if (branch) {
      const { reroute } = opts || {}

      // re-routing to separate branch
      if (reroute) {
        return branch(req, res, data)
      }

      // call branch chain
      const branchNode = branch.backbone.getFirstNode()
      if (branchNode) {
        // success callback for child branch
        const doneWrapper = (req: RequestObj, res: ResponseObj, errCb: ErrorCallback, data: any) => {
          if (node.nextNode) {
            return callNode(req, res, node.nextNode, data, errCb, doneCb)
          } else if (doneCb) {
            return doneCb(req, res, errCb, data)
          }
        }

        // start branch chain
        return callNode(req, res, branchNode, data, errCb, doneWrapper)
      } else {
        throw new Error('Provided branch does not have nodes')
      }
    }

    // continue to next handler
    if (node.nextNode) {
      return callNode(req, res, node.nextNode, data, errCb, doneCb)
    } else if (doneCb) {
      return doneCb(req, res, errCb, data)
    }
  }

  const error: ErrorCallback = err => {
    // prevent going into next if error was called previously
    if (errorCalled) {
      throw new Error('error() was already called')
    }

    // prevent multiple next calls
    if (nextCalled) {
      throw new Error('Cannot call Error after Next was called')
    }

    // mark as called
    errorCalled = true

    return errCb(err)
  }
  try {
    return node.handler(req, res, next, error, customData)
  } catch(err) {
    return errCb(err)
  }
}
