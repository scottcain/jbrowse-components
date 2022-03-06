import Color from 'color'
import React from 'react'
import Path from 'svg-path-generator'
import { CanvasImageDataShim } from './types'

export interface MethodCall {
  type: string
  args: unknown[]
}

type SetterName = 'fillStyle' | 'strokeStyle' | 'font'
export interface SetterCall {
  type: SetterName
  style: string
}

export type Call = MethodCall | SetterCall

export function isMethodCall(call: Call): call is MethodCall {
  return Boolean('args' in call)
}
export function isSetterCall(call: Call): call is SetterCall {
  return Boolean('style' in call)
}

export function splitColor(color?: string) {
  const fill = Color(color)
  return { hex: fill.hex(), opacity: fill.alpha() }
}

// https://stackoverflow.com/a/5620441/2129219
export function parseFont(font: string) {
  let fontFamily = undefined
  let fontSize = undefined
  let fontStyle = 'normal'
  let fontWeight = 'normal'
  let fontVariant = 'normal'
  let lineHeight = 'normal'

  const elements = font.split(/\s+/)
  let element
  outer: while ((element = elements.shift())) {
    switch (element) {
      case 'normal':
        break

      case 'italic':
      case 'oblique':
        fontStyle = element
        break

      case 'small-caps':
        fontVariant = element
        break

      case 'bold':
      case 'bolder':
      case 'lighter':
      case '100':
      case '200':
      case '300':
      case '400':
      case '500':
      case '600':
      case '700':
      case '800':
      case '900':
        fontWeight = element
        break

      default:
        if (!fontSize) {
          const parts = element.split('/')
          fontSize = parts[0]
          if (parts.length > 1) {
            lineHeight = parts[1]
          }
          break
        }

        fontFamily = element
        if (elements.length) {
          fontFamily += ` ${elements.join(' ')}`
        }
        break outer
    }
  }

  return {
    fontStyle,
    fontVariant,
    fontWeight,
    fontSize,
    lineHeight,
    fontFamily,
  }
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

  getSerializedSvg() {
    let currentFill: string | undefined
    let currentStroke: string | undefined
    let currentPath: Array<Array<number>> = []
    let rotation: number | undefined
    let font:
      | Pick<
          ReturnType<typeof parseFont>,
          'fontStyle' | 'fontFamily' | 'fontSize'
        >
      | undefined

    const nodes: React.ReactElement[] = []
    this.commands.forEach((command, index) => {
      if (isSetterCall(command)) {
        if (command.type === 'font') {
          if (command.style) {
            // stackoverflow.com/questions/5618676
            // skip lineHeight in the final usage
            const { fontStyle, fontFamily, fontSize } = parseFont(command.style)
            font = { fontStyle, fontFamily, fontSize }
          }
        }
        if (command.type === 'fillStyle') {
          if (command.style) {
            currentFill = command.style
          }
        }
        if (command.type === 'strokeStyle') {
          if (command.style) {
            currentStroke = command.style
          }
        }
      } else if (isMethodCall(command)) {
        if (command.type === 'fillRect') {
          const [x, y, w, h] = command.args as number[]
          const { hex, opacity } = splitColor(currentFill)
          const ny = Math.min(y, y + h)
          const nh = Math.abs(h)
          nodes.push(
            <rect
              key={index}
              fill={hex}
              fillOpacity={opacity !== 1 ? opacity : undefined}
              x={x.toFixed(3)}
              y={ny.toFixed(3)}
              width={w.toFixed(3)}
              height={nh.toFixed(3)}
            />,
          )
        }
        if (command.type === 'fillText') {
          const [text, x, y] = command.args as [string, number, number]
          const { hex, opacity } = splitColor(currentFill)
          nodes.push(
            <text
              key={index}
              fill={hex}
              fillOpacity={opacity !== 1 ? opacity : undefined}
              x={x.toFixed(3)}
              y={y.toFixed(3)}
              {...font}
            >
              {text}
            </text>,
          )
        }
        if (command.type === 'beginPath') {
          currentPath = []
        }
        if (command.type === 'moveTo') {
          currentPath.push(command.args as [number, number])
        }
        if (command.type === 'lineTo') {
          currentPath.push(command.args as [number, number])
        }
        if (command.type === 'closePath') {
          /* do nothing */
        }
        if (command.type === 'fill') {
          let path = Path().moveTo(...currentPath[0])
          for (let i = 1; i < currentPath.length; i++) {
            path = path.lineTo(...currentPath[i])
          }
          path.end()
          const { hex, opacity } = splitColor(currentFill)
          nodes.push(
            <path
              key={index}
              fill={hex}
              d={path}
              fillOpacity={opacity !== 1 ? opacity : undefined}
            />,
          )
        }
        if (command.type === 'stroke') {
          let path = Path().moveTo(...currentPath[0])
          for (let i = 1; i < currentPath.length; i++) {
            path = path.lineTo(...currentPath[i])
          }
          path.end()
          const { hex, opacity } = splitColor(currentStroke)
          nodes.push(
            <path
              key={index}
              fill="none"
              stroke={hex}
              fillOpacity={opacity !== 1 ? opacity : undefined}
              d={path}
            />,
          )
        }
        if (command.type === 'rotate') {
          const [radians] = command.args as [number]
          rotation = (radians * 180) / Math.PI
        }
      } else {
        throw new Error('invalid call')
      }
    })
    return rotation ? (
      <g transform={`rotate(${rotation})`}>{[...nodes]}</g>
    ) : (
      <>{[...nodes]}</>
    )
  }

  toJSON(): CanvasImageDataShim {
    return {
      commands: this.commands,
      height: this.height,
      width: this.width,
    }
  }
}
