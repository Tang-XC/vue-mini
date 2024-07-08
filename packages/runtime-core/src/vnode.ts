import { ShapeFlags } from '@vue/shared'

export interface VNode {
  __v_isVNode: true
  type: any
  props: any
  children: any
  shapeFlag: number
  key?: string | number
}
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Component = Symbol('Component')
export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode : false
}
export function createVNode(type: any, props: any, children?: any): VNode {
  if (props) {
    let { class: klass, style } = props
    if (klass && typeof klass !== 'string') {
      props.class = normalizeClass(klass)
    }
  }

  const shapeFlag =
    typeof type === 'string'
      ? ShapeFlags.ELEMENT
      : typeof type === 'object'
      ? ShapeFlags.STATEFUL_COMPONENT
      : 0

  return createBaseVNode(type, props, children, shapeFlag)
}
export { createVNode as createElementVNode }
function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    shapeFlag,
    key: props?.key || null
  } as VNode
  normalizeChildren(vnode, children)
  return vnode
}
function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  if (children == null) {
    children = null
  } else if (Array.isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'object') {
  } else if (typeof children === 'function') {
  } else {
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.children = children
  vnode.shapeFlag |= type // 相当于vnode.shapeFlag = vnode.shapeFlag | type
}
function normalizeClass(value: unknown): string {
  let res = ''
  if (typeof value === 'string') {
    res = value
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i])
      if (normalized) {
        res += normalized + ' '
      }
    }
  } else if (typeof value === 'object') {
    for (const key in value) {
      if (value[key]) {
        res += key + ' '
      }
    }
  }
  return res.trim()
}

export function isSameVnodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}
