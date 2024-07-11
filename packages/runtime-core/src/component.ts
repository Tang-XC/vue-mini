import { reactive } from '@vue/reactivity'
import { onBeforeMount, onMounted } from './apiLifecycle'

let uid = 0
let compile: any = null
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm'
}
export function createComponentInstance(vnode) {
  const instance = {
    uid: uid++,
    vnode,
    type: vnode.type,
    subTree: null,
    effect: null,
    update: null,
    render: null,
    isMounted: false,
    bc: null,
    c: null,
    bm: null,
    m: null
  }
  return instance
}
export function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'function') {
    instance.render = setupResult
  }
  finishComponentSetup(instance)
}

export function setupComponent(instance) {
  setupStatefulComponent(instance)
}
// 设置组件的初始状态
function setupStatefulComponent(instance) {
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    const setupResult = setup()
    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}
export function finishComponentSetup(instance) {
  const Component = instance.type
  // 组件不存在 render 时，才需要重新赋值
  if (!instance.render) {
    // 存在编辑器，并且组件中不包含 render 函数，同时包含 template 模板，则直接使用编辑器进行编辑，得到 render 函数
    if (compile && !Component.render) {
      if (Component.template) {
        // 这里就是 runtime 模块和 compile 模块结合点
        const template = Component.template
        Component.render = compile(template)
      }
    }
    // 为 render 赋值
    instance.render = Component.render
  }

  // 改变 options 中的 this 指向
  applyOptions(instance)
}
export function registerRuntimeComiler(_compile: any) {
  console.log(_compile)
  compile = _compile
}
function applyOptions(instance: any) {
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted
  } = instance.type

  // 触发beforeCreate生命周期函数
  if (beforeCreate) {
    callHook(beforeCreate, instance.data)
  }

  // 将data选项中的数据转化为响应式数据
  if (dataOptions) {
    const data = dataOptions()
    if (typeof data === 'object') {
      instance.data = reactive(data)
    }
  }

  // 触发created生命周期函数
  if (created) {
    callHook(created, instance.data)
  }

  function registerLifecycleHook(register: Function, hook?: Function) {
    register(hook?.bind(instance.data), instance)
  }
  registerLifecycleHook(onBeforeMount, beforeMount)
  registerLifecycleHook(onMounted, mounted)
}

function callHook(hook: Function, proxy) {
  hook.call(proxy)
}
