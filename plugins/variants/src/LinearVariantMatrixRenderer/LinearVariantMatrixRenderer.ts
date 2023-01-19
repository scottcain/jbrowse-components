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

export default class LinearVariantMatrixRenderer extends BoxRendererType {
  supportsSVG = true

  makeImageData({
    ctx,
    canvasWidth,
    canvasHeight,
    renderArgs,
  }: {
    ctx: CanvasRenderingContext2D
    canvasWidth: number
    canvasHeight: number
    renderArgs: RenderArgsDeserializedWithFeaturesAndLayout
  }) {
    const { features } = renderArgs
    const feats = [...features.values()]
    const samples = feats[0].get('samples')
    const keys = Object.keys(samples)
    const w = canvasWidth / feats.length
    const h = canvasHeight / keys.length
    for (let i = 0; i < feats.length; i++) {
      const x = (i / feats.length) * canvasWidth
      for (let j = 0; j < keys.length; j++) {
        const y = (j / keys.length) * canvasHeight
        const key = keys[j]
        const samp = feats[i].get('samples')
        const s = samp[key].GT[0]
        if (s === '0|0') {
          ctx.fillStyle = 'grey'
        } else if (s === '1|0' || s === '0|1') {
          ctx.fillStyle = 'teal'
        } else if (s === '1|1') {
          ctx.fillStyle = 'blue'
        } else {
          ctx.fillStyle = 'purple'
        }
        ctx.fillRect(x, y, w, h)
      }
    }
  }

  async render(renderProps: RenderArgsDeserialized) {
    const features = await this.getFeatures(renderProps)
    const { regions, bpPerPx } = renderProps
    const [region] = regions

    const { end, start } = region

    const width = (end - start) / bpPerPx
    const height = 400
    const res = await renderToAbstractCanvas(width, height, renderProps, ctx =>
      this.makeImageData({
        ctx,
        canvasWidth: width,
        canvasHeight: height,
        renderArgs: {
          ...renderProps,
          features,
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
