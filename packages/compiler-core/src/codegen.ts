import { TO_DISPLAY_STRING, helperNameMap } from './runtimeHelpers'
import { NodeTypes } from './ast'
import { getVNodeHelper } from './utils'

const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`
function createCodegenContext(ast) {
  const context = {
    code: '', // render函数代码字符串
    runtimeGlobalName: 'Vue', // 运行时全局的变量名
    source: ast.loc.source, // 模板源
    indentLevel: 0, // 缩进级别
    isSSR: false,
    helper(key) {
      return `_${helperNameMap[key]}` // 需要触发的方法，关联JavaScript AST中的 helpers
    },
    push(code) {
      context.code += code
    },
    newline() {
      newline(context.indentLevel)
    },
    indent() {
      newline(++context.indentLevel)
    },
    deindent() {
      newline(--context.indentLevel)
    }
  }
  function newline(n: number) {
    context.code += '\n' + `  `.repeat(n)
  }
  return context
}

export function generate(ast) {
  const context = createCodegenContext(ast)
  const { push, newline, indent, deindent } = context
  genFunctionPreamble(context)
  const functionName = `render`
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}){`)
  indent()
  push(`with (_ctx) {`)
  indent()
  const hasHelpers = ast.helpers.length > 0
  if (hasHelpers) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = _Vue`)
    push('\n')
    newline()
  }
  newline()
  push(`return `)

  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  deindent()
  push('}')

  deindent()
  push('}')

  return {
    ast,
    code: context.code
  }
}

function genFunctionPreamble(context) {
  ;`
    const _Vue = Vue

    return function render(_ctx,_cache) {
      const { createElementVNode: _createElementVNode } = _Vue
      return _createElementVNode('div', [], 'hello world')
    }
  `
  const { push, runtimeGlobalName, newline } = context
  const VueBinding = runtimeGlobalName
  push(`const _Vue = ${VueBinding}\n`)
  newline()
  push(`return `)
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
  }
}
function genText(node, context) {
  console.log('context就是：', context)
  context.push(JSON.stringify(node.content), node)
}
function genExpression(node, context) {
  const { content, isStatic } = node
  context.push(isStatic ? JSON.stringify(content) : content)
}
function genInterpolation(node, context) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (typeof child === 'string') {
      context.push(child)
    } else {
      genNode(child, context)
    }
  }
}
function genVNodeCall(node, context) {
  const { push, helper } = context
  const {
    tag,
    isComponent,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking
  } = node
  const callHelper = getVNodeHelper(context.isSSR, isComponent)
  push(helper(callHelper) + `(`)
  const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps])
  genNodeList(args, context)
  push(')')
}

function genNullableArgs(args: any[]) {
  let i = args.length
  while (i--) {
    if (args[i] != null) break
  }
  return args.slice(0, i + 1).map((arg) => arg || `null`)
}
function genNodeList(nodes, context) {
  const { push, newline } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (typeof node === 'string') {
      push(node)
    } else if (node instanceof Array) {
      context.push('[')
      genNodeList(node, context)
      context.push(']')
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(`, `)
    }
  }
}
