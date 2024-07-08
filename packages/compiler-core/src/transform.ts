import { NodeTypes } from './ast'
import { isSingleElementRoot } from './hoistStatic'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export interface TransformContext {
  root
  parent: ParentNode | null
  childIndex: number
  currentNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
}
export function transform(root, options) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]
  root.components = []
  root.directives = []
  root.imports = []
  root.hoists = []
  root.temps = []
  root.cached = []
}

// 该函数用于创建一个转换上下文对象，用于在节点转换过程中保存状态和提供辅助函数
export function createTransformContext(root, { nodeTransforms = [] }) {
  const context: TransformContext = {
    nodeTransforms, // 节点转换函数列表
    root, // 根节点
    helpers: new Map(), // 辅助函数
    currentNode: root, // 当前节点
    parent: null, // 父节点
    childIndex: 0, // 当前节点索引
    // 获取辅助函数名称
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }
  return context
}

//深度优先遍历转化
export function traverseNode(node, context: TransformContext) {
  context.currentNode = node
  const { nodeTransforms } = context
  const exitFns: any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break
  }
  context.currentNode = node
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}
export function traverseChildren(parent, context: TransformContext) {
  parent.children.forEach((node, index) => {
    context.parent = parent
    context.childIndex = index
    traverseNode(node, context)
  })
}

function createRootCodegen(root) {
  const { children } = root
  // 处理单个根节点
  if (children.length === 1) {
    const child = children[0]
    // 当根节点只有一个子节点，并且子节点是元素节点
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      // 这一步意味着编译器将跳过创建额外的包裹元素，直接使用子元素的代码生成节点作为输出
      // 从而简化渲染逻辑和提高性能
      root.codegenNode = child.codegenNode
    }
  }
}
