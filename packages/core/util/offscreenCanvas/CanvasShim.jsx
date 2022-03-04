import React from 'react'
import Color from 'color'
import Path from 'svg-path-generator'
import OffscreenCanvasContextShim from './ContextShim'

export function splitColor(color) {
  const fill = Color(color)
  return { hex: fill.hex(), opacity: fill.alpha() }
}

// https://stackoverflow.com/a/5620441/2129219
export function parseFont(font) {
  let fontFamily = null
  let fontSize = null
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
  constructor(width, height) {
    this.width = width
    this.height = height
  }

  getContext(type) {
    if (type !== '2d') {
      throw new Error(`unknown type ${type}`)
    }
    this.context = new OffscreenCanvasContextShim(this.width, this.height)
    return this.context
  }

  getSerializedSvg() {
    let currentFill
    let currentStroke
    let currentPath = []
    let rotation
    let font

    const nodes = []
    this.context.commands.forEach((command, index) => {
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
      if (command.type === 'fillRect') {
        const [x, y, w, h] = command.args
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
        const [text, x, y] = command.args
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
        currentPath.push(command.args)
      }
      if (command.type === 'lineTo') {
        currentPath.push(command.args)
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
        rotation = (command.args[0] * 180) / Math.PI
      }
    })
    return rotation ? (
      <g transform={`rotate(${rotation})`}>{[...nodes]}</g>
    ) : (
      <>{[...nodes]}</>
    )
  }
}
