/* eslint-disable no-restricted-globals */

// This file is a ponyfill for the HTML5 OffscreenCanvas API.

import isNode from 'detect-node'
import OffscreenCanvasShim from './CanvasShim'

import type { AbstractCanvas, AbstractImageBitmap } from './types'
import type {
  createCanvas as NodeCreateCanvas,
  Canvas as NodeCanvas,
} from 'canvas'

export let createCanvas: (width: number, height: number) => AbstractCanvas
export let createImageBitmap: (
  canvas: AbstractCanvas,
) => Promise<AbstractImageBitmap>

/** the JS class (constructor) for offscreen-generated image bitmap data */
export let ImageBitmapType: Function

const weHave = {
  realOffscreenCanvas: typeof global.OffscreenCanvas === 'function',
  node: isNode,
}

if (weHave.realOffscreenCanvas) {
  createCanvas = (width, height) => new OffscreenCanvas(width, height)
  // @ts-ignore
  createImageBitmap = window.createImageBitmap || self.createImageBitmap
  ImageBitmapType = window.ImageBitmap || self.ImageBitmap
} else if (weHave.node) {
  // use node-canvas if we are running in node (i.e. automated tests)
  const { createCanvas: nodeCreateCanvas, Image } = require('canvas')
  createCanvas = nodeCreateCanvas as typeof NodeCreateCanvas
  createImageBitmap = async (canvas, ...otherargs) => {
    if (otherargs.length) {
      throw new Error(
        'only one-argument uses of createImageBitmap are supported by the node offscreencanvas ponyfill',
      )
    }
    const dataUri = (canvas as NodeCanvas).toDataURL()
    const img = new Image()
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataUri
    })
  }
  ImageBitmapType = Image
} else {
  createCanvas = (width, height) => {
    return new OffscreenCanvasShim(width, height)
  }
  createImageBitmap = async canvas => {
    const ctx = (canvas as OffscreenCanvasShim).getContext('2d')
    return ctx
  }
  ImageBitmapType = String
}
