import {patchClass} from './modules/class'
export const patchProp = (el:Element,key,prevValue,nextValue:string | null)=>{
  const onRE = /^on[^a-z]/
  if(key === 'class'){
    patchClass(el,nextValue)
  } else if(key === 'style'){

  } else if(onRE.test(key)){

  } else {

  }
}