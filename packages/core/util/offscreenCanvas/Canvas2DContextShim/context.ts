import { encodeCommand } from './command_codec'
import { Call, MethodName, SetterName } from './types'

//* maximum anticipated size of a binary-serialized call
const MAX_BINARY_CALL_SIZE = 1000

export default class OffscreenCanvasRenderingContext2DShim {
  width: number
  height: number

  currentFont = '12px Courier New, monospace'
  currentStrokeStyle = ''
  currentFillStyle = ''

  currentCommandBuffer = Buffer.allocUnsafe(MAX_BINARY_CALL_SIZE * 1000)
  currentCommandBufferOffset = 0
  commandBuffers: Buffer[] = []

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  private flushEncoder() {
    // if we are nearly to the end of our current commands buffer, store it (with excess trimmed off) and make a new one
    if (
      this.currentCommandBufferOffset >
      this.currentCommandBuffer.length - MAX_BINARY_CALL_SIZE
    ) {
      this.commandBuffers.push(
        this.currentCommandBuffer.subarray(0, this.currentCommandBufferOffset),
      )
      this.currentCommandBufferOffset = 0
    }
  }

  private pushMethodCall(name: MethodName, args: unknown[]) {
    this.flushEncoder()
    this.currentCommandBufferOffset = encodeCommand(
      name,
      args,
      this.currentCommandBuffer,
      this.currentCommandBufferOffset,
    )
  }

  private pushSetterCall(name: SetterName, arg: unknown) {
    this.flushEncoder()
    this.currentCommandBufferOffset = encodeCommand(
      name,
      [arg],
      this.currentCommandBuffer,
      this.currentCommandBufferOffset,
    )
  }

  forEachStoredCommand(callback: (c: Call, index: number) => void) {
    this.flushEncoder()
  }

  // setters (no getters working)
  set strokeStyle(style: string) {
    if (style !== this.currentStrokeStyle) {
      this.pushSetterCall('strokeStyle', style)
      this.currentStrokeStyle = style
    }
  }

  set fillStyle(style: string) {
    if (style !== this.currentFillStyle) {
      this.pushSetterCall('fillStyle', style)
      this.currentFillStyle = style
    }
  }

  set font(style: string) {
    this.currentFont = style
    this.pushSetterCall('font', style)
  }

  // methods
  arc(...args: unknown[]) {
    this.pushMethodCall('arc', args)
  }

  arcTo(...args: unknown[]) {
    this.pushMethodCall('arcTo', args)
  }

  beginPath(...args: unknown[]) {
    this.pushMethodCall('beginPath', args)
  }

  clearRect(...args: unknown[]) {
    this.pushMethodCall('clearRect', args)
  }

  closePath(...args: unknown[]) {
    this.pushMethodCall('closePath', args)
  }

  ellipse(...args: unknown[]) {
    this.pushMethodCall('ellipse', args)
  }

  fill(...args: unknown[]) {
    this.pushMethodCall('fill', args)
  }

  fillRect(...args: unknown[]) {
    const [x, y, w, h] = args as number[]
    if (x > this.width || x + w < 0) {
      return
    }
    const nx = Math.max(x, 0)
    const nw = nx + w > this.width ? this.width - nx : w
    this.pushMethodCall('fillRect', [nx, y, nw, h])
  }

  fillText(...args: unknown[]) {
    // if (x > this.width || x + 1000 < 0) {
    //   return
    // }
    this.pushMethodCall('fillText', args)
  }

  lineTo(...args: unknown[]) {
    this.pushMethodCall('lineTo', args)
  }

  measureText(text: string) {
    const height = Number((this.currentFont.match(/\d+/) || [])[0])
    return {
      width: (height / 2) * text.length,
      height,
    }
  }

  moveTo(...args: unknown[]) {
    this.pushMethodCall('moveTo', args)
  }

  quadraticCurveTo(...args: unknown[]) {
    this.pushMethodCall('quadraticCurveTo', args)
  }

  rect(...args: unknown[]) {
    this.pushMethodCall('rect', args)
  }

  restore(...args: unknown[]) {
    this.pushMethodCall('restore', args)
  }

  rotate(...args: unknown[]) {
    this.pushMethodCall('rotate', args)
  }

  save(...args: unknown[]) {
    this.pushMethodCall('save', args)
  }

  setTransform(...args: unknown[]) {
    this.pushMethodCall('setTransform', args)
  }

  scale(...args: unknown[]) {
    this.pushMethodCall('scale', args)
  }

  strokeRect(...args: unknown[]) {
    this.pushMethodCall('strokeRect', args)
  }

  strokeText(...args: unknown[]) {
    this.pushMethodCall('strokeText', args)
  }

  transform(...args: unknown[]) {
    this.pushMethodCall('transform', args)
  }

  translate(...args: unknown[]) {
    this.pushMethodCall('translate', args)
  }
}
