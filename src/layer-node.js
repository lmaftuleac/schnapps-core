class LayerNode {
  constructor (handler) {
    this.handler = handler
    this.nextNode = null
  }

  link (node) {
    if (node === this) {
      throw new Error('Cannot link layer to itself')
    }
    if (node instanceof LayerNode) {
      this.nextNode = node
    }
  }
}

module.exports = LayerNode
