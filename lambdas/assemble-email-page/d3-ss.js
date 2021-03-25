// https://github.com/d3-node/d3-node/blob/master/src/index.js
const jsdom = require('jsdom')
const { JSDOM } = jsdom;
const d3 = require('d3')

module.exports = D3Node

module.exports.d3 = d3
module.exports.jsDom = JSDOM

function fixXmlCase (text) {
  // Fix a jsdom issue where all SVG tagNames are lowercased:
  // https://github.com/tmpvar/jsdom/issues/620
  var tagNames = ['linearGradient', 'radialGradient', 'clipPath', 'textPath']
  for (var i = 0, l = tagNames.length; i < l; i++) {
    var tagName = tagNames[i]
    text = text.replace(
      new RegExp('(<|</)' + tagName.toLowerCase() + '\\b', 'g'),
      function (all, start) {
        return start + tagName
      })
  }
  return text
}

function D3Node ({ d3Module = d3, selector = '', container = '', styles = '', svgStyles = '', canvasModule = '' } = {}) {
  // deprecates props
  if (svgStyles && !styles) { // deprecated svgStyles option
    console.warn('WARNING: svgStyles is deprecated, please use styles instead !!')
    styles = svgStyles
  }

  // auto-new instance, so we always have 'this'
  if (!(this instanceof D3Node)) {
    return new D3Node({ d3Module, selector, container, styles })
  }

  // setup DOM
  let dom = new JSDOM('', { pretendToBeVisual: true })
  if (container) {
	  console.log('activate d3 container')
    dom = new JSDOM(container, { pretendToBeVisual: true })
  }
  document = dom.window.document
  // setup d3 selection
  let d3Element = d3Module.select(document.body)
  if (selector) {
	console.log('Using Selector', selector)
    d3Element = d3Element.select(selector)
  }

  this.dom = dom
  this.options = { d3Module, selector, container, styles, canvasModule }
  this.document = document
  this.window = dom.window
  this.d3Element = d3Element
  this.d3 = d3Module
}

D3Node.prototype.createSVG = function (width, height, attrs) {
  const svg = this.d3Element.append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')

  if (width && height) {
    svg.attr('width', width)
      .attr('height', height)
  }

  if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      svg.attr(key, attrs[key])
    })
  }

  if (this.options.styles) {
    svg.append('defs')
      .append('style')
      .attr('type', 'text/css')
      .text(`<![CDATA[ ${this.options.styles} ]]>`)
  }
  console.log('svg', this.d3Element.select('svg').html())
  return svg
}

// experimental method for creating canvas
D3Node.prototype.createCanvas = function (width, height) {
  const Canvas = this.options.canvasModule
  if (!Canvas || !Canvas.version) {
    throw new Error('Install node-canvas for HTMLCanvasElement support.')
  }

  let canvas = null
  // console.log('using Canvas.version:', Canvas.version)
  if (parseInt(Canvas.version) >= 2) {
    canvas = new Canvas.Canvas(width, height)
  } else {
    canvas = new Canvas(width, height)
  }
  this.options.canvas = canvas
  return canvas
}

D3Node.prototype.svgString = function () {
  if (this.d3Element.select('svg').node()) {
    // temp until: https://github.com/tmpvar/jsdom/issues/1368
    return fixXmlCase(this.d3Element.select('svg').node().outerHTML)
  }
  return ''
}

D3Node.prototype.html = function () {
	const htmlString = this.dom.serialize()
	console.log('html serialized, chart was', this.svgString())
  return htmlString
}

D3Node.prototype.chartHTML = function () {
  return this.document.querySelector(this.options.selector).outerHTML
}
