import { NodeTypes } from './ast'

export function isText(node) {
  // 节点类型为插值表达式或者文本
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
}
