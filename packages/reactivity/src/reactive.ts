import { mutableHandlers } from "./baseHandlers"
const reactiveMap = new WeakMap<object,any>()

export const enum ReactiveFlags{
  IS_REACTIVE = '__v_isReactive'
}
export function reactive(target:object){
  return createReactiveObject(target,mutableHandlers,reactiveMap)
}
function createReactiveObject(
  target:object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>,
)
{
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  const proxy = new Proxy(target, baseHandlers)
  proxy[ReactiveFlags.IS_REACTIVE] = true
  proxyMap.set(target, proxy)
  return proxy
}
export const toReactive = <T extends unknown>(value:T):T=>{
  return typeof Object === 'object' ? reactive(value as Object) : value
}
export function isReactive(value:any):boolean{
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}