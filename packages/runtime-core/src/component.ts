import { reactive } from "@vue/reactivity"

let uid = 0
export function createComponentInstance(vnode){
  const instance = {
    uid: uid++,
    vnode,
    type: vnode.type,
    subTree:null,
    effect:null,
    update:null,
    render:null
  }
  return instance
}
export function setupComponent(instance){
  setupStatefulComponent(instance)
}
// 设置组件的初始状态
function setupStatefulComponent(instance){
  finishComponentSetup(instance)
}
export function finishComponentSetup(instance){
  const Component = instance.type 
  instance.render = Component.render
  applyOptions(instance)
}
function applyOptions(instance:any){
  const {data:dataOptions} = instance.type
  if(dataOptions){
    const data = dataOptions()
    if(typeof data === 'object'){
      instance.data = reactive(data)
    }
  }
}