import { ShapeFlags } from '@vue/shared'
import { Text, Fragment, Component, isSameVnodeType } from './vnode'
import { normalizeVnode, renderComponentRoot } from './componentRenderUtils'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from 'packages/reactivity/src/effect'
import { queuePreFlushCb } from 'packages/runtime-core/src/scheduler'

export interface RendererOptions {
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
  setElementText(node: Element, text: string): void
  insert(el: Element, parent: Element, anchor?: any): void
  createElement(type: string): Element
  remove(el: Element): void
  createText(text: string): any
  setText(el: Element, text: string): void
}

// 创建renderer
export function createRenderer(options: RendererOptions) {
  return baseCreateRenderer(options)
}

function baseCreateRenderer(opitons: RendererOptions): any {
  const {
    insert: hostInsert,
    setElementText: hostSetElementText,
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText
  } = opitons
  const patchChildren = (oldVnode, newVnode, container, anchor) => {
    const c1 = oldVnode && oldVnode.children
    const c2 = newVnode && newVnode.children
    const prevShapeFlag = oldVnode ? oldVnode.shapeFlag : 0
    const { shapeFlag } = newVnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 当新节点是文本节点时,而旧节点是数组节点时
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 卸载旧子节点
        unmountElement(oldVnode)
      }
      // 如果新旧不相同则设置新节点的text
      if (c2 !== c1) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 当新节点和旧节点都是数组节点时
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff
          patchKeyedChildren(c1, c2, container, anchor)
        } else {
          // 卸载
          unmountElement(oldVnode)
        }
      } else {
        // 当旧节点不是数组节点时,而新节点是文本节点时
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧节点的text
          hostSetElementText(container, '')
        }
        // 当新节点时数组节点时
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 单独新子节点的挂载
        }
      }
    }
  }
  const patchKeyedChildren = (
    oldChildren,
    newChildren,
    container,
    parentAnchor
  ) => {
    let i = 0
    const newChildrenLength = newChildren.length
    let oldChildrenEnd = oldChildren.length - 1
    let newChildrenEnd = newChildrenLength - 1
    // 1.自前向后
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVnode = oldChildren[i]
      const newVnode = newChildren[i]
      if (isSameVnodeType(oldVnode, newVnode)) {
        patch(oldVnode, newVnode, container, null)
      } else {
        break
      }
      i++
    }

    // 2.自后向前
    while (i <= oldChildrenEnd && i <= newChildrenEnd) {
      const oldVnode = oldChildren[oldChildrenEnd]
      const newVnode = newChildren[newChildrenEnd]
      if (isSameVnodeType(oldVnode, newVnode)) {
        patch(oldVnode, newVnode, container, null)
      } else {
        break
      }
      oldChildrenEnd--
      newChildrenEnd--
    }

    // 3.新节点多于旧节点
    if (i > oldChildrenEnd) {
      if (i <= newChildrenEnd) {
        const nextPos = newChildrenEnd + 1
        const anchor =
          nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor
        while (i <= newChildrenEnd) {
          // 将元素挂载到指定的锚点位置，锚点位置在新节点的锚点位置，具体是锚点位置，
          patch(null, normalizeVnode(newChildren[i]), container, anchor)
          i++
        }
      }
      // 4.删除多余节点
    } else if (i > newChildrenEnd) {
      while (i <= oldChildrenEnd) {
        unmountElement(oldChildren[i])
        i++
      }
    }
    // 5. 乱序的 diff 比对
    else {
      const oldStartIndex = i // 旧子节点开始的索引
      const newStartIndex = i // 新子节点开始的索引

      // 5.1 创建一个 <key (新节点的key)：index(新节点的位置)的Map对象
      // 通过该对象可知：新的child(根据key判断指定child)更新后的位置（根据对应的index判断)在哪里
      const keyToNewIndexMap = new Map()

      for (i = newStartIndex; i <= newChildrenEnd; i++) {
        const nextChild = normalizeVnode(newChildren[i])
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i)
        }
      }

      // 5.2 遍历oldChildren，并尝试进行patch（打补丁）或unmount（删除）旧节点
      let j
      let patched = 0 // 记录已经修复的新节点数量，
      const toBePatched = newChildrenEnd - newStartIndex + 1 // 新节点待修补的数量
      let moved = false // 标记位：节点是否需要移动
      let maxNewIndexSoFar = 0 // 配合moved进行使用，始终保存当前最大的index值

      //创建一个Array的对象，用来确定最长递增子序列
      const newIndexToOldIndexMap = new Array(toBePatched)
      for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
      for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
        const prevChild = oldChildren[i]
        if (patched >= toBePatched) {
          unmountElement(prevChild)
          continue
        }
        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        }

        if (newIndex === undefined) {
          unmountElement(prevChild)
        } else {
          newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(prevChild, newChildren[newIndex], container, null)
          patched++
        }
      }

      // 5.3 针对移动和挂载的处理
      // 仅当节点需要移动的时候，我们才需要最长递增子序列，否则只需要有一个空数组即可
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []

      j = increasingNewIndexSequence.length - 1
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = newStartIndex + i
        const nextChild = newChildren[nextIndex]
        const anchor =
          nextIndex + 1 < newChildrenLength
            ? newChildren[nextIndex + 1].el
            : parentAnchor

        // 表示新节点没有对应的旧节点，此时需要挂载新节点
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, anchor)
        } else if (moved) {
          // j < 0 表示不存在，表示需要移动
          // i !== increasingNewIndexSequence[j] 表示当前节点不在最后位置
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }
  const move = (vnode, container, anchor) => {
    const { el } = vnode
    hostInsert(el!, container, anchor)
  }
  const patchProps = (el: Element, vnode, oldProps, newProps) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(el, key, prev, next)
        }
      }
      // 清空旧节点的props
      if (oldProps && Object.keys(oldProps).length !== 0) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }
  const setupRenderEffect = (instance, initialVnode, container, anchor) => {
    const componentUpdateFn = () => {
      // 根据组件是否挂载来判断组件式否进行渲染或更新
      if (!instance.isMounted) {
        // -渲染组件

        const { bm, m } = instance

        // 触发beforeMount生命周期函数
        if (bm) {
          bm()
        }

        const subTree = (instance.subTree = renderComponentRoot(instance))
        patch(null, subTree, container, anchor)

        // 触发mounted生命周期函数
        if (m) {
          m()
        }
        initialVnode.el = subTree.el
        instance.isMounted = true
      } else {
        // -更新组件
        let { next, vnode } = instance
        if (!next) {
          next = vnode
        }
        const nextTree = renderComponentRoot(instance)
        const prevTree = instance.subTree
        instance.subTree = nextTree
        patch(prevTree, nextTree, container, anchor)
        next.el = nextTree.el
      }
    }
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queuePreFlushCb(update)
    ))
    const update = (instance.update = () => effect.run())
    update()
  }
  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode
    // 创建element
    const el = (vnode.el = hostCreateElement(type))
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 设置文本
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, anchor)
    }
    // 设置props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 插入
    hostInsert(el, container, anchor)
  }
  const mountChildren = (children, container, anchor) => {
    if (typeof children === 'string') {
      children = children.split('')
    }
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVnode(children[i]))
      patch(null, child, container, anchor)
    }
  }
  const mountComponent = (initialVnode, container, anchor) => {
    initialVnode.component = createComponentInstance(initialVnode)
    const instance = initialVnode.component
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container, anchor)
  }
  const patchElement = (oldVnode, newVnode) => {
    const el = (newVnode.el = oldVnode.el)
    const oldProps = oldVnode.props || {}
    const newProps = newVnode.props || {}
    patchChildren(oldVnode, newVnode, el, null)
    patchProps(el, newVnode, oldProps, newProps)
  }
  const unmountElement = (vnode) => {
    hostRemove(vnode.el)
  }
  // 处理HTML普通元素节点
  const processElement = (oldVnode, newVnode, container, anchor) => {
    if (oldVnode == null) {
      // 挂载element
      mountElement(newVnode, container, anchor)
    } else {
      // 更新element
      patchElement(oldVnode, newVnode)
    }
  }
  // 处理文本节点
  const processText = (oldVnode, newVnode, container, anchor) => {
    if (oldVnode == null) {
      newVnode.el = hostCreateText(newVnode.children)
      hostInsert(newVnode.el, container, anchor)
    } else {
      const el = (newVnode.el = oldVnode.el!)
      if (newVnode.children !== oldVnode.children) {
        hostSetText(el, newVnode.children)
      }
    }
  }
  // 处理Fragment
  const processFragment = (oldVnode, newVnode, container, anchor) => {
    if (oldVnode == null) {
      mountChildren(newVnode.children, container, anchor)
    } else {
      patchChildren(oldVnode, newVnode, container, anchor)
    }
  }
  // 处理组件
  const processComponent = (oldVnode, newVnode, container, anchor) => {
    if (oldVnode == null) {
      // 挂载组件
      mountComponent(newVnode, container, anchor)
    } else {
      // 更新组件
    }
  }

  // 处理虚拟DOM的更新
  const patch = (oldVnode, newVnode, container, anchor = null) => {
    if (oldVnode === newVnode) return
    // 如果节点类型不同，则卸载旧节点，用来更新新节点
    if (oldVnode && !isSameVnodeType(oldVnode, newVnode)) {
      unmountElement(oldVnode)
      oldVnode = null
    }
    const { type, shapeFlag } = newVnode
    switch (type) {
      case Text:
        processText(oldVnode, newVnode, container, anchor)
        break
      case Component:
        break
      case Fragment:
        processFragment(oldVnode, newVnode, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVnode, newVnode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(oldVnode, newVnode, container, anchor)
        }
    }
  }
  const render = (vnode, container) => {
    // 传入元素为null，则卸载元素
    if (vnode === null) {
      // _vnode表示旧节点，这里判定旧节点是否存在，存在则卸载
      if (container._vnode) {
        unmountElement(container._vnode)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }
    // 缓存vnode，作为旧节点
    container._vnode = vnode
  }
  return {
    render
  }
}

// 获取最长递增子序列
function getSequence(arr) {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
