import { ShapeFlags } from "@vue/shared"
import { Text,Fragment,Component,isSameVnodeType } from "./vnode"

export interface RendererOptions {
  patchProp(el:Element,key:string,prevValue:any,nextValue:any):void
  setElementText(node:Element,text:string):void
  insert(el:Element,parent:Element,anchor?:any):void
  createElement(type:string):Element
  remove(el:Element):void
}

// 创建renderer
export function createRenderer(options:RendererOptions){
  return baseCreateRenderer(options)
}
function baseCreateRenderer(opitons:RendererOptions):any{
  const {
    insert:hostInsert,
    setElementText:hostSetElementText,
    createElement:hostCreateElement,
    patchProp:hostPatchProp,
    remove:hostRemove
  } = opitons
  const patchChildren = (oldVnode,newVnode,container,anchor)=>{
    const c1 = oldVnode && oldVnode.children
    const c2 = newVnode && newVnode.children
    const prevShapeFlag = oldVnode ? oldVnode.shapeFlag : 0
    const {shapeFlag} = newVnode
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
      // 当新节点是文本节点时,而旧节点是数组节点时
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // 卸载旧子节点
      }
      // 如果新旧不相同则设置新节点的text
      if(c2 !== c1){
        hostSetElementText(container,c2)
      }
    } else {
      // 当新节点不是文本节点时，而旧节点是数组节点时
      if(prevShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // 当新节点是数组节点时
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
          // diff
        } else {
          // 卸载
        }
      } else {
        // 当旧节点不是数组节点时,而旧节点时文本节点时
        if(prevShapeFlag & ShapeFlags.TEXT_CHILDREN){
          // 删除旧节点的text
          hostSetElementText(container,'')
        }
        // 当新节点时数组节点时
        if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
          // 单独新子节点的挂载
        }
      }
    }
  }
  const patchProps = (el:Element,vnode,oldProps,newProps)=>{
    if(oldProps !== newProps){
      for(const key in newProps){
        const next = newProps[key]
        const prev = oldProps[key]
        if(next !== prev){
          hostPatchProp(el,key,prev,next)
        }
      }
      if(oldProps && Object.keys(oldProps).length !== 0){
        for(const key in oldProps){
          if(!(key in newProps)){
            hostPatchProp(el,key,oldProps[key],null)
          }
        }
      }
    }
  }
  const mountElement =(vnode,container,anchor)=>{
    const {type,props,shapeFlag} = vnode
    // 创建element
    const el = (vnode.el = hostCreateElement(type))
    if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
      // 设置文本
      hostSetElementText(el,vnode.children)
    } else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){

    }
    // 设置props 
    if(props){
      for(const key in props){
        hostPatchProp(el,key,null,props[key])
      }
    }
    // 插入
    hostInsert(el,container,anchor)
  }
  
  const patchElement = (oldVnode,newVnode)=>{
    const el = (newVnode.el = oldVnode.el)
    const oldProps = oldVnode.props || {}
    const newProps = newVnode.props || {}
    patchChildren(oldVnode,newVnode,el,null)
    patchProps(el,newVnode,oldProps,newProps)
  }
  const unmountElement = (vnode)=>{
    hostRemove(vnode.el)
  }
  const processElement = (oldVnode,newVnode,container,anchor)=>{
    if(oldVnode == null ){
      // 挂载element
      mountElement(newVnode,container,anchor)
    } else {
      // 更新element
      patchElement(oldVnode,newVnode)
    }
  }
  const patch = (oldVnode,newVnode,container,anchor=null)=>{
    if(oldVnode === newVnode) return
    if(oldVnode && !isSameVnodeType(oldVnode,newVnode)){
      unmountElement(oldVnode)
      oldVnode = null;
    }
    const {type,shapeFlag} = newVnode
    switch(type){
      case Text:
        break;
      case Component:
        break; 
      case Fragment:
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          processElement(oldVnode,newVnode,container,anchor)
        } else if(shapeFlag & ShapeFlags.COMPONENT){
  
        }
    }
  }
  const render = (vnode,container)=>{
    if(vnode === null){
    } else {
      patch(container._vnode || null,vnode,container)
    }
    container._vnode = vnode
  }
  return {
    render
  }
}