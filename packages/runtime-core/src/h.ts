import {VNode,createVNode,isVNode} from './vnode'

// 只有type
// h('div')

// type + props
// h('div', {})

// type + 省略props + children
// h('div', [])
// h('div', 'foo')
// h('div', h('br'))
// h(Component, () => {})

// type + props + children
// h('div', {}, [])
// h('div', {}, h('br'))
// h('div', {}, 'foo')
// h(Component, {}, ()=>{})
// h(Component, {}, {})

// h(Component, null, {})
export function h(type:any,propsOrChildren?:any,children?:any):VNode{
  const l = arguments.length;
  if(l === 2){
    if(typeof propsOrChildren === 'object' && !Array.isArray(propsOrChildren)){
      if(isVNode(propsOrChildren)){
        return createVNode(type,null,[propsOrChildren])
      }
      return createVNode(type,propsOrChildren)
    } else {
      return createVNode(type,null,propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments,2)
    } else if (l === 3 && isVNode(children)){
      children = [children]
    }
    return createVNode(type,propsOrChildren,children)
  }
}