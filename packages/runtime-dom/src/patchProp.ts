import {patchClass} from './modules/class'
import {patchStyle} from './modules/style'
import { patchDOMProp } from './modules/props'
import {patchAttr} from './modules/attrs'
export const patchProp = (el:Element,key,prevValue,nextValue:string | null)=>{
  const onRE = /^on[^a-z]/
  if(key === 'class'){
    patchClass(el,nextValue)
  } else if(key === 'style'){
    patchStyle(el,prevValue,nextValue)
  } else if(onRE.test(key)){

  } else if(shouldSetAsProp(el,key)){
    patchDOMProp(el,key,nextValue)
  } else {
    patchAttr(el,key,nextValue)
  }
}
function shouldSetAsProp(el:Element,key:string){
  console.log(key)
  if(key === 'form') return false
  if(key === 'list' && el.tagName === 'INPUT') return false
  if(key === 'type' && el.tagName === 'TEXTAREA') return false
  return key in el
}