import { createRenderer } from "packages/runtime-core/src/renderer"
import { patchProp } from "./patchProp"
import { nodeOps } from "./nodeOps"
const rendererOptions = Object.assign({patchProp},nodeOps)
let renderer
function ensureRenderer(){
  return renderer || (renderer = createRenderer(rendererOptions))
}
export const render = (...args)=>{
  ensureRenderer().render(...args)
}