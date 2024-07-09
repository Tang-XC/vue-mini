import { NodeTypes, createConditionalExpression } from '../ast'
import { CREATE_COMMIT } from '../runtimeHelpers'
import { TransformContext } from '../transform'
import { createStructuralDirectiveTransform } from '../transform'
import {
  getMemoedVNodeCall,
  createCallExpression
} from 'packages/compiler-core/src/utils'

export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      let key = 0
      return () => {
        if (isRoot) {
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context)
        } else {
          // TODO: 非根
        }
      }
    })
  }
)

export function processIf(
  node,
  dir,
  context: TransformContext,
  processCodegen?: (node, branch, isRoot: boolean) => () => void
) {
  if (dir.name === 'if') {
    const branch = createIfBranch(node, dir)
    const ifNode = {
      type: NodeTypes.IF,
      loc: {},
      branches: [branch]
    }
    context.replaceNode(ifNode)

    if (processCodegen) {
      return processCodegen(ifNode, branch, true)
    }
  }
}

function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    loc: {},
    condition: dir.exp,
    children: [node]
  }
}

function createCodegenNodeForBranch(
  branch,
  keyIndex,
  context: TransformContext
) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      createChildrenCodegenNode(branch, keyIndex),
      createCallExpression(context.helper(CREATE_COMMIT), ['"v-if"', 'true'])
    )
  } else {
    return createChildrenCodegenNode(branch, keyIndex)
  }
}
function createChildrenCodegenNode(branch, keyIndex: number) {
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false)
  )
  const { children } = branch
  const firstChild = children[0]
  const ret = firstChild.codegenNode
  const vnodeCall = getMemoedVNodeCall(ret)

  injectProp(vnodeCall, keyProperty)
}
function createObjectProperty(key, value) {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: {},
    key: typeof key === 'string' ? createSimpleExpression(key, true) : key,
    value
  }
}
function createSimpleExpression(content, isStatic) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc: {},
    content,
    isStatic
  }
}
export function injectProp(node, prop) {
  let propsWithInjection
  let props =
    node.type === NodeTypes.VNODE_CALL ? node.props : node.arguments[2]
  if (props === null || typeof props === 'string') {
    propsWithInjection = createobjectExpression([prop])
  }
  node.props = propsWithInjection
}

export function createobjectExpression(properties) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc: {},
    properties
  }
}
