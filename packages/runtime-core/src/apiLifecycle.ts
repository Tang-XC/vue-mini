import { LifecycleHooks } from "./component"
export function injectHook(type:LifecycleHooks,hook:Function,target:any){
  // target是instance的组件实例
  if(target){
    target[type] =  hook
    return hook
  }
}
export const createHook = (lifecycle:LifecycleHooks)=>{
  return (hook,target)=>injectHook(lifecycle,hook,target)
}
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
