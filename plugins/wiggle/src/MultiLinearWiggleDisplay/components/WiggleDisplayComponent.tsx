import React from 'react'
import {
  measureText,
  getContainingView,
  getContainingTrack,
} from '@jbrowse/core/util'
import { getConf } from '@jbrowse/core/configuration'
import {
  LinearGenomeViewModel,
  BaseLinearDisplayComponent,
} from '@jbrowse/plugin-linear-genome-view'
import { observer } from 'mobx-react'

// locals
import { WiggleDisplayModel } from '../models/model'
import YScaleBar from './YScaleBar'
import SubtrackLabel from './SubtrackLabel'

type LGV = LinearGenomeViewModel

const trackLabelFontSize = 12.8

function getOffset(model: WiggleDisplayModel) {
  const { prefersOffset } = model
  const { trackLabels } = getContainingView(model) as LGV
  const track = getContainingTrack(model)
  const trackName = getConf(track, 'name')
  return trackLabels === 'overlapping' && !prefersOffset
    ? measureText(trackName, trackLabelFontSize) + 100
    : 10
}

const Wrapper = observer(
  ({
    children,
    model,
    exportSVG,
  }: {
    model: WiggleDisplayModel
    children: React.ReactNode
    exportSVG?: boolean
  }) => {
    if (exportSVG) {
      return <>{children}</>
    } else {
      const { height } = model
      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            height,
            width: 1800,
          }}
        >
          {children}
        </svg>
      )
    }
  },
)

const RectBg = (props: {
  x: number
  y: number
  width: number
  height: number
  color?: string
}) => {
  const { color = 'rgb(255,255,255,0.8)' } = props
  return <rect {...props} fill={color} />
}

const ScoreLegend = observer(({ model }: { model: WiggleDisplayModel }) => {
  const { ticks, scaleType } = model
  const { width } = getContainingView(model) as LGV
  const legend =
    `[${ticks.values[0]}-${ticks.values[1]}]` +
    (scaleType === 'log' ? ' (log scale)' : '')
  const len = measureText(legend, 14)
  const padding = 25
  const xpos = width - len - padding
  return (
    <>
      <RectBg y={0} x={xpos} width={len + 6} height={16} />
      <text y={13} x={xpos}>
        {legend}
      </text>
    </>
  )
})

const ColorLegendInteractive = observer(
  ({
    model,
    rowHeight,
    labelWidth,
    exportSVG,
  }: {
    model: WiggleDisplayModel
    rowHeight: number
    labelWidth: number
    exportSVG?: boolean
  }) => {
    const {
      needsScalebar,
      needsFullHeightScalebar,
      rowHeightTooSmallForScalebar,
      renderColorBoxes,
      sources,
    } = model
    const fontSize = Math.min(rowHeight, 12)
    const canDisplayLabel = rowHeight > 11
    const colorBoxWidth = renderColorBoxes ? 15 : 0
    const legendWidth = labelWidth + colorBoxWidth + 5
    const svgOffset = exportSVG ? 10 : 0
    const extraOffset =
      svgOffset || (needsScalebar && !rowHeightTooSmallForScalebar ? 50 : 10)

    return sources ? (
      <div style={{ position: 'relative' }}>
        {
          /* 0.25 for hanging letters like g */
          needsFullHeightScalebar ? (
            <RectBg
              y={0}
              x={extraOffset}
              width={legendWidth}
              height={(sources.length + 0.25) * rowHeight}
            />
          ) : null
        }
        {sources.map((source, idx) => {
          const boxHeight = Math.min(20, rowHeight)
          return canDisplayLabel ? (
            <SubtrackLabel
              key={source.name + '-' + idx}
              source={source}
              model={model}
              style={{
                position: 'absolute',
                top: idx * rowHeight,
                left: extraOffset + colorBoxWidth + 2,
                height: boxHeight,
                fontSize,
                background: 'white',
              }}
            />
          ) : null
        })}
      </div>
    ) : null
  },
)

const ColorLegend = observer(
  ({
    model,
    rowHeight,
    labelWidth,
    exportSVG,
  }: {
    model: WiggleDisplayModel
    rowHeight: number
    labelWidth: number
    exportSVG?: boolean
  }) => {
    const {
      needsCustomLegend,
      needsScalebar,
      needsFullHeightScalebar,
      rowHeightTooSmallForScalebar,
      renderColorBoxes,
      sources,
    } = model
    const fontSize = Math.min(rowHeight, 12)
    const canDisplayLabel = rowHeight > 11
    const colorBoxWidth = renderColorBoxes ? 15 : 0
    const legendWidth = labelWidth + colorBoxWidth + 5
    const svgOffset = exportSVG ? 10 : 0
    const extraOffset =
      svgOffset || (needsScalebar && !rowHeightTooSmallForScalebar ? 50 : 0)
    return sources ? (
      <>
        {
          /* 0.25 for hanging letters like g */
          needsFullHeightScalebar ? (
            <RectBg
              y={0}
              x={extraOffset}
              width={legendWidth}
              height={(sources.length + 0.25) * rowHeight}
            />
          ) : null
        }
        {sources.map((source, idx) => {
          const boxHeight = Math.min(20, rowHeight)
          return (
            <React.Fragment key={source.name + '-' + idx}>
              {!needsFullHeightScalebar ? (
                <RectBg
                  y={idx * rowHeight + 1}
                  x={extraOffset}
                  width={legendWidth}
                  height={boxHeight}
                />
              ) : null}
              {source.color ? (
                <RectBg
                  y={idx * rowHeight + 1}
                  x={extraOffset}
                  width={colorBoxWidth}
                  height={needsCustomLegend ? rowHeight : boxHeight}
                  color={source.color}
                />
              ) : null}
              {canDisplayLabel ? (
                <text
                  y={idx * rowHeight + 13}
                  x={extraOffset + colorBoxWidth + 2}
                  fontSize={fontSize}
                >
                  {source.name}
                </text>
              ) : null}
            </React.Fragment>
          )
        })}
      </>
    ) : null
  },
)

export const StatBars = observer(
  (props: {
    model: WiggleDisplayModel
    orientation?: string
    exportSVG?: boolean
  }) => {
    const { model, orientation, exportSVG } = props
    const {
      stats,
      needsCustomLegend,
      needsFullHeightScalebar,
      rowHeightTooSmallForScalebar,
      rowHeight,
      sources,
      ticks,
    } = model
    const fontSize = Math.min(rowHeight, 12)
    const canDisplayLabel = rowHeight > 11
    const { width: viewWidth } = getContainingView(model) as LGV
    const minWidth = 20

    const ready = stats && sources
    if (!ready) {
      return null
    }

    const labelWidth = Math.max(
      ...(sources
        .map(s => measureText(s.name, fontSize))
        .map(width => (canDisplayLabel ? width : minWidth)) || [0]),
    )

    return (
      <>
        {!exportSVG && !needsFullHeightScalebar ? (
          <ColorLegendInteractive
            model={model}
            rowHeight={rowHeight}
            labelWidth={labelWidth}
          />
        ) : null}

        <Wrapper {...props}>
          {needsFullHeightScalebar ? (
            <>
              <g
                transform={`translate(${!exportSVG ? getOffset(model) : 0},0)`}
              >
                <YScaleBar model={model} orientation={orientation} />
              </g>
              <g transform={`translate(${viewWidth - labelWidth - 100},0)`}>
                <ColorLegend
                  exportSVG={exportSVG}
                  model={model}
                  rowHeight={12}
                  labelWidth={labelWidth}
                />
              </g>
            </>
          ) : (
            <>
              {exportSVG ? (
                <ColorLegend
                  exportSVG={exportSVG}
                  model={model}
                  rowHeight={model.rowHeight}
                  labelWidth={labelWidth}
                />
              ) : null}
              {rowHeightTooSmallForScalebar || needsCustomLegend ? (
                <ScoreLegend {...props} />
              ) : (
                sources.map((_source, idx) => (
                  <g
                    transform={`translate(0 ${rowHeight * idx})`}
                    key={JSON.stringify(ticks) + '-' + idx}
                  >
                    <YScaleBar model={model} orientation={orientation} />
                  </g>
                ))
              )}
            </>
          )}
        </Wrapper>
      </>
    )
  },
)

const LinearWiggleDisplay = observer((props: { model: WiggleDisplayModel }) => {
  const { model } = props

  return (
    <div>
      <BaseLinearDisplayComponent {...props} />
      <StatBars model={model} />
    </div>
  )
})

export default LinearWiggleDisplay

export { YScaleBar }
