export function patchStyle(el:Element,prev,next) {
  const style = (el as HTMLElement).style
  const isCssString = typeof next === 'string'
  if(next && !isCssString){
    for(const key in next){
      setStyle(style,key,next[key])
    }
  }
  if(prev && !(typeof prev === 'string')){
    for(const key in prev){
      if(next[key] == null) {
        setStyle(style,key,'')
      }
    }
  }
}
function setStyle(style:CSSStyleDeclaration,name:string,val:string){
  style[name] = val
}