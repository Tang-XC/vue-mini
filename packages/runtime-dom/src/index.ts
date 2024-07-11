import { createRenderer } from 'packages/runtime-core/src/renderer'
import { patchProp } from './patchProp'
import { nodeOps } from './nodeOps'
const rendererOptions = Object.assign({ patchProp }, nodeOps)
let renderer
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions))
}
export const render = (...args) => {
  ensureRenderer().render(...args)
}
export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)
  const { mount } = app
  app.mount = (containerOrSelector: Element | string) => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) {
      console.error('容器必须存在')
      return
    }
    mount(container)
  }
  return app
}

function normalizeContainer(container: Element | string): Element | null {
  if (typeof container === 'string') {
    const res = document.querySelector(container)
    return res
  }
  return container
}
