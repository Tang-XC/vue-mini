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
}