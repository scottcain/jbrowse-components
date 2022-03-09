/* eslint-disable no-restricted-globals */

// This file is a ponyfill for the HTML5 OffscreenCanvas API.

import isNode from 'detect-node'
import OffscreenCanvasShim from './CanvasShim'

import {
  AbstractCanvas,
  AbstractImageBitmap,
  isCanvasImageDataShim,
} from './types'
import type {
  createCanvas as NodeCreateCanvas,
  Canvas as NodeCanvas,
} from 'canvas'
import {
  isMethodCall,
  isSetterCall,
} from './Canvas2DContextShim'

export let createCanvas: (width: number, height: number) => AbstractCanvas
export let createImageBitmap: (
  canvas: AbstractCanvas,
) => Promise<AbstractImageBitmap>

/** the JS class (constructor) for offscreen-generated image bitmap data */
export let ImageBitmapType: Function

export function drawImageOntoCanvasContext(
  imageData: AbstractImageBitmap,
  context: CanvasRenderingContext2D,
) {
  if (isCanvasImageDataShim(imageData)) {
    // const commands = deserializeCommands(imageData.commands)
    // commands.on('data', command => {
    //   console.log(command)
    //   if (isSetterCall(command)) {
    //     context[command.type] = command.style
    //   } else if (isMethodCall(command)) {
    //     // @ts-ignore
    //     // eslint-disable-next-line prefer-spread
    //     context[command.type].apply(context, command.args)
    //   }
    // })
    // return new Promise((resolve, reject) => {
    //   commands.on('close', resolve)
    //   commands.on('error', reject)
    // })
  } else if (imageData instanceof ImageBitmapType) {
    context.drawImage(imageData as CanvasImageSource, 0, 0)
    // @ts-ignore
  } else if (imageData.dataURL) {
    throw new Error('dataURL deserialization no longer supported')
    // const img = new Image()
    // img.onload = () => context.drawImage(img, 0, 0)
    // img.src = imageData.dataURL
  }
}

const weHave = {
  realOffscreenCanvas: false, // typeof OffscreenCanvas === 'function',
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
