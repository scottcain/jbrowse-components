import React from 'react'
import Color from 'color'
import Path from 'svg-path-generator'
import OffscreenCanvasRenderingContext2DShim, {
  isMethodCall,
  isSetterCall,
} from './Canvas2DContextShim'

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

export default class OffscreenCanvasShim {
  width: number
  height: number

  context: OffscreenCanvasRenderingContext2DShim

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.context = new OffscreenCanvasRenderingContext2DShim(
      this.width,
      this.height,
    )
  }

  getContext(type: '2d') {
    if (type !== '2d') {
      throw new Error(`unknown type ${type}`)
    }
    return this.context
  }

  toDataURL(): string {
    throw new Error('not supported')
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
    this.context?.commands.forEach((command, index) => {
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
}
