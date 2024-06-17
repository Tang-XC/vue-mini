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
        var shapeFlag = typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : typeof type === 'object' ? 4 /* ShapeFlags.STATEFUL_COMPONENT */ : 0;
        return createBaseVNode(type, props, children, shapeFlag);
    }
    function createBaseVNode(type, props, children, shapeFlag) {
        var vnode = {
            __v_isVNode: true,
            type: type,
            props: props,
            children: children,
            shapeFlag: shapeFlag
        };
        normalizeChildren(vnode, children);
        return vnode;
    }
    function normalizeChildren(vnode, children) {
        var type = 0;
        vnode.shapeFlag;
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

    // 创建renderer
    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    function baseCreateRenderer(opitons) {
        var hostInsert = opitons.insert, hostSetElementText = opitons.setElementText, hostCreateElement = opitons.createElement, hostPatchProp = opitons.patchProp, hostRemove = opitons.remove;
        var patchChildren = function (oldVnode, newVnode, container, anchor) {
            var c1 = oldVnode && oldVnode.children;
            var c2 = newVnode && newVnode.children;
            var prevShapeFlag = oldVnode ? oldVnode.shapeFlag : 0;
            var shapeFlag = newVnode.shapeFlag;
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 如果新旧不相同则设置新节点的text
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                // 当新节点不是文本节点时，而旧节点是数组节点时
                if (prevShapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) ;
                else {
                    // 当旧节点不是数组节点时,而旧节点时文本节点时
                    if (prevShapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                        // 删除旧节点的text
                        hostSetElementText(container, '');
                    }
                }
            }
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
                if (oldProps && Object.keys(oldProps).length !== 0) {
                    for (var key in oldProps) {
                        if (!(key in newProps)) {
                            hostPatchProp(el, key, oldProps[key], null);
                        }
                    }
                }
            }
        };
        var mountElement = function (vnode, container, anchor) {
            var type = vnode.type, props = vnode.props, shapeFlag = vnode.shapeFlag;
            // 创建element
            var el = (vnode.el = hostCreateElement(type));
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 设置文本
                hostSetElementText(el, vnode.children);
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
        var patchElement = function (oldVnode, newVnode) {
            var el = (newVnode.el = oldVnode.el);
            var oldProps = oldVnode.props || {};
            var newProps = newVnode.props || {};
            patchChildren(oldVnode, newVnode, el);
            patchProps(el, newVnode, oldProps, newProps);
        };
        var unmountElement = function (vnode) {
            hostRemove(vnode.el);
        };
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
        var patch = function (oldVnode, newVnode, container, anchor) {
            if (anchor === void 0) { anchor = null; }
            if (oldVnode === newVnode)
                return;
            if (oldVnode && !isSameVnodeType(oldVnode, newVnode)) {
                unmountElement(oldVnode);
                oldVnode = null;
            }
            var type = newVnode.type, shapeFlag = newVnode.shapeFlag;
            switch (type) {
                case Text:
                    break;
                case Component:
                    break;
                case Fragment:
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                        processElement(oldVnode, newVnode, container, anchor);
                    }
            }
        };
        var render = function (vnode, container) {
            if (vnode === null) ;
            else {
                patch(container._vnode || null, vnode, container);
            }
            container._vnode = vnode;
        };
        return {
            render: render
        };
    }

    function patchClass(el, value) {
        if (value === null) {
            el.removeAttribute('class');
        }
        else {
            el.className = value;
        }
    }

    var patchProp = function (el, key, prevValue, nextValue) {
        var onRE = /^on[^a-z]/;
        if (key === 'class') {
            patchClass(el, nextValue);
        }
        else if (key === 'style') ;
        else if (onRE.test(key)) ;
        else ;
    };

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

    exports.Component = Component;
    exports.Fragment = Fragment;
    exports.Text = Text;
    exports.computed = computed;
    exports.effect = effect;
    exports.h = h;
    exports.queuePreFlushCb = queuePreFlushCb;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.watch = watch;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map
