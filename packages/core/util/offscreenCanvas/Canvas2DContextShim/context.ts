/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeCommands, encodeCommand } from './command_codec'
import { getSerializedSvg } from './svg'
import { MethodName, SetterName } from './types'

//* maximum anticipated size of a binary-serialized call
const MAX_BINARY_CALL_SIZE = 1000

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

  private flushEncoderIfNeeded() {
    // if we are nearly to the end of our current commands buffer, store it (with excess trimmed off) and make a new one
    if (
      this.currentCommandBufferOffset >
      this.currentCommandBuffer.length - MAX_BINARY_CALL_SIZE
    ) {
      this.flushEncoder()
    }
  }

  private flushEncoder() {
    this.commandBuffers.push(
      this.currentCommandBuffer.subarray(0, this.currentCommandBufferOffset),
    )
    this.currentCommandBufferOffset = 0
  }

  private pushMethodCall(name: MethodName, args: unknown[]) {
    this.flushEncoderIfNeeded()
    this.currentCommandBufferOffset = encodeCommand(
      name,
      args,
      this.currentCommandBuffer,
      this.currentCommandBufferOffset,
    )
  }

  private pushSetterCall(name: SetterName, arg: unknown) {
    this.flushEncoderIfNeeded()
    this.currentCommandBufferOffset = encodeCommand(
      name,
      [arg],
      this.currentCommandBuffer,
      this.currentCommandBufferOffset,
    )
  }

  getSerializedSVG() {
    return getSerializedSvg(this)
  }

  getStoredCommands() {
    this.flushEncoder()
    this.commandBuffers = [Buffer.concat(this.commandBuffers)]
    return decodeCommands(this.commandBuffers[0])
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
    const [x, y, w, h] = args as number[]
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
