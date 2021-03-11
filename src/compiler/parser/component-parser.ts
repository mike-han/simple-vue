import { parseHTML } from './html-parser'
import { makeMap } from '../shared/utils'

var splitRE = /\r?\n/g;
var emptyRE = /^\s*$/;
var needFixRE = /^(\r?\n)*[\t\s]/;

const count = (line: string, type: any) => {
  var i = 0;
  while (line.charAt(i) === type) {
    i++;
  }
  return i
}

const deIndent = (str: string) => {
  if (!needFixRE.test(str)) {
    return str
  }
  var lines = str.split(splitRE);
  var min = Infinity;
  var type, cur, c;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!emptyRE.test(line)) {
      if (!type) {
        c = line.charAt(0);
        if (c === ' ' || c === '\t') {
          type = c;
          cur = count(line, type);
          if (cur < min) {
            min = cur;
          }
        } else {
          return str
        }
      } else {
        cur = count(line, type);
        if (cur < min) {
          min = cur;
        }
      }
    }
  }
  return lines.map(function (line: string | any[]) {
    return line.slice(min)
  }).join('\n')
};


var splitRE$1 = /\r?\n/g;
var replaceRE = /./g;
var isSpecialTag = makeMap('script,style,template', true);

export const parseTemplate = (
  content: string,
  options: {
    deindent: boolean,
    outputSourceRange: any,
    pad: number
  } = {} as any
) => {

  var sfc: {
    [x: string]: any
  } = {
    template: null,
    script: null,
    styles: [],
    customBlocks: [],
    errors: []
  };
  var depth = 0;
  var currentBlock: { end?: any; start: any; type: any; content: any; attrs?: any; } = null;

  var warn = function (msg: any) {
    sfc.errors.push(msg);
  };

  function start(
    tag: string,
    attrs: any[],
    unary: any,
    start: any,
    end: any
  ) {
    if (depth === 0) {
      currentBlock = {
        type: tag,
        content: '',
        start: end,
        attrs: attrs.reduce(function (cumulated: { [x: string]: any; }, ref: { name: any; value: any; }) {
          var name = ref.name;
          var value = ref.value;

          cumulated[name] = value || true;
          return cumulated
        }, {})
      };
      if (isSpecialTag(tag)) {
        checkAttrs(currentBlock, attrs);
        if (tag === 'style') {
          sfc.styles.push(currentBlock);
        } else {
          sfc[tag] = currentBlock;
        }
      } else { // custom blocks
        sfc.customBlocks.push(currentBlock);
      }
    }
    if (!unary) {
      depth++;
    }
  }

  function checkAttrs(block: { type?: any; content?: string; start?: any; attrs?: any; lang?: any; scoped?: any; module?: any; src?: any; }, attrs: string | any[]) {
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (attr.name === 'lang') {
        block.lang = attr.value;
      }
      if (attr.name === 'scoped') {
        block.scoped = true;
      }
      if (attr.name === 'module') {
        block.module = attr.value || true;
      }
      if (attr.name === 'src') {
        block.src = attr.value;
      }
    }
  }

  function end(tag: any, start: any) {
    if (depth === 1 && currentBlock) {
      currentBlock.end = start;
      var text = content.slice(currentBlock.start, currentBlock.end);
      if (options.deindent !== false) {
        text = deIndent(text);
      }
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      if (currentBlock.type !== 'template' && options.pad) {
        text = padContent(currentBlock as any, options.pad) + text;
      }
      currentBlock.content = text;
      currentBlock = null;
    }
    depth--;
  }

  function padContent(block: { start: number; type: string; lang: any; }, pad: string | number) {
    if (pad === 'space') {
      return content.slice(0, block.start).replace(replaceRE, ' ')
    } else {
      var offset = content.slice(0, block.start).split(splitRE$1).length;
      var padChar = block.type === 'script' && !block.lang
        ? '//\n'
        : '\n';
      return Array(offset).join(padChar)
    }
  }

  parseHTML(content, {
    warn: warn,
    start: start,
    end: end,
    outputSourceRange: options.outputSourceRange
  });

  return sfc
}