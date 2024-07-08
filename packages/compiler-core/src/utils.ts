import { NodeTypes } from './ast'
import { CREATE_VNODE, CREATE_ELEMENT_VNODE } from './runtimeHelpers'

export function isText(node) {
  // 节点类型为插值表达式或者文本
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}
export function getVNodeHelper(ssr: boolean, isComponent: boolean) {
  return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE
}
