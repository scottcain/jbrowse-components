import OffscreenCanvasShim from './CanvasShim'
import OffscreenCanvasRenderingContext2DShim from './Canvas2DContextShim'
import type * as NodeCanvas from 'canvas'

export type AbstractCanvas =
  | OffscreenCanvas
  | OffscreenCanvasShim
  | NodeCanvas.Canvas

export type Abstract2DCanvasContext =
  | OffscreenCanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2DShim

export type AbstractImageBitmap = Pick<ImageBitmap, 'height' | 'width'>
