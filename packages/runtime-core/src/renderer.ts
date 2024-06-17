import { ShapeFlags } from "@vue/shared"
import { Text,Fragment,Component } from "./vnode"

export interface RendererOptions {
  patchProp(el:Element,key:string,prevValue:any,nextValue:any):void
  setElementText(node:Element,text:string):void
  insert(el:Element,parent:Element,anchor?:any):void
  createElement(type:string):Element
}

// 创建renderer
export function createRenderer(options:RendererOptions){
  return baseCreateRenderer(options)
}
function baseCreateRenderer(opitons:RendererOptions):any{
  const {insert:hostInsert,setElementText:hostSetElementText,createElement:hostCreateElement,patchProp:hostPatchProp} = opitons
  // 处理element
  const processElement = (oldVnode,newVnode,container,anchor)=>{
    if(oldVnode == null ){
      // 挂载element
      mountElement(newVnode,container,anchor)
    } else {

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
  const patch = (oldVnode,newVnode,container,anchor=null)=>{
    if(oldVnode === newVnode) return
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