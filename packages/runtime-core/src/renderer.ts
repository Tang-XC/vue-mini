import { ShapeFlags } from "@vue/shared"
import { Text,Fragment,Component,isSameVnodeType } from "./vnode"
import {normalizeVnode,renderComponentRoot} from './componentRenderUtils'
import {createComponentInstance,setupComponent} from './component'
import {ReactiveEffect} from 'packages/reactivity/src/effect'
import {queuePreFlushCb} from 'packages/runtime-core/src/scheduler'

export interface RendererOptions {
  patchProp(el:Element,key:string,prevValue:any,nextValue:any):void
  setElementText(node:Element,text:string):void
  insert(el:Element,parent:Element,anchor?:any):void
  createElement(type:string):Element
  remove(el:Element):void
  createText(text:string):any
  setText(el:Element,text:string):void
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
    remove:hostRemove,
    createText:hostCreateText,
    setText:hostSetText
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
      // 清空旧节点的props
      if(oldProps && Object.keys(oldProps).length !== 0){
        for(const key in oldProps){
          if(!(key in newProps)){
            hostPatchProp(el,key,oldProps[key],null)
          }
        }
      }
    }
  }
  const setupRenderEffect = (instance,initialVnode,container,anchor)=>{
    const componentUpdateFn = ()=>{
      // 根据组件是否挂载来判断组件式否进行渲染或更新
      if(!instance.isMounted){
        // -渲染组件

        const {bm,m} = instance

        // 触发beforeMount生命周期函数
        if(bm){
          bm()
        }
        
        const subTree = (instance.subTree = renderComponentRoot(instance))
        patch(null,subTree,container,anchor)
        
        // 触发mounted生命周期函数
        if(m){
          m()
        }

        initialVnode.el = subTree.el
        instance.isMounted = true
      } else {
        // -更新组件
        let {next,vnode} = instance
        if(!next){
          next = vnode
        }
        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree
        patch(prevTree,nextTree,container,anchor)
        next.el = nextTree.el
      }
    }
    const effect = (instance.efect = new ReactiveEffect(componentUpdateFn,()=>queuePreFlushCb(update)))
    const update = (instance.update = ()=> effect.run())
    update()
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
  const mountChildren = (children,container,anchor)=>{
    if(typeof children === 'string'){
      children = children.split('')
    }
    for(let i = 0;i < children.length;i++){
      const child = (children[i] = normalizeVnode(children[i]))
      patch(null,child,container,anchor)
    }
  }
  const mountComponent = (initialVnode,container,anchor)=>{
    initialVnode.component = createComponentInstance(initialVnode)
    const instance = initialVnode.component
    setupComponent(instance)
    setupRenderEffect(instance,initialVnode,container,anchor)
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
  // 处理HTML普通元素节点
  const processElement = (oldVnode,newVnode,container,anchor)=>{
    if(oldVnode == null ){
      // 挂载element
      mountElement(newVnode,container,anchor)
    } else {
      // 更新element
      patchElement(oldVnode,newVnode)
    }
  }
  // 处理文本节点
  const processText = (oldVnode,newVnode,container,anchor)=>{
    if(oldVnode == null){
      newVnode.el = hostCreateText(newVnode.children)
      hostInsert(newVnode.el,container,anchor)
    } else {
      const el = (newVnode.el = oldVnode.el!)
      if(newVnode.children !== oldVnode.children) {
        hostSetText(el,newVnode.children)
      } 
    }

  }
  // 处理Fragment
  const processFragment = (oldVnode,newVnode,container,anchor)=>{
    if(oldVnode == null){
      mountChildren(newVnode.children,container,anchor)
    } else {
      patchChildren(oldVnode,newVnode,container,anchor)
    }
  }
  // 处理组件
  const processComponent = (oldVnode,newVnode,container,anchor)=>{
    if(oldVnode == null){
      // 挂载组件
      mountComponent(newVnode,container,anchor)
    } else {
      // 更新组件
    }
  }
  const patch = (oldVnode,newVnode,container,anchor=null)=>{
    if(oldVnode === newVnode) return
    // 如果节点类型不同，则卸载旧节点，用来更新新节点
    if(oldVnode && !isSameVnodeType(oldVnode,newVnode)){
      unmountElement(oldVnode)
      oldVnode = null;
    }
    const {type,shapeFlag} = newVnode
    switch(type){
      case Text:
        processText(oldVnode,newVnode,container,anchor)
        break;
      case Component:
        break; 
      case Fragment:
        processFragment(oldVnode,newVnode,container,anchor)
        break;
      default:
        if(shapeFlag & ShapeFlags.ELEMENT){
          processElement(oldVnode,newVnode,container,anchor)
        } else if(shapeFlag & ShapeFlags.COMPONENT){
          processComponent(oldVnode,newVnode,container,anchor)
        }
    }
  }
  const render = (vnode,container)=>{
    // 传入元素为null，则卸载元素
    if(vnode === null){
      // 判定旧节点是否存在，存在则卸载
      if(container._vnode){
        unmountElement(container._vnode)
      }
    } else {

      patch(container._vnode || null,vnode,container)
    }
    // 缓存vnode，作为旧节点
    container._vnode = vnode
  }
  return {
    render
  }
}