import {Dep,createDep} from './dep'
type keyToDepMap = Map<any,Dep>

// 存储依赖
const targetMap = new WeakMap<any,keyToDepMap>()
export function effect<T = any>(fn:()=>T){
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
// 当前正在执行的effect
export let activeEffect:ReactiveEffect | undefined
export class ReactiveEffect<T = any>{
  constructor(public fn:()=>T){

  }
  run(){
    activeEffect = this
    return this.fn();
  }
}


/**
 * 收集依赖
 * @param target 
 * @param key 
 */
export function track(target:object,key:unknown){
  if(!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if(!dep){
    depsMap.set(key,dep = createDep())
  }
  trackEffects(dep)
}
export function trackEffects(dep:Dep) {
  dep.add(activeEffect!)
}
/**
 * 触发依赖
 * @param target 
 * @param key 
 * @param newValue 
 */
export function trigger(target:object,key:unknown,newValue:unknown){
  const depsMap = targetMap.get(target)
  if(!depsMap) return;
  const dep:Dep | undefined = depsMap.get(key)
  if(!dep) return
  triggerEffects(dep)
}
export function triggerEffects(dep:Dep){
  console.log(dep)
  console.log([...dep])
  const effects = dep instanceof Array ? dep : [...dep]
  for (const effect of effects){
    triggerEffect(effect)
  }
}
export function triggerEffect(effect: ReactiveEffect){
  effect.run()
}