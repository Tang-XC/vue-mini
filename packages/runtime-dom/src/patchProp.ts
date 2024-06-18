import {patchClass} from './modules/class'
import {patchStyle} from './modules/style'
import { patchDOMProp } from './modules/props'
import {patchAttr} from './modules/attrs'
import {patchEvent} from './modules/event'
export const patchProp = (el:Element,key,prevValue,nextValue:string | null)=>{
  const onRE = /^on[^a-z]/
  
  if(key === 'class'){
    // 挂载class
    patchClass(el,nextValue)
  } else if(key === 'style'){
    // 挂载style
    patchStyle(el,prevValue,nextValue)
  } else if(onRE.test(key)){
    // 挂载事件
    patchEvent(el,key,prevValue,nextValue)
  } else if(shouldSetAsProp(el,key)){
    // 挂载DOM属性，例如input的value
    patchDOMProp(el,key,nextValue)
  } else {
    // 挂载元素html属性
    patchAttr(el,key,nextValue)
  }
}
// js中,设置元素属性时，需要分别设置两种属性，一种是DOM属性，另一种是html属性
// 判断是否是DOM属性
function shouldSetAsProp(el:Element,key:string){
  if(key === 'form') return false
  if(key === 'list' && el.tagName === 'INPUT') return false
  if(key === 'type' && el.tagName === 'TEXTAREA') return false
  return key in el
}