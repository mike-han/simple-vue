import { parseComponent } from './html-parser'

const htmlNode = document.getElementById('html')
const parserNode = document.getElementById('parser')
let html = ''
htmlNode.addEventListener('change', (evt: any) => {
  html = evt.target.value
})
parserNode.addEventListener('click', () => {
  const template = `<div class="blog-post">
  <h3>{{ title }}</h3>
  <div v-html="content"></div>
</div>`

  const ast = parseComponent(template)
  console.log('Parse html result', ast)
})


