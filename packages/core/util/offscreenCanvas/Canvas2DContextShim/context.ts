/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeCommands, encodeCommand } from './binary_command_codec'
import { DebuggingValidator } from './DebuggingValidator'
import { getSerializedSvg } from './svg'
import { MethodName, SetterName } from './types'

//* maximum anticipated size of a binary-serialized call
const MAX_BINARY_CALL_SIZE = 1500
const COMMAND_PAGE_SIZE = MAX_BINARY_CALL_SIZE * 8000

/** get the params type of real method in OffscreenCanvasRenderingContext2D */
type RealP<METHODNAME extends keyof OffscreenCanvasRenderingContext2D> =
  OffscreenCanvasRenderingContext2D[METHODNAME] extends (...arg0: any[]) => any
    ? Parameters<OffscreenCanvasRenderingContext2D[METHODNAME]>
    : never

/** get the return type of real method in OffscreenCanvasRenderingContext2D */
type RealRet<METHODNAME extends keyof OffscreenCanvasRenderingContext2D> =
  OffscreenCanvasRenderingContext2D[METHODNAME] extends (...arg0: any[]) => any
    ? ReturnType<OffscreenCanvasRenderingContext2D[METHODNAME]>
    : never

/** get the type of the params of a method of the canvas shim */
export type ShimP<
  METHODNAME extends keyof OffscreenCanvasRenderingContext2DShim,
> = OffscreenCanvasRenderingContext2DShim[METHODNAME] extends (
  ...arg0: any[]
) => any
  ? Parameters<OffscreenCanvasRenderingContext2DShim[METHODNAME]>
  : never

const DEBUG = false

function concatArrayBuffers(views: ArrayBufferView[]) {
  let length = 0
  for (const v of views) {
    length += v.byteLength
  }

  const buf = new Uint8Array(length)
  let offset = 0
  for (const v of views) {
    const uint8view = new Uint8Array(v.buffer, v.byteOffset, v.byteLength)
    buf.set(uint8view, offset)
    offset += uint8view.byteLength
  }

  return buf
}

export default class OffscreenCanvasRenderingContext2DShim {
  width: number
  height: number

  currentFont = '12px Courier New, monospace'
  currentStrokeStyle = ''
  currentFillStyle = ''

  currentCommandBuffer = new Uint8Array(COMMAND_PAGE_SIZE)
  currentCommandBufferOffset = 0
  commandBuffers: Uint8Array[] = []

  debugValidator = new DebuggingValidator()

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  private flushCommandEncoderIfNeeded() {
    // if we are nearly to the end of our current commands buffer, store it (with excess trimmed off) and make a new one
    if (
      this.currentCommandBufferOffset >
      this.currentCommandBuffer.byteLength - MAX_BINARY_CALL_SIZE
    ) {
      this.flushCommandEncoder()
    }
  }

  private flushCommandEncoder() {
    this.commandBuffers.push(
      this.currentCommandBuffer.subarray(0, this.currentCommandBufferOffset),
    )
    this.currentCommandBuffer = new Uint8Array(COMMAND_PAGE_SIZE)
    this.currentCommandBufferOffset = 0
  }

  private pushMethodCall(name: MethodName, args: unknown[]) {
    this.flushCommandEncoderIfNeeded()
    this.currentCommandBufferOffset = encodeCommand(
      name,
      args,
      this.currentCommandBuffer,
      this.currentCommandBufferOffset,
    )
    if (DEBUG) {
      this.debugValidator.push(name, args)
    }
  }

  private pushSetterCall(name: SetterName, arg: unknown) {
    this.flushCommandEncoderIfNeeded()
    this.currentCommandBufferOffset = encodeCommand(
      name,
      [arg],
      this.currentCommandBuffer,
      this.currentCommandBufferOffset,
    )
    if (DEBUG) {
      this.debugValidator.push(name, [arg])
    }
  }

  getSerializedCommands() {
    this.flushCommandEncoder()
    if (this.commandBuffers.length > 1) {
      this.commandBuffers = [concatArrayBuffers(this.commandBuffers)]
    }
    if (DEBUG) {
      this.debugValidator.validateAgainst(this.commandBuffers[0])
    }
    return this.commandBuffers[0]
  }

  getSerializedSvg() {
    return getSerializedSvg(this)
  }

  getCommands() {
    return decodeCommands(this.getSerializedCommands())
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
  arc(...args: RealP<'arc'>): RealRet<'arc'> {
    this.pushMethodCall('arc', args)
  }

  arcTo(...args: RealP<'arcTo'>): RealRet<'arcTo'> {
    this.pushMethodCall('arcTo', args)
  }

  beginPath(...args: RealP<'beginPath'>): RealRet<'beginPath'> {
    this.pushMethodCall('beginPath', args)
  }

  clearRect(...args: RealP<'clearRect'>): RealRet<'clearRect'> {
    this.pushMethodCall('clearRect', args)
  }

  closePath(...args: RealP<'closePath'>): RealRet<'closePath'> {
    this.pushMethodCall('closePath', args)
  }

  ellipse(...args: RealP<'ellipse'>): RealRet<'ellipse'> {
    this.pushMethodCall('ellipse', args)
  }

  fill(...args: RealP<'fill'>): RealRet<'fill'> {
    this.pushMethodCall('fill', args)
  }

  fillRect(...args: RealP<'fillRect'>): RealRet<'fillRect'> {
    const [x, y, w, h] = args
    if (x > this.width || x + w < 0) {
      return
    }
    const nx = Math.max(x, 0)
    const nw = nx + w > this.width ? this.width - nx : w
    this.pushMethodCall('fillRect', [nx, y, nw, h])
  }

  fillText(...args: RealP<'fillText'>): RealRet<'fillText'> {
    // if (x > this.width || x + 1000 < 0) {
    //   return
    // }
    this.pushMethodCall('fillText', args)
  }

  lineTo(...args: RealP<'lineTo'>): RealRet<'lineTo'> {
    this.pushMethodCall('lineTo', args)
  }

  measureText(...args: RealP<'measureText'>) {
    const [text] = args
    const height = Number((this.currentFont.match(/\d+/) || [])[0])
    return {
      width: (height / 2) * text.length,
      height,
    }
  }

  moveTo(...args: RealP<'moveTo'>): RealRet<'moveTo'> {
    this.pushMethodCall('moveTo', args)
  }

  quadraticCurveTo(
    ...args: RealP<'quadraticCurveTo'>
  ): RealRet<'quadraticCurveTo'> {
    this.pushMethodCall('quadraticCurveTo', args)
  }

  rect(...args: RealP<'rect'>): RealRet<'rect'> {
    this.pushMethodCall('rect', args)
  }

  restore(...args: RealP<'restore'>): RealRet<'restore'> {
    this.pushMethodCall('restore', args)
  }

  rotate(...args: RealP<'rotate'>): RealRet<'rotate'> {
    this.pushMethodCall('rotate', args)
  }

  save(...args: RealP<'save'>): RealRet<'save'> {
    this.pushMethodCall('save', args)
  }

  setTransform(...args: RealP<'setTransform'>): RealRet<'setTransform'> {
    this.pushMethodCall('setTransform', args)
  }

  scale(...args: RealP<'scale'>): RealRet<'scale'> {
    this.pushMethodCall('scale', args)
  }

  //* shim does not support passing a Path2D object */
  stroke(): RealRet<'stroke'> {
    this.pushMethodCall('stroke', [])
  }

  strokeRect(...args: RealP<'strokeRect'>): RealRet<'strokeRect'> {
    this.pushMethodCall('strokeRect', args)
  }

  strokeText(...args: RealP<'strokeText'>): RealRet<'strokeText'> {
    this.pushMethodCall('strokeText', args)
  }

  transform(...args: RealP<'transform'>): RealRet<'transform'> {
    this.pushMethodCall('transform', args)
  }

  translate(...args: RealP<'translate'>): RealRet<'translate'> {
    this.pushMethodCall('translate', args)
  }
}
