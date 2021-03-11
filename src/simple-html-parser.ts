
const spaceRegex = /\s/ // 匹配空格字符的正则表达式
const tokenRegex = /[a-zA-Z0-9\-]/ // 英文字母、数字、中划线

export class HTMLParser {
  input: string
  cur: number
  constructor() {
    this.input = '' //要扫描的字符串
    this.cur = 0    //当前要扫描的位置
  }

  get eof() { // 内容是否都扫描完了
    return this.cur >= this.input.length
  }

  peek(offset: number = 0) {
    return this.input[this.cur + offset]
  }

  consumeChar(char: string) {
    const curChar = this.peek()
    if (curChar === char) {
      this.cur++
    } else {
      throw new Error(`Unexpected character: '${curChar}' should be '${char}'`)
    }
  }

  // 从当前位置开始，消耗遇到的全部空格，直到遇到非空格
  consumeSpace() {
    this.consumeWhile(spaceRegex)
  }

  // 从当前位置开始，消耗一个特定的符合正则测试的字符串
  // 例如对于 'abc 123'，consumeWhile(/[a-z]/) 会返回 'abc'
  consumeWhile(regex: RegExp) {
    const result = []
    do {
      const curChar = this.peek()
      if (regex.test(curChar)) {
        result.push(curChar)
        this.cur++
      } else {
        break
      }
    } while (!this.eof)

    return result.join('')
  }

  parse(input: string) {
    this.input = input
    this.cur = 0
    // 根可能有一堆节点，所以我们需要实现一个 parseNodes 方法
    return this.parseNodes()
  }

  parseNodes(): Array<any> {
    const nodes = []
    do {
      let node

      // 碰见 < 说明要开起一个 tag 了
      if (this.peek() === '<') {
        // 碰见 </ 说明我们在同层的 nodes 都解析完了，可以走了
        if (this.peek(1) === '/') break
        node = this.parseElement()
      } else {
        node = this.parseTextNode()
      }
      nodes.push(node)
    } while (!this.eof)
    return nodes
  }

  parseElement() {
    // 吃掉一个开标签
    this.consumeChar('<')
    // 拿到 tag
    const tag = this.parseTag()
    this.consumeSpace()
    // 拿到属性
    const attrs = this.parseAttrs()
    this.consumeChar('>')
    // 吃掉子节点
    const children = this.parseNodes()
    // 吃掉一个闭标签
    this.consumeChar('<')
    this.consumeChar('/')
    const closeTag = this.parseTag()
    this.consumeSpace()
    this.consumeChar('>')
    return {
      tag,
      attrs,
      children
    }
  }

  parseTextNode() {
    // 很简单，把不是 < 的字符收集起来
    const text = this.consumeWhile(/[^<]/)
    return text.replace(/[\s\n]+/g, ' ')
  }

  parseTag() {
    // 很简单，拿到一个 tag
    const tag = this.consumeWhile(tokenRegex)
    return tag
  }

  parseAttrs() {
    const attrs: {[x: string]: any} = {}
    // 在没遇到 > 的时候说明还在 <  > 里面，可以一个一个的把属性收集起来
    while (this.peek() !== '>') {
      // 重复利用一下 parseTag，获取标签名
      const name = this.parseTag()
      if (this.peek() === '=') {
        // 碰到等于号的情况：< name="value" >
        this.consumeChar('=')
        this.consumeChar('"')
        const value = this.consumeWhile(/[^"]/)
        this.consumeChar('"')
        attrs[name] = value
      } else {
        // 没有等于号：< name >
        attrs[name] = ''
      }
      this.consumeSpace()
    }
    // 返回收集到的属性
    return attrs
  }

}


const html = `
  <div class="root" data-id="0">
    Root element
  </div>
`