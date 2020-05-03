import { 
  LayerNodeType,
  HandlerFunction
} from './types'

export class LayerNode implements LayerNodeType {
  handler: HandlerFunction
  nextNode: LayerNode | null

  constructor (handler: HandlerFunction) {
    this.handler = handler
    this.nextNode = null
  }

  link (node: LayerNode) {
    if (node === this) {
      throw new Error('Cannot link layer to itself')
    }
    if (node instanceof LayerNode) {
      this.nextNode = node
    }
  }
}


