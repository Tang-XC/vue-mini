import { ShapeFlags } from "@vue/shared"

export interface VNode {
  __v_isVNode:true
  type:any
  props:any
  children:any
  shapeFlag:number
}
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Component = Symbol('Component')
export function isVNode(value:any):value is VNode {
  return value ? value.__v_isVNode : false
}
export function createVNode(type:any,props:any,children?:any):VNode{
  const shapeFlag = typeof type === 'string' ? ShapeFlags.ELEMENT : typeof type === 'object' ? ShapeFlags.STATEFUL_COMPONENT : 0
  return createBaseVNode(type,props,children,shapeFlag)
}
function createBaseVNode(type,props,children,shapeFlag){
  const vnode = {
    __v_isVNode:true,
    type,
    props,
    children,
    shapeFlag
  } as VNode
  normalizeChildren(vnode,children)
  return vnode
}
function normalizeChildren(vnode:VNode,children:unknown){
  let type = 0
  const {shapeFlag} = vnode
  if(children == null){
    children = null
  } else if(Array.isArray(children)){
    type = ShapeFlags.ARRAY_CHILDREN
  } else if(typeof children === 'object'){

  } else if (typeof children === 'function'){

  } else {
    children  = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }
  vnode.children = children
  vnode.shapeFlag |= type // 相当于vnode.shapeFlag = vnode.shapeFlag | type
}