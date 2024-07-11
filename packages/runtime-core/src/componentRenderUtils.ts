import { ShapeFlags } from '@vue/shared'
import { createVNode, Text } from './vnode'
export function normalizeVnode(child) {
  if (typeof child === 'object') {
    return cloneIfMounted(child)
  } else {
    return createVNode(Text, null, String(child))
  }
}
export function cloneIfMounted(child) {
  return child
}
export function renderComponentRoot(instance) {
  const { vnode, render, data } = instance
  let result
  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      console.log(data)
      result = normalizeVnode(render!.call(data, data))
    }
  } catch (error) {
    console.error(error)
  }
  return result
}
