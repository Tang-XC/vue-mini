import { isReactive } from "packages/reactivity/src/reactive"
import { queuePreFlushCb } from "./scheduler"
import { ReactiveEffect } from "packages/reactivity/src/effect"
export interface WatchOptions<immediate=boolean>{
  immediate?:immediate
  deep?:boolean
}
export function watch(source,cb:Function,options?:WatchOptions){
  return doWatch(source,cb,options)
}
function doWatch(source,cb:Function,{immediate,deep}:WatchOptions = {}){
  let getter: ()=>any

  if(isReactive(source)){
    getter = ()=>source
    deep = true
  } else {
    getter = ()=>{}
  }
  if(cb && deep){
    const baseGetter = getter
    getter = ()=>traverse(baseGetter())
  }
  

  let oldValue = {}
  const job = ()=>{
    if(cb){
      const newValue = effect.run()
      if(deep || !Object.is(newValue,oldValue)){
        cb(newValue,oldValue)
        oldValue = newValue
      }
    }
  }
  let scheduler = ()=>queuePreFlushCb(job)
  const effect = new ReactiveEffect(getter,scheduler)

  if(cb){
    if(immediate){
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run();
  }
  return ()=> {
    effect.stop()
  }
}
// 递归遍历,用于触发依赖收集
export function traverse(value:unknown){
  if(typeof value !== 'object') return value
  for(const key in value as object){
    traverse((value as object)[key])
  }
  return value
}