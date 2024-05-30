const person = {
  name: 'TXC',
  get sayHi() {
    return `Hi, ${this.name}`
  }
}
const proxyPerson = new Proxy(person, {
  get(target, key, reciver) {
    console.log('H')
    return Reflect.get(target, key, reciver)
  }
})
proxyPerson.sayHi
