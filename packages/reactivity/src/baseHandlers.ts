import { track,trigger } from "./effect"

const get = createGetter()
const set = createSetter()

function createGetter(){
  return function get(target:object,key:string | symbol,receiver:object){
    // 为什么要使用Reflect.get获取值，因为getter中可能会有get操作，所以需要使用Reflect.get
    const res = Reflect.get(target,key,receiver)
    track(target,key) // 这一步是为了触发依赖收集，
    return res
  }
}
function createSetter(){
  return function set(target:object,key:string | symbol,value:unknown,receiver:object){
    const result = Reflect.set(target,key,value,receiver)
    trigger(target,key,value) // 触发依赖更新
    return result
  }
}
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}