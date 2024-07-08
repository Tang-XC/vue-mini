import { NodeTypes, ElementTypes } from './ast'
const enum TagType {
  Start,
  End
}
export interface ParserContext {
  source: string
}
function createParserContext(content: string): ParserContext {
  return {
    source: content
  }
}
export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {}
  }
}
export function baseParse(content: string) {
  const context = createParserContext(content)
  const children = parseChildren(context, [])
  return createRoot(children)
}

// 该函数用于解析解析器上下文中的子节点
function parseChildren(context: ParserContext, ancestors) {
  const nodes = []
  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node
    // 判断是否为插值语法
    if (startsWith(s, '{{')) {
      // 模版插值语法
      node = parseInterpolation(context)
      // 判断是否为标签开头
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }
    if (!node) {
      node = parseText(context)
    }
    pushNode(nodes, node)
  }
  return nodes
}

function parseInterpolation(context: ParserContext) {
  const [open, close] = ['{{', '}}']
  advanceBy(context, open.length)
  const closeIndex = context.source.indexOf(close, open.length)
  const preTrimContent = parseTextData(context, closeIndex)
  const content = preTrimContent.trim()
  advanceBy(context, close.length)
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content
    }
  }
}

// 处理标签
function parseElement(context: ParserContext, ancestors: any[]) {
  // 先处理开始标签
  const element = parseTag(context, TagType.Start)

  // 添加自节点
  ancestors.push(element)

  // 递归触发 parseChildren
  const children = parseChildren(context, ancestors)
  ancestors.pop()

  // 为子节点赋值
  element.children = children

  // 最后处理结束标签
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }

  // 整个标签处理完成
  return element
}
function parseTag(context: ParserContext, type: TagType) {
  // 通过正则获取标签
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
  // 标签名
  const tag = match[1]

  //对模板进行解析处理
  advanceBy(context, match[0].length)

  // --- 处理标签结束部分 ---
  // 判断是否为自关闭标签，例如<img/>
  let isSelfClosing = startsWith(context.source, '/>')

  // 《继续》对模板进行解析处理，是自关闭标签则处理两个字符 /> ，不是则处理一个字符 >
  advanceBy(context, isSelfClosing ? 2 : 1)

  //标签类型
  let tagType = ElementTypes.ELEMENT
  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: tagType,
    children: [],
    props: []
  }
}
// 该函数的功能是解析文本内容，并返回一个包含文本类型和内容的对象。
function parseText(context: ParserContext) {
  const endTokens = ['<', '{{']
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content
  }
}
// 该函数将文本节点中的文本内容解析出来并返回，再将其从context中截掉
function parseTextData(context: ParserContext, length: number) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

function pushNode(nodes, node) {
  nodes.push(node)
}
function advanceBy(context: ParserContext, numberOfCharacters: number) {
  const { source } = context
  context.source = source.slice(numberOfCharacters)
}

function startsWith(source: string, searchString: string) {
  return source.startsWith(searchString)
}
// 判断是否为标签结束部分
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return startsWith(source, '</')
}
function isEnd(context: ParserContext, ancestors: any[]) {
  const s = context.source
  // 解析是否为结束标签
  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }
  return !s
}
