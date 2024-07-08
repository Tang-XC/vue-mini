var Vue = (function (exports) {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    var createDep = function (effects) {
        var dep = new Set(effects);
        return dep;
    };

    // 存储依赖
    var targetMap = new WeakMap();
    function effect(fn, options) {
        var _effect = new ReactiveEffect(fn);
        if (options) {
            Object.assign(_effect, options);
        }
        if (!options || !options.lazy) {
            _effect.run();
        }
    }
    // 当前正在执行的effect
    var activeEffect;
    var ReactiveEffect = /** @class */ (function () {
        function ReactiveEffect(fn, scheduler) {
            if (scheduler === void 0) { scheduler = null; }
            this.fn = fn;
            this.scheduler = scheduler;
        }
        ReactiveEffect.prototype.run = function () {
            activeEffect = this;
            return this.fn();
        };
        ReactiveEffect.prototype.stop = function () {
        };
        return ReactiveEffect;
    }());
    /**
     * 收集依赖
     * @param target
     * @param key
     */
    function track(target, key) {
        if (!activeEffect)
            return;
        var depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        var dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, dep = createDep());
        }
        trackEffects(dep);
    }
    function trackEffects(dep) {
        dep.add(activeEffect);
    }
    /**
     * 触发依赖
     * @param target
     * @param key
     * @param newValue
     */
    function trigger(target, key, newValue) {
        var depsMap = targetMap.get(target);
        if (!depsMap)
            return;
        var dep = depsMap.get(key);
        if (!dep)
            return;
        triggerEffects(dep);
    }
    function triggerEffects(dep) {
        var e_1, _a, e_2, _b;
        var effects = dep instanceof Array ? dep : __spreadArray([], __read(dep), false);
        try {
            for (var effects_1 = __values(effects), effects_1_1 = effects_1.next(); !effects_1_1.done; effects_1_1 = effects_1.next()) {
                var effect_1 = effects_1_1.value;
                if (effect_1.computed) {
                    triggerEffect(effect_1);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (effects_1_1 && !effects_1_1.done && (_a = effects_1.return)) _a.call(effects_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        try {
            for (var effects_2 = __values(effects), effects_2_1 = effects_2.next(); !effects_2_1.done; effects_2_1 = effects_2.next()) {
                var effect_2 = effects_2_1.value;
                if (!effect_2.computed) {
                    triggerEffect(effect_2);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (effects_2_1 && !effects_2_1.done && (_b = effects_2.return)) _b.call(effects_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    function triggerEffect(effect) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
        // effect.run()
    }

    var get = createGetter();
    var set = createSetter();
    function createGetter() {
        return function get(target, key, receiver) {
            // 为什么要使用Reflect.get获取值，因为getter中可能会有get操作，所以需要使用Reflect.get
            var res = Reflect.get(target, key, receiver);
            track(target, key); // 这一步是为了触发依赖收集，
            return res;
        };
    }
    function createSetter() {
        return function set(target, key, value, receiver) {
            var result = Reflect.set(target, key, value, receiver);
            trigger(target, key); // 触发依赖更新
            return result;
        };
    }
    var mutableHandlers = {
        get: get,
        set: set,
    };

    var reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    }
    function createReactiveObject(target, baseHandlers, proxyMap) {
        var existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        var proxy = new Proxy(target, baseHandlers);
        proxy["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] = true;
        proxyMap.set(target, proxy);
        return proxy;
    }
    var toReactive = function (value) {
        return typeof Object === 'object' ? reactive(value) : value;
    };
    function isReactive(value) {
        return !!(value && value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]);
    }

    function ref(value) {
        return createRef(value, false);
    }
    function createRef(rawValue, shallow) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }
    var RefImpl = /** @class */ (function () {
        function RefImpl(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this._rawValue = value;
            this._value = __v_isShallow ? value : toReactive(value);
        }
        Object.defineProperty(RefImpl.prototype, "value", {
            get: function () {
                trackRefValue(this);
                return this._value;
            },
            set: function (newValue) {
                if (!Object.is(newValue, this._rawValue)) {
                    this._rawValue = newValue;
                    this._value = toReactive(newValue);
                    triggerRefValue(this);
                }
            },
            enumerable: false,
            configurable: true
        });
        return RefImpl;
    }());
    function trackRefValue(ref) {
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    function triggerRefValue(ref) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }
    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }

    var ComputedRefImpl = /** @class */ (function () {
        function ComputedRefImpl(getter) {
            var _this = this;
            this.dep = undefined;
            this.__v_isRef = true;
            this._dirty = true;
            this.effect = new ReactiveEffect(getter, function () {
                if (!_this._dirty) {
                    _this._dirty = true;
                    triggerRefValue(_this);
                }
            });
            this.effect.computed = this;
        }
        Object.defineProperty(ComputedRefImpl.prototype, "value", {
            get: function () {
                trackRefValue(this);
                if (this._dirty) {
                    this._dirty = false;
                    this._value = this.effect.run();
                }
                return this._value;
            },
            enumerable: false,
            configurable: true
        });
        return ComputedRefImpl;
    }());
    function computed(getterOrOptions) {
        var getter;
        var onlyGetter = typeof getterOrOptions === 'function';
        if (onlyGetter) {
            getter = getterOrOptions;
        }
        var cRef = new ComputedRefImpl(getter);
        return cRef;
    }

    var isFlushPending = false;
    var resolvedPromise = Promise.resolve();
    var pendingPreFlushCbs = [];
    function queuePreFlushCb(cb) {
        queueCb(cb, pendingPreFlushCbs);
    }
    function queueCb(cb, pendingQueue) {
        pendingQueue.push(cb);
        queueFlush();
    }
    function queueFlush() {
        if (!isFlushPending) {
            isFlushPending = true;
            resolvedPromise.then(flushJobs);
        }
    }
    function flushJobs() {
        isFlushPending = false;
        flushPreFlushCbs();
    }
    function flushPreFlushCbs() {
        if (pendingPreFlushCbs.length) {
            var activePreFlushCbs = __spreadArray([], __read(new Set(pendingPreFlushCbs)), false);
            pendingPreFlushCbs.length = 0;
            for (var i = 0; i < activePreFlushCbs.length; i++) {
                activePreFlushCbs[i]();
            }
        }
    }

    function watch(source, cb, options) {
        return doWatch(source, cb, options);
    }
    function doWatch(source, cb, _a) {
        var _b = _a === void 0 ? {} : _a, immediate = _b.immediate, deep = _b.deep;
        var getter;
        if (isReactive(source)) {
            getter = function () { return source; };
            deep = true;
        }
        else {
            getter = function () { };
        }
        if (cb && deep) {
            var baseGetter_1 = getter;
            getter = function () { return traverse(baseGetter_1()); };
        }
        var oldValue = {};
        var job = function () {
            if (cb) {
                var newValue = effect.run();
                if (deep || !Object.is(newValue, oldValue)) {
                    cb(newValue, oldValue);
                    oldValue = newValue;
                }
            }
        };
        var scheduler = function () { return queuePreFlushCb(job); };
        var effect = new ReactiveEffect(getter, scheduler);
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = effect.run();
            }
        }
        else {
            effect.run();
        }
        return function () {
            effect.stop();
        };
    }
    // 递归遍历,用于触发依赖收集
    function traverse(value) {
        if (typeof value !== 'object')
            return value;
        for (var key in value) {
            traverse(value[key]);
        }
        return value;
    }

    var Fragment = Symbol('Fragment');
    var Text = Symbol('Text');
    var Component = Symbol('Component');
    function isVNode(value) {
        return value ? value.__v_isVNode : false;
    }
    function createVNode(type, props, children) {
        if (props) {
            var klass = props.class; props.style;
            if (klass && typeof klass !== 'string') {
                props.class = normalizeClass(klass);
            }
        }
        var shapeFlag = typeof type === 'string'
            ? 1 /* ShapeFlags.ELEMENT */
            : typeof type === 'object'
                ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
                : 0;
        return createBaseVNode(type, props, children, shapeFlag);
    }
    function createBaseVNode(type, props, children, shapeFlag) {
        var vnode = {
            __v_isVNode: true,
            type: type,
            props: props,
            children: children,
            shapeFlag: shapeFlag,
            key: (props === null || props === void 0 ? void 0 : props.key) || null
        };
        normalizeChildren(vnode, children);
        return vnode;
    }
    function normalizeChildren(vnode, children) {
        var type = 0;
        if (children == null) {
            children = null;
        }
        else if (Array.isArray(children)) {
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
        }
        else if (typeof children === 'object') ;
        else if (typeof children === 'function') ;
        else {
            children = String(children);
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
        }
        vnode.children = children;
        vnode.shapeFlag |= type; // 相当于vnode.shapeFlag = vnode.shapeFlag | type
    }
    function normalizeClass(value) {
        var res = '';
        if (typeof value === 'string') {
            res = value;
        }
        else if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                var normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        }
        else if (typeof value === 'object') {
            for (var key in value) {
                if (value[key]) {
                    res += key + ' ';
                }
            }
        }
        return res.trim();
    }
    function isSameVnodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }

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
    function h(type, propsOrChildren, children) {
        var l = arguments.length;
        if (l === 2) {
            if (typeof propsOrChildren === 'object' && !Array.isArray(propsOrChildren)) {
                if (isVNode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                return createVNode(type, propsOrChildren);
            }
            else {
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVNode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    function normalizeVnode(child) {
        if (typeof child === 'object') {
            return cloneIfMounted(child);
        }
        else {
            return createVNode(Text, null, String(child));
        }
    }
    function cloneIfMounted(child) {
        return child;
    }
    function renderComponentRoot(instance) {
        var vnode = instance.vnode, render = instance.render, data = instance.data;
        var result;
        try {
            if (vnode.shapeFlag & 4 /* ShapeFlags.STATEFUL_COMPONENT */) {
                console.log(data);
                result = normalizeVnode(render.call(data, data));
            }
        }
        catch (error) {
            console.error(error);
        }
        return result;
    }

    function injectHook(type, hook, target) {
        // target是instance的组件实例
        if (target) {
            target[type] = hook;
            return hook;
        }
    }
    var createHook = function (lifecycle) {
        return function (hook, target) { return injectHook(lifecycle, hook, target); };
    };
    var onBeforeMount = createHook("bm" /* LifecycleHooks.BEFORE_MOUNT */);
    var onMounted = createHook("m" /* LifecycleHooks.MOUNTED */);

    var uid = 0;
    function createComponentInstance(vnode) {
        var instance = {
            uid: uid++,
            vnode: vnode,
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
        };
        return instance;
    }
    function handleSetupResult(instance, setupResult) {
        if (typeof setupResult === 'function') {
            instance.render = setupResult;
        }
        finishComponentSetup(instance);
    }
    function setupComponent(instance) {
        setupStatefulComponent(instance);
    }
    // 设置组件的初始状态
    function setupStatefulComponent(instance) {
        var Component = instance.type;
        var setup = Component.setup;
        if (setup) {
            var setupResult = setup();
            handleSetupResult(instance, setupResult);
        }
        else {
            finishComponentSetup(instance);
        }
    }
    function finishComponentSetup(instance) {
        var Component = instance.type;
        if (!instance.render) {
            instance.render = Component.render;
        }
        applyOptions(instance);
    }
    function applyOptions(instance) {
        var _a = instance.type, dataOptions = _a.data, beforeCreate = _a.beforeCreate, created = _a.created, beforeMount = _a.beforeMount, mounted = _a.mounted;
        // 触发beforeCreate生命周期函数
        if (beforeCreate) {
            callHook(beforeCreate, instance.data);
        }
        // 将data选项中的数据转化为响应式数据
        if (dataOptions) {
            var data = dataOptions();
            if (typeof data === 'object') {
                instance.data = reactive(data);
            }
        }
        // 触发created生命周期函数
        if (created) {
            callHook(created, instance.data);
        }
        function registerLifecycleHook(register, hook) {
            register(hook === null || hook === void 0 ? void 0 : hook.bind(instance.data), instance);
        }
        registerLifecycleHook(onBeforeMount, beforeMount);
        registerLifecycleHook(onMounted, mounted);
    }
    function callHook(hook, proxy) {
        hook.call(proxy);
    }

    // 创建renderer
    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    function baseCreateRenderer(opitons) {
        var hostInsert = opitons.insert, hostSetElementText = opitons.setElementText, hostCreateElement = opitons.createElement, hostPatchProp = opitons.patchProp, hostRemove = opitons.remove, hostCreateText = opitons.createText, hostSetText = opitons.setText;
        var patchChildren = function (oldVnode, newVnode, container, anchor) {
            var c1 = oldVnode && oldVnode.children;
            var c2 = newVnode && newVnode.children;
            var prevShapeFlag = oldVnode ? oldVnode.shapeFlag : 0;
            var shapeFlag = newVnode.shapeFlag;
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 当新节点是文本节点时,而旧节点是数组节点时
                if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // 卸载旧子节点
                    unmountElement(oldVnode);
                }
                // 如果新旧不相同则设置新节点的text
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // 当新节点和旧节点都是数组节点时
                    if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                        // diff
                        patchKeyedChildren(c1, c2, container, anchor);
                    }
                    else {
                        // 卸载
                        unmountElement(oldVnode);
                    }
                }
                else {
                    // 当旧节点不是数组节点时,而新节点是文本节点时
                    if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                        // 删除旧节点的text
                        hostSetElementText(container, '');
                    }
                }
            }
        };
        var patchKeyedChildren = function (oldChildren, newChildren, container, parentAnchor) {
            var i = 0;
            var newChildrenLength = newChildren.length;
            var oldChildrenEnd = oldChildren.length - 1;
            var newChildrenEnd = newChildrenLength - 1;
            // 1.自前向后
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                var oldVnode = oldChildren[i];
                var newVnode = newChildren[i];
                if (isSameVnodeType(oldVnode, newVnode)) {
                    patch(oldVnode, newVnode, container, null);
                }
                else {
                    break;
                }
                i++;
            }
            // 2.自后向前
            while (i <= oldChildrenEnd && i <= newChildrenEnd) {
                var oldVnode = oldChildren[oldChildrenEnd];
                var newVnode = newChildren[newChildrenEnd];
                if (isSameVnodeType(oldVnode, newVnode)) {
                    patch(oldVnode, newVnode, container, null);
                }
                else {
                    break;
                }
                oldChildrenEnd--;
                newChildrenEnd--;
            }
            // 3.新节点多于旧节点
            if (i > oldChildrenEnd) {
                if (i <= newChildrenEnd) {
                    var nextPos = newChildrenEnd + 1;
                    var anchor = nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor;
                    while (i <= newChildrenEnd) {
                        // 将元素挂载到指定的锚点位置，锚点位置在新节点的锚点位置，具体是锚点位置，
                        patch(null, normalizeVnode(newChildren[i]), container, anchor);
                        i++;
                    }
                }
                // 4.删除多余节点
            }
            else if (i > newChildrenEnd) {
                while (i <= oldChildrenEnd) {
                    unmountElement(oldChildren[i]);
                    i++;
                }
            }
            // 5. 乱序的 diff 比对
            else {
                var oldStartIndex = i; // 旧子节点开始的索引
                var newStartIndex = i; // 新子节点开始的索引
                // 5.1 创建一个 <key (新节点的key)：index(新节点的位置)的Map对象
                // 通过该对象可知：新的child(根据key判断指定child)更新后的位置（根据对应的index判断)在哪里
                var keyToNewIndexMap = new Map();
                for (i = newStartIndex; i <= newChildrenEnd; i++) {
                    var nextChild = normalizeVnode(newChildren[i]);
                    if (nextChild.key != null) {
                        keyToNewIndexMap.set(nextChild.key, i);
                    }
                }
                // 5.2 遍历oldChildren，并尝试进行patch（打补丁）或unmount（删除）旧节点
                var j = void 0;
                var patched = 0; // 记录已经修复的新节点数量，
                var toBePatched = newChildrenEnd - newStartIndex + 1; // 新节点待修补的数量
                var moved = false; // 标记位：节点是否需要移动
                var maxNewIndexSoFar = 0; // 配合moved进行使用，始终保存当前最大的index值
                //创建一个Array的对象，用来确定最长递增子序列
                var newIndexToOldIndexMap = new Array(toBePatched);
                for (i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
                    var prevChild = oldChildren[i];
                    if (patched >= toBePatched) {
                        unmountElement(prevChild);
                        continue;
                    }
                    var newIndex = void 0;
                    if (prevChild.key != null) {
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    if (newIndex === undefined) {
                        unmountElement(prevChild);
                    }
                    else {
                        newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1;
                        if (newIndex >= maxNewIndexSoFar) {
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            moved = true;
                        }
                        patch(prevChild, newChildren[newIndex], container, null);
                        patched++;
                    }
                }
                // 5.3 针对移动和挂载的处理
                // 仅当节点需要移动的时候，我们才需要最长递增子序列，否则只需要有一个空数组即可
                var increasingNewIndexSequence = moved
                    ? getSequence(newIndexToOldIndexMap)
                    : [];
                j = increasingNewIndexSequence.length - 1;
                for (i = toBePatched - 1; i >= 0; i--) {
                    var nextIndex = newStartIndex + i;
                    var nextChild = newChildren[nextIndex];
                    var anchor = nextIndex + 1 < newChildrenLength
                        ? newChildren[nextIndex + 1].el
                        : parentAnchor;
                    // 表示新节点没有对应的旧节点，此时需要挂载新节点
                    if (newIndexToOldIndexMap[i] === 0) {
                        patch(null, nextChild, container, anchor);
                    }
                    else if (moved) {
                        // j < 0 表示不存在，表示需要移动
                        // i !== increasingNewIndexSequence[j] 表示当前节点不在最后位置
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            move(nextChild, container, anchor);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
        };
        var move = function (vnode, container, anchor) {
            var el = vnode.el;
            hostInsert(el, container, anchor);
        };
        var patchProps = function (el, vnode, oldProps, newProps) {
            if (oldProps !== newProps) {
                for (var key in newProps) {
                    var next = newProps[key];
                    var prev = oldProps[key];
                    if (next !== prev) {
                        hostPatchProp(el, key, prev, next);
                    }
                }
                // 清空旧节点的props
                if (oldProps && Object.keys(oldProps).length !== 0) {
                    for (var key in oldProps) {
                        if (!(key in newProps)) {
                            hostPatchProp(el, key, oldProps[key], null);
                        }
                    }
                }
            }
        };
        var setupRenderEffect = function (instance, initialVnode, container, anchor) {
            var componentUpdateFn = function () {
                // 根据组件是否挂载来判断组件式否进行渲染或更新
                if (!instance.isMounted) {
                    // -渲染组件
                    var bm = instance.bm, m = instance.m;
                    // 触发beforeMount生命周期函数
                    if (bm) {
                        bm();
                    }
                    var subTree = (instance.subTree = renderComponentRoot(instance));
                    patch(null, subTree, container, anchor);
                    // 触发mounted生命周期函数
                    if (m) {
                        m();
                    }
                    initialVnode.el = subTree.el;
                    instance.isMounted = true;
                }
                else {
                    // -更新组件
                    var next = instance.next, vnode = instance.vnode;
                    if (!next) {
                        next = vnode;
                    }
                    var nextTree = renderComponentRoot(instance);
                    var prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    patch(prevTree, nextTree, container, anchor);
                    next.el = nextTree.el;
                }
            };
            var effect = (instance.effect = new ReactiveEffect(componentUpdateFn, function () { return queuePreFlushCb(update); }));
            var update = (instance.update = function () { return effect.run(); });
            update();
        };
        var mountElement = function (vnode, container, anchor) {
            var type = vnode.type, props = vnode.props, shapeFlag = vnode.shapeFlag;
            // 创建element
            var el = (vnode.el = hostCreateElement(type));
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 设置文本
                hostSetElementText(el, vnode.children);
            }
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                mountChildren(vnode.children, el, anchor);
            }
            // 设置props
            if (props) {
                for (var key in props) {
                    hostPatchProp(el, key, null, props[key]);
                }
            }
            // 插入
            hostInsert(el, container, anchor);
        };
        var mountChildren = function (children, container, anchor) {
            if (typeof children === 'string') {
                children = children.split('');
            }
            for (var i = 0; i < children.length; i++) {
                var child = (children[i] = normalizeVnode(children[i]));
                patch(null, child, container, anchor);
            }
        };
        var mountComponent = function (initialVnode, container, anchor) {
            initialVnode.component = createComponentInstance(initialVnode);
            var instance = initialVnode.component;
            setupComponent(instance);
            setupRenderEffect(instance, initialVnode, container, anchor);
        };
        var patchElement = function (oldVnode, newVnode) {
            var el = (newVnode.el = oldVnode.el);
            var oldProps = oldVnode.props || {};
            var newProps = newVnode.props || {};
            patchChildren(oldVnode, newVnode, el, null);
            patchProps(el, newVnode, oldProps, newProps);
        };
        var unmountElement = function (vnode) {
            hostRemove(vnode.el);
        };
        // 处理HTML普通元素节点
        var processElement = function (oldVnode, newVnode, container, anchor) {
            if (oldVnode == null) {
                // 挂载element
                mountElement(newVnode, container, anchor);
            }
            else {
                // 更新element
                patchElement(oldVnode, newVnode);
            }
        };
        // 处理文本节点
        var processText = function (oldVnode, newVnode, container, anchor) {
            if (oldVnode == null) {
                newVnode.el = hostCreateText(newVnode.children);
                hostInsert(newVnode.el, container, anchor);
            }
            else {
                var el = (newVnode.el = oldVnode.el);
                if (newVnode.children !== oldVnode.children) {
                    hostSetText(el, newVnode.children);
                }
            }
        };
        // 处理Fragment
        var processFragment = function (oldVnode, newVnode, container, anchor) {
            if (oldVnode == null) {
                mountChildren(newVnode.children, container, anchor);
            }
            else {
                patchChildren(oldVnode, newVnode, container, anchor);
            }
        };
        // 处理组件
        var processComponent = function (oldVnode, newVnode, container, anchor) {
            if (oldVnode == null) {
                // 挂载组件
                mountComponent(newVnode, container, anchor);
            }
        };
        // 处理虚拟DOM的更新
        var patch = function (oldVnode, newVnode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            if (oldVnode === newVnode)
                return;
            // 如果节点类型不同，则卸载旧节点，用来更新新节点
            if (oldVnode && !isSameVnodeType(oldVnode, newVnode)) {
                unmountElement(oldVnode);
                oldVnode = null;
            }
            var type = newVnode.type, shapeFlag = newVnode.shapeFlag;
            switch (type) {
                case Text:
                    processText(oldVnode, newVnode, container, anchor);
                    break;
                case Component:
                    break;
                case Fragment:
                    processFragment(oldVnode, newVnode, container, anchor);
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                        processElement(oldVnode, newVnode, container, anchor);
                    }
                    else if (shapeFlag & 6 /* ShapeFlags.COMPONENT */) {
                        processComponent(oldVnode, newVnode, container, anchor);
                    }
            }
        };
        var render = function (vnode, container) {
            // 传入元素为null，则卸载元素
            if (vnode === null) {
                // _vnode表示旧节点，这里判定旧节点是否存在，存在则卸载
                if (container._vnode) {
                    unmountElement(container._vnode);
                }
            }
            else {
                patch(container._vnode || null, vnode, container);
            }
            // 缓存vnode，作为旧节点
            container._vnode = vnode;
        };
        return {
            render: render
        };
    }
    // 获取最长递增子序列
    function getSequence(arr) {
        var p = arr.slice();
        var result = [0];
        var i, j, u, v, c;
        var len = arr.length;
        for (i = 0; i < len; i++) {
            var arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = (u + v) >> 1;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }

    function patchClass(el, value) {
        if (value === null) {
            el.removeAttribute('class');
        }
        else {
            el.className = value;
        }
    }

    function patchStyle(el, prev, next) {
        var style = el.style;
        var isCssString = typeof next === 'string';
        if (next && !isCssString) {
            for (var key in next) {
                setStyle(style, key, next[key]);
            }
        }
        if (prev && !(typeof prev === 'string')) {
            for (var key in prev) {
                if (next[key] == null) {
                    setStyle(style, key, '');
                }
            }
        }
    }
    function setStyle(style, name, val) {
        style[name] = val;
    }

    function patchDOMProp(el, key, value) {
        try {
            el[key] = value;
        }
        catch (e) { }
    }

    function patchAttr(el, key, value) {
        if (value === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, value);
        }
    }

    function patchEvent(el, rawName, prevValue, nextValue) {
        var invokers = el._vei || (el._vei = {});
        var existingInvoker = invokers[rawName];
        if (nextValue && existingInvoker) {
            existingInvoker.value = nextValue;
        }
        else {
            var name_1 = parseName(rawName);
            if (nextValue) {
                var invoker = (invokers[rawName] = createInvoker(nextValue));
                el.addEventListener(name_1, invoker);
            }
            else if (existingInvoker) {
                el.removeEventListener(name_1, existingInvoker);
                invokers[rawName] = undefined;
            }
        }
    }
    function parseName(name) {
        return name.slice(2).toLowerCase();
    }
    function createInvoker(initialValue) {
        var invoker = function (e) {
            invoker.value && invoker.value();
        };
        invoker.value = initialValue;
        return invoker;
    }

    var patchProp = function (el, key, prevValue, nextValue) {
        var onRE = /^on[^a-z]/;
        if (key === 'class') {
            // 挂载class
            patchClass(el, nextValue);
        }
        else if (key === 'style') {
            // 挂载style
            patchStyle(el, prevValue, nextValue);
        }
        else if (onRE.test(key)) {
            // 挂载事件
            patchEvent(el, key, prevValue, nextValue);
        }
        else if (shouldSetAsProp(el, key)) {
            // 挂载DOM属性，例如input的value
            patchDOMProp(el, key, nextValue);
        }
        else {
            // 挂载元素html属性
            patchAttr(el, key, nextValue);
        }
    };
    // js中,设置元素属性时，需要分别设置两种属性，一种是DOM属性，另一种是html属性
    // 判断是否是DOM属性
    function shouldSetAsProp(el, key) {
        if (key === 'form')
            return false;
        if (key === 'list' && el.tagName === 'INPUT')
            return false;
        if (key === 'type' && el.tagName === 'TEXTAREA')
            return false;
        return key in el;
    }

    var doc = document;
    var nodeOps = {
        insert: function (child, parent, anchor) {
            parent.insertBefore(child, anchor || null);
        },
        createElement: function (tag) {
            var el = doc.createElement(tag);
            return el;
        },
        setElementText: function (el, text) {
            el.textContent = text;
        },
        remove: function (el) {
            var parent = el.parentNode;
            if (parent) {
                parent.removeChild(el);
            }
        },
        createText: function (text) {
            return doc.createTextNode(text);
        },
        setText: function (node, text) {
            node.nodeValue = text;
        }
    };

    var rendererOptions = Object.assign({ patchProp: patchProp }, nodeOps);
    var renderer;
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    var render = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = ensureRenderer()).render.apply(_a, __spreadArray([], __read(args), false));
    };

    function createParserContext(content) {
        return {
            source: content
        };
    }
    function createRoot(children) {
        return {
            type: 0 /* NodeTypes.ROOT */,
            children: children,
            loc: {}
        };
    }
    function baseParse(content) {
        var context = createParserContext(content);
        var children = parseChildren(context, []);
        return createRoot(children);
    }
    // 该函数用于解析解析器上下文中的子节点
    function parseChildren(context, ancestors) {
        var nodes = [];
        while (!isEnd(context, ancestors)) {
            var s = context.source;
            var node 
            // 判断是否为插值语法
            = void 0;
            // 判断是否为插值语法
            if (startsWith(s, '{{')) {
                // 模版插值语法
                node = parseInterpolation(context);
                // 判断是否为标签开头
            }
            else if (s[0] === '<') {
                if (/[a-z]/i.test(s[1])) {
                    node = parseElement(context, ancestors);
                }
            }
            if (!node) {
                node = parseText(context);
            }
            pushNode(nodes, node);
        }
        return nodes;
    }
    function parseInterpolation(context) {
        var _a = __read(['{{', '}}'], 2), open = _a[0], close = _a[1];
        advanceBy(context, open.length);
        var closeIndex = context.source.indexOf(close, open.length);
        var preTrimContent = parseTextData(context, closeIndex);
        var content = preTrimContent.trim();
        advanceBy(context, close.length);
        return {
            type: 5 /* NodeTypes.INTERPOLATION */,
            content: {
                type: 4 /* NodeTypes.SIMPLE_EXPRESSION */,
                isStatic: false,
                content: content
            }
        };
    }
    // 处理标签
    function parseElement(context, ancestors) {
        // 先处理开始标签
        var element = parseTag(context);
        // 添加自节点
        ancestors.push(element);
        // 递归触发 parseChildren
        var children = parseChildren(context, ancestors);
        ancestors.pop();
        // 为子节点赋值
        element.children = children;
        // 最后处理结束标签
        if (startsWithEndTagOpen(context.source, element.tag)) {
            parseTag(context);
        }
        // 整个标签处理完成
        return element;
    }
    function parseTag(context, type) {
        // 通过正则获取标签
        var match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
        // 标签名
        var tag = match[1];
        //对模板进行解析处理
        advanceBy(context, match[0].length);
        // --- 处理标签结束部分 ---
        // 判断是否为自关闭标签，例如<img/>
        var isSelfClosing = startsWith(context.source, '/>');
        // 《继续》对模板进行解析处理，是自关闭标签则处理两个字符 /> ，不是则处理一个字符 >
        advanceBy(context, isSelfClosing ? 2 : 1);
        //标签类型
        var tagType = 0 /* ElementTypes.ELEMENT */;
        return {
            type: 1 /* NodeTypes.ELEMENT */,
            tag: tag,
            tagType: tagType,
            children: [],
            props: []
        };
    }
    // 该函数的功能是解析文本内容，并返回一个包含文本类型和内容的对象。
    function parseText(context) {
        var endTokens = ['<', '{{'];
        var endIndex = context.source.length;
        for (var i = 0; i < endTokens.length; i++) {
            var index = context.source.indexOf(endTokens[i], 1);
            if (index !== -1 && endIndex > index) {
                endIndex = index;
            }
        }
        var content = parseTextData(context, endIndex);
        return {
            type: 2 /* NodeTypes.TEXT */,
            content: content
        };
    }
    // 该函数将文本节点中的文本内容解析出来并返回，再将其从context中截掉
    function parseTextData(context, length) {
        var rawText = context.source.slice(0, length);
        advanceBy(context, length);
        return rawText;
    }
    function pushNode(nodes, node) {
        nodes.push(node);
    }
    function advanceBy(context, numberOfCharacters) {
        var source = context.source;
        context.source = source.slice(numberOfCharacters);
    }
    function startsWith(source, searchString) {
        return source.startsWith(searchString);
    }
    // 判断是否为标签结束部分
    function startsWithEndTagOpen(source, tag) {
        return startsWith(source, '</');
    }
    function isEnd(context, ancestors) {
        var s = context.source;
        // 解析是否为结束标签
        if (startsWith(s, '</')) {
            for (var i = ancestors.length - 1; i >= 0; i--) {
                if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                    return true;
                }
            }
        }
        return !s;
    }

    function isSingleElementRoot(root, child) {
        var children = root.children;
        return children.length === 1 && child.type === 1 /* NodeTypes.ELEMENT */;
    }

    var _a;
    var CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
    var CREATE_VNODE = Symbol('createVNode');
    var TO_DISPLAY_STRING = Symbol('toDisplayString');
    var helperNameMap = (_a = {},
        _a[CREATE_ELEMENT_VNODE] = 'createElementVNode',
        _a[CREATE_VNODE] = 'createVNode',
        _a[TO_DISPLAY_STRING] = 'toDisplayString',
        _a);

    function transform(root, options) {
        var context = createTransformContext(root, options);
        traverseNode(root, context);
        createRootCodegen(root);
        root.helpers = __spreadArray([], __read(context.helpers.keys()), false);
        root.components = [];
        root.directives = [];
        root.imports = [];
        root.hoists = [];
        root.temps = [];
        root.cached = [];
    }
    // 该函数用于创建一个转换上下文对象，用于在节点转换过程中保存状态和提供辅助函数
    function createTransformContext(root, _a) {
        var _b = _a.nodeTransforms, nodeTransforms = _b === void 0 ? [] : _b;
        var context = {
            nodeTransforms: nodeTransforms,
            root: root,
            helpers: new Map(),
            currentNode: root,
            parent: null,
            childIndex: 0,
            // 获取辅助函数名称
            helper: function (name) {
                var count = context.helpers.get(name) || 0;
                context.helpers.set(name, count + 1);
                return name;
            }
        };
        return context;
    }
    //深度优先遍历转化
    function traverseNode(node, context) {
        context.currentNode = node;
        var nodeTransforms = context.nodeTransforms;
        var exitFns = [];
        for (var i_1 = 0; i_1 < nodeTransforms.length; i_1++) {
            var onExit = nodeTransforms[i_1](node, context);
            if (onExit) {
                exitFns.push(onExit);
            }
        }
        switch (node.type) {
            case 1 /* NodeTypes.ELEMENT */:
            case 0 /* NodeTypes.ROOT */:
                traverseChildren(node, context);
                break;
            case 5 /* NodeTypes.INTERPOLATION */:
                context.helper(TO_DISPLAY_STRING);
                break;
        }
        context.currentNode = node;
        var i = exitFns.length;
        while (i--) {
            exitFns[i]();
        }
    }
    function traverseChildren(parent, context) {
        parent.children.forEach(function (node, index) {
            context.parent = parent;
            context.childIndex = index;
            traverseNode(node, context);
        });
    }
    function createRootCodegen(root) {
        var children = root.children;
        // 处理单个根节点
        if (children.length === 1) {
            var child = children[0];
            // 当根节点只有一个子节点，并且子节点是元素节点
            if (isSingleElementRoot(root, child) && child.codegenNode) {
                // 这一步意味着编译器将跳过创建额外的包裹元素，直接使用子元素的代码生成节点作为输出
                // 从而简化渲染逻辑和提高性能
                root.codegenNode = child.codegenNode;
            }
        }
    }

    // 该函数的目的是构造一个表示虚拟节点调用的对象
    function createVNodeCall(context, tag, props, children) {
        if (context) {
            context.helper(CREATE_ELEMENT_VNODE);
        }
        return {
            type: 13 /* NodeTypes.VNODE_CALL */,
            tag: tag,
            props: props,
            children: children
        };
    }

    var transformElement = function (node, context) {
        return function postTransformElement() {
            node = context.currentNode;
            if (node.type !== 1 /* NodeTypes.ELEMENT */) {
                return;
            }
            var tag = node.tag;
            var vnodeTag = "\"".concat(tag, "\"");
            var vnodeProps = [];
            var vnodeChildren = node.children;
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    };

    function isText(node) {
        // 节点类型为插值表达式或者文本
        return node.type === 5 /* NodeTypes.INTERPOLATION */ || node.type === 2 /* NodeTypes.TEXT */;
    }
    function getVNodeHelper(ssr, isComponent) {
        return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
    }

    // 将相邻的文本节点和表达式合并为一个表达式
    var transformText = function (node, context) {
        if (node.type === 0 /* NodeTypes.ROOT */ || // 根节点
            node.type === 1 /* NodeTypes.ELEMENT */ || // 元素节点
            node.type === 11 /* NodeTypes.FOR */ || // for节点
            node.type === 10 /* NodeTypes.IF_BRANCH */ // if节点
        ) {
            return function () {
                var children = node.children;
                var currentContainer;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (isText(child)) {
                        for (var j = i + 1; j < children.length; j++) {
                            var next = children[j];
                            if (isText(next)) {
                                if (!currentContainer) {
                                    currentContainer = children[i] = createCompoundExpression([child], child.loc);
                                }
                                currentContainer.children.push(" + ", next);
                                children.splice(j, 1);
                                j--;
                            }
                        }
                    }
                    else {
                        currentContainer = undefined;
                        break;
                    }
                }
            };
        }
    };
    function createCompoundExpression(children, loc) {
        return {
            type: 8 /* NodeTypes.COMPOUND_EXPRESSION */,
            loc: loc,
            children: children
        };
    }

    var aliasHelper = function (s) { return "".concat(helperNameMap[s], ": _").concat(helperNameMap[s]); };
    function createCodegenContext(ast) {
        var context = {
            code: '',
            runtimeGlobalName: 'Vue',
            source: ast.loc.source,
            indentLevel: 0,
            isSSR: false,
            helper: function (key) {
                return "_".concat(helperNameMap[key]); // 需要触发的方法，关联JavaScript AST中的 helpers
            },
            push: function (code) {
                context.code += code;
            },
            newline: function () {
                newline(context.indentLevel);
            },
            indent: function () {
                newline(++context.indentLevel);
            },
            deindent: function () {
                newline(--context.indentLevel);
            }
        };
        function newline(n) {
            context.code += '\n' + "  ".repeat(n);
        }
        return context;
    }
    function generate(ast) {
        var context = createCodegenContext(ast);
        var push = context.push, newline = context.newline, indent = context.indent, deindent = context.deindent;
        genFunctionPreamble(context);
        var functionName = "render";
        var args = ['_ctx', '_cache'];
        var signature = args.join(', ');
        push("function ".concat(functionName, "(").concat(signature, "){"));
        indent();
        push("with (_ctx) {");
        indent();
        var hasHelpers = ast.helpers.length > 0;
        if (hasHelpers) {
            push("const { ".concat(ast.helpers.map(aliasHelper).join(', '), " } = _Vue"));
            push('\n');
            newline();
        }
        newline();
        push("return ");
        if (ast.codegenNode) {
            genNode(ast.codegenNode, context);
        }
        else {
            push("null");
        }
        deindent();
        push('}');
        deindent();
        push('}');
        return {
            ast: ast,
            code: context.code
        };
    }
    function genFunctionPreamble(context) {
        var push = context.push, runtimeGlobalName = context.runtimeGlobalName, newline = context.newline;
        var VueBinding = runtimeGlobalName;
        push("const _Vue = ".concat(VueBinding, "\n"));
        newline();
        push("return ");
    }
    function genNode(node, context) {
        switch (node.type) {
            case 13 /* NodeTypes.VNODE_CALL */:
                genVNodeCall(node, context);
                break;
            case 2 /* NodeTypes.TEXT */:
                genText(node, context);
                break;
            case 4 /* NodeTypes.SIMPLE_EXPRESSION */:
                genExpression(node, context);
                break;
            case 5 /* NodeTypes.INTERPOLATION */:
                genInterpolation(node, context);
                break;
            case 8 /* NodeTypes.COMPOUND_EXPRESSION */:
                genCompoundExpression(node, context);
                break;
            case 1 /* NodeTypes.ELEMENT */:
                genNode(node.codegenNode, context);
                break;
        }
    }
    function genText(node, context) {
        context.push(JSON.stringify(node.content), node);
    }
    function genExpression(node, context) {
        var content = node.content, isStatic = node.isStatic;
        context.push(isStatic ? JSON.stringify(content) : content);
    }
    function genInterpolation(node, context) {
        var push = context.push, helper = context.helper;
        push("".concat(helper(TO_DISPLAY_STRING), "("));
        genNode(node.content, context);
        push(')');
    }
    function genCompoundExpression(node, context) {
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (typeof child === 'string') {
                context.push(child);
            }
            else {
                genNode(child, context);
            }
        }
    }
    function genVNodeCall(node, context) {
        var push = context.push, helper = context.helper;
        var tag = node.tag, isComponent = node.isComponent, props = node.props, children = node.children, patchFlag = node.patchFlag, dynamicProps = node.dynamicProps; node.directives; node.isBlock; node.disableTracking;
        var callHelper = getVNodeHelper(context.isSSR, isComponent);
        push(helper(callHelper) + "(");
        var args = genNullableArgs([tag, props, children, patchFlag, dynamicProps]);
        genNodeList(args, context);
        push(')');
    }
    function genNullableArgs(args) {
        var i = args.length;
        while (i--) {
            if (args[i] != null)
                break;
        }
        return args.slice(0, i + 1).map(function (arg) { return arg || "null"; });
    }
    function genNodeList(nodes, context) {
        var push = context.push; context.newline;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (typeof node === 'string') {
                push(node);
            }
            else if (node instanceof Array) {
                context.push('[');
                genNodeList(node, context);
                context.push(']');
            }
            else {
                genNode(node, context);
            }
            if (i < nodes.length - 1) {
                push(", ");
            }
        }
    }

    function baseCompile(template, options) {
        if (options === void 0) { options = {}; }
        var ast = baseParse(template);
        transform(ast, Object.assign(options, {
            nodeTransforms: [transformElement, transformText]
        }));
        return generate(ast);
    }

    function compile(template, options) {
        return baseCompile(template, options);
    }

    function compileToFunction(template, options) {
        var code = compile(template, options).code;
        var render = new Function(code)();
        return render;
    }

    var toDisplayString = function (str) {
        return String(str);
    };

    exports.Component = Component;
    exports.Fragment = Fragment;
    exports.Text = Text;
    exports.compile = compileToFunction;
    exports.computed = computed;
    exports.createElementVNode = createVNode;
    exports.effect = effect;
    exports.h = h;
    exports.queuePreFlushCb = queuePreFlushCb;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.toDisplayString = toDisplayString;
    exports.watch = watch;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map
