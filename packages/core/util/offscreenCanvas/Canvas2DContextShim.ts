export interface MethodCall {
  type: string
  args: unknown[]
}

type SetterType = 'fillStyle' | 'strokeStyle' | 'font'

export interface SetterCall {
  type: SetterType
  style: string
}

export type Call = MethodCall | SetterCall

export function isMethodCall(call: Call): call is MethodCall {
  return Boolean('args' in call)
}
export function isSetterCall(call: Call): call is SetterCall {
  return Boolean('style' in call)
}

export default class OffscreenCanvasRenderingContext2DShim {
  width: number
  height: number

  currentFont = '12px Courier New, monospace'
  currentStrokeStyle = ''
  currentFillStyle = ''

  commands: (MethodCall | SetterCall)[]

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.commands = []
  }

  pushMethodCall(c: MethodCall) {
    this.commands.push(c)
  }

  pushSetterCall(c: SetterCall) {
    this.commands.push(c)
  }

  // setters (no getters working)
  set strokeStyle(style: string) {
    if (style !== this.currentStrokeStyle) {
      this.pushSetterCall({ type: 'strokeStyle', style })
      this.currentStrokeStyle = style
    }
  }

  set fillStyle(style: string) {
    if (style !== this.currentFillStyle) {
      this.pushSetterCall({ type: 'fillStyle', style })
      this.currentFillStyle = style
    }
  }

  set font(style: string) {
    this.currentFont = style
    this.pushSetterCall({ type: 'font', style })
  }

  // methods
  arc(...args: unknown[]) {
    this.pushMethodCall({ type: 'arc', args })
  }

  arcTo(...args: unknown[]) {
    this.pushMethodCall({ type: 'arcTo', args })
  }

  beginPath(...args: unknown[]) {
    this.pushMethodCall({ type: 'beginPath', args })
  }

  clearRect(...args: unknown[]) {
    this.pushMethodCall({ type: 'clearRect', args })
  }

  clip(...args: unknown[]) {
    this.pushMethodCall({ type: 'clip', args })
  }

  closePath(...args: unknown[]) {
    this.pushMethodCall({ type: 'closePath', args })
  }

  createLinearGradient(...args: unknown[]) {
    this.pushMethodCall({ type: 'createLinearGradient', args })
  }

  createPattern(...args: unknown[]) {
    this.pushMethodCall({ type: 'createPattern', args })
  }

  createRadialGradient(...args: unknown[]) {
    this.pushMethodCall({ type: 'createRadialGradient', args })
  }

  drawFocusIfNeeded(...args: unknown[]) {
    this.pushMethodCall({ type: 'drawFocusIfNeeded', args })
  }

  drawImage(...args: unknown[]) {
    this.pushMethodCall({ type: 'drawImage', args })
  }

  ellipse(...args: unknown[]) {
    this.pushMethodCall({ type: 'ellipse', args })
  }

  fill(...args: unknown[]) {
    this.pushMethodCall({ type: 'fill', args })
  }

  fillRect(...args: unknown[]) {
    const [x, y, w, h] = args as number[]
    if (x > this.width || x + w < 0) {
      return
    }
    const nx = Math.max(x, 0)
    const nw = nx + w > this.width ? this.width - nx : w
    this.pushMethodCall({ type: 'fillRect', args: [nx, y, nw, h] })
  }

  fillText(...args: unknown[]) {
    // if (x > this.width || x + 1000 < 0) {
    //   return
    // }
    this.pushMethodCall({ type: 'fillText', args })
  }

  lineTo(...args: unknown[]) {
    this.pushMethodCall({ type: 'lineTo', args })
  }

  measureText(text: string) {
    const height = Number((this.currentFont.match(/\d+/) || [])[0])
    return {
      width: (height / 2) * text.length,
      height,
    }
  }

  moveTo(...args: unknown[]) {
    this.pushMethodCall({ type: 'moveTo', args })
  }

  quadraticCurveTo(...args: unknown[]) {
    this.pushMethodCall({ type: 'quadraticCurveTo', args })
  }

  rect(...args: unknown[]) {
    this.pushMethodCall({ type: 'rect', args })
  }

  restore(...args: unknown[]) {
    this.pushMethodCall({ type: 'restore', args })
  }

  rotate(...args: unknown[]) {
    this.pushMethodCall({ type: 'rotate', args })
  }

  save(...args: unknown[]) {
    this.pushMethodCall({ type: 'save', args })
  }

  setLineDash(...args: unknown[]) {
    this.pushMethodCall({ type: 'setLineDash', args })
  }

  setTransform(...args: unknown[]) {
    this.pushMethodCall({ type: 'setTransform', args })
  }

  scale(...args: unknown[]) {
    this.pushMethodCall({ type: 'scale', args })
  }

  stroke(...args: unknown[]) {
    this.pushMethodCall({ type: 'stroke', args })
  }

  strokeRect(...args: unknown[]) {
    this.pushMethodCall({ type: 'strokeRect', args })
  }

  strokeText(...args: unknown[]) {
    this.pushMethodCall({ type: 'strokeText', args })
  }

  transform(...args: unknown[]) {
    this.pushMethodCall({ type: 'transform', args })
  }

  translate(...args: unknown[]) {
    this.pushMethodCall({ type: 'translate', args })
  }
}
