import BoxRendererType, {
  RenderArgs,
  RenderArgsSerialized,
  RenderArgsDeserialized as BoxRenderArgsDeserialized,
  RenderResults,
  ResultsSerialized,
  ResultsDeserialized,
} from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { Feature } from '@jbrowse/core/util'
import { renderToAbstractCanvas } from '@jbrowse/core/util/offscreenCanvasUtils'

export interface RenderArgsDeserialized extends BoxRenderArgsDeserialized {
  colorBy?: { type: string; tag?: string }
  colorTagMap?: Record<string, string>
  modificationTagMap?: Record<string, string>
  sortedBy?: {
    type: string
    pos: number
    refName: string
    assemblyName: string
    tag?: string
  }
  showSoftClip: boolean
  highResolutionScaling: number
}

export interface RenderArgsDeserializedWithFeaturesAndLayout
  extends RenderArgsDeserialized {
  features: Map<string, Feature>
}

interface LayoutFeature {
  heightPx: number
  topPx: number
  feature: Feature
}

export default class LinearVariantMatrixRenderer extends BoxRendererType {
  supportsSVG = true

  makeImageData({
    ctx,
    canvasWidth,
    renderArgs,
  }: {
    ctx: CanvasRenderingContext2D
    canvasWidth: number
    layoutRecords: (LayoutFeature | null)[]
    renderArgs: RenderArgsDeserializedWithFeaturesAndLayout
  }) {
    const { config, showSoftClip, colorBy, theme: configTheme } = renderArgs
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 100, 100)
  }

  async render(renderProps: RenderArgsDeserialized) {
    const features = await this.getFeatures(renderProps)
    const { regions, bpPerPx } = renderProps
    const [region] = regions

    const { end, start } = region

    const width = (end - start) / bpPerPx
    const height = 400
    console.log('t1')
    const Color = await import('color').then(f => f.default)
    const res = await renderToAbstractCanvas(width, height, renderProps, ctx =>
      this.makeImageData({
        ctx,
        canvasWidth: width,
        renderArgs: {
          ...renderProps,
          features,
          Color,
        },
      }),
    )

    const results = await super.render({
      ...renderProps,
      ...res,
      features,
      height,
      width,
    })

    return {
      ...results,
      ...res,
      features: new Map(),
      height,
      width,
    }
  }
}

export type {
  RenderArgs,
  RenderArgsSerialized,
  RenderResults,
  ResultsSerialized,
  ResultsDeserialized,
}
