import { Dep, createDep } from "./dep";
import { activeEffect, trackEffects, triggerEffects } from "./effect";
import {toReactive} from './reactive'
import {ComputedRefImpl} from './computed'
export interface Ref<T = any> {
  value:T
}
export function ref (value?:unknown) {
  return createRef(value,false)
}
function createRef(rawValue:unknown,shallow:boolean){
  if(isRef(rawValue)){
    return rawValue
  }
  return new RefImpl(rawValue,shallow)
}
class RefImpl<T> {
  private _value: T
  private _rawValue: T
  public dep ? :Dep = undefined
  constructor(value:T,public readonly __v_isShallow:boolean){
    this._rawValue = value
    this._value = __v_isShallow ? value : toReactive(value)
  }
  get value(){           
    trackRefValue(this)
    return this._value
  }
  set value(newValue){
    if(!Object.is(newValue,this._rawValue)){
      this._rawValue = newValue
      this._value = toReactive(newValue)
      triggerRefValue(this)
    }
  }
}
export function trackRefValue(ref:RefImpl<any> | ComputedRefImpl<any>){
  if(activeEffect){
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}
export function triggerRefValue(ref:RefImpl<any> | ComputedRefImpl<any>){
  if(ref.dep){
    triggerEffects(ref.dep)
  }
}
export function isRef(r:any): r is Ref{
  return !!(r && r.__v_isRef === true)
}