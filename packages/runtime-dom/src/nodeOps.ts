const doc = document
export const nodeOps = {
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null)
  },
  createElement: (tag): Element => {
    const el = doc.createElement(tag)
    return el
  },
  setElementText: (el: Element, text) => {
    el.textContent = text
  },
  remove: (el: Element) => {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },

  createText: (text: string) => {
    return doc.createTextNode(text)
  },
  setText: (node, text) => {
    node.nodeValue = text
  }
}
