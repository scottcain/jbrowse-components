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

export default class OffscreenCanvasContextShim {
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

  pushCommand(c: MethodCall) {
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
    this.pushCommand({ type: 'arc', args })
  }

  arcTo(...args: unknown[]) {
    this.pushCommand({ type: 'arcTo', args })
  }

  beginPath(...args: unknown[]) {
    this.pushCommand({ type: 'beginPath', args })
  }

  clearRect(...args: unknown[]) {
    this.pushCommand({ type: 'clearRect', args })
  }

  clip(...args: unknown[]) {
    this.pushCommand({ type: 'clip', args })
  }

  closePath(...args: unknown[]) {
    this.pushCommand({ type: 'closePath', args })
  }

  createLinearGradient(...args: unknown[]) {
    this.pushCommand({ type: 'createLinearGradient', args })
  }

  createPattern(...args: unknown[]) {
    this.pushCommand({ type: 'createPattern', args })
  }

  createRadialGradient(...args: unknown[]) {
    this.pushCommand({ type: 'createRadialGradient', args })
  }

  drawFocusIfNeeded(...args: unknown[]) {
    this.pushCommand({ type: 'drawFocusIfNeeded', args })
  }

  drawImage(...args: unknown[]) {
    this.pushCommand({ type: 'drawImage', args })
  }

  ellipse(...args: unknown[]) {
    this.pushCommand({ type: 'ellipse', args })
  }

  fill(...args: unknown[]) {
    this.pushCommand({ type: 'fill', args })
  }

  fillRect(...args: unknown[]) {
    const [x, y, w, h] = args as number[]
    if (x > this.width || x + w < 0) {
      return
    }
    const nx = Math.max(x, 0)
    const nw = nx + w > this.width ? this.width - nx : w
    this.pushCommand({ type: 'fillRect', args: [nx, y, nw, h] })
  }

  fillText(...args: unknown[]) {
    // if (x > this.width || x + 1000 < 0) {
    //   return
    // }
    this.pushCommand({ type: 'fillText', args })
  }

  lineTo(...args: unknown[]) {
    this.pushCommand({ type: 'lineTo', args })
  }

  measureText(text: string) {
    const height = Number((this.currentFont.match(/\d+/) || [])[0])
    return {
      width: (height / 2) * text.length,
      height,
    }
  }

  moveTo(...args: unknown[]) {
    this.pushCommand({ type: 'moveTo', args })
  }

  quadraticCurveTo(...args: unknown[]) {
    this.pushCommand({ type: 'quadraticCurveTo', args })
  }

  rect(...args: unknown[]) {
    this.pushCommand({ type: 'rect', args })
  }

  restore(...args: unknown[]) {
    this.pushCommand({ type: 'restore', args })
  }

  rotate(...args: unknown[]) {
    this.pushCommand({ type: 'rotate', args })
  }

  save(...args: unknown[]) {
    this.pushCommand({ type: 'save', args })
  }

  setLineDash(...args: unknown[]) {
    this.pushCommand({ type: 'setLineDash', args })
  }

  setTransform(...args: unknown[]) {
    this.pushCommand({ type: 'setTransform', args })
  }

  scale(...args: unknown[]) {
    this.pushCommand({ type: 'scale', args })
  }

  stroke(...args: unknown[]) {
    this.pushCommand({ type: 'stroke', args })
  }

  strokeRect(...args: unknown[]) {
    this.pushCommand({ type: 'strokeRect', args })
  }

  strokeText(...args: unknown[]) {
    this.pushCommand({ type: 'strokeText', args })
  }

  transform(...args: unknown[]) {
    this.pushCommand({ type: 'transform', args })
  }

  translate(...args: unknown[]) {
    this.pushCommand({ type: 'translate', args })
  }
}
