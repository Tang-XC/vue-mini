import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformText } from './transforms/transformText'
import { generate } from './codegen'
export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template)
  transform(
    ast,
    Object.assign(options, {
      nodeTransforms: [transformElement, transformText]
    })
  )
  return generate(ast)
}
