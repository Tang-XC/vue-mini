import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
export default [
  {
    // 入口文件
    input: 'packages/vue/src/index.ts',
    //打包出口
    // amd——异步模块定义，用于像RequireJS这样的模块加载器
    // cjs——CommonJS，适用于Node和Browserify等打包工具
    // esm——将软件包保存为ES模块文件，在现代浏览器中可以通过<script type=module>标签引入
    // iife——一个自动执行的功能，适合作为<script>标签。(如果要为应用程序创建一个捆绑包，您可能想要使用它，因为它会使文件大小变小)
    // umd——通用模块定义，以amd，cjs和iife为一体
    // system——SystemJS加载器格式
    output: [
      {
        // 开启sourcemap
        sourcemap: true,
        // 导出文件地址
        file: './packages/vue/dist/vue.js',
        // 导出格式
        format: 'iife',
        // 导出的模块名称
        name: 'Vue'
      }
    ],
    plugins: [
      // ts支持
      typescript({
        sourceMap: true
      }),
      // 模块导入的路径补全
      resolve(),
      // 将CommonJS模块转换为ES2015
      commonjs
    ]
  }
]
