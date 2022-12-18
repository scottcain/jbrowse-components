import BoxRendererType, {
  RenderArgs,
  RenderArgsSerialized,
  RenderArgsDeserialized as BoxRenderArgsDeserialized,
  RenderResults,
  ResultsSerialized,
  ResultsDeserialized,
} from '@jbrowse/core/pluggableElementTypes/renderers/BoxRendererType'
import { Region, Feature } from '@jbrowse/core/util'
import { BaseLayout } from '@jbrowse/core/util/layouts/BaseLayout'
import { readConfObject } from '@jbrowse/core/configuration'

// locals

import {
  PileupLayoutSession,
  PileupLayoutSessionProps,
} from './PileupLayoutSession'

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
  layout: BaseLayout<Feature>
  regionSequence?: string
}

export default class PileupRenderer extends BoxRendererType {
  supportsSVG = true

  // expands region for clipping to use. possible improvement: use average read
  // size to set the heuristic maxClippingSize expansion (e.g. short reads
  // don't have to expand a softclipping size a lot, but long reads might)
  getExpandedRegion(region: Region, renderArgs: RenderArgsDeserialized) {
    const { config, showSoftClip } = renderArgs

    const maxClippingSize = readConfObject(config, 'maxClippingSize')
    const { start, end } = region
    const bpExpansion = showSoftClip ? Math.round(maxClippingSize) : 0

    return {
      // xref https://github.com/mobxjs/mobx-state-tree/issues/1524 for Omit
      ...(region as Omit<typeof region, symbol>),
      start: Math.floor(Math.max(start - bpExpansion, 0)),
      end: Math.ceil(end + bpExpansion),
    }
  }

  async render(props: RenderArgsDeserialized) {
    const features = await this.getFeatures(props)
    const layout = this.createLayoutInWorker(props)
    const pm = this.pluginManager
    const { regions, bpPerPx } = props
    const [region] = regions
    const { end, start } = region
    const width = (end - start) / bpPerPx
    const render2 = await import('./asyncRenderHelper').then(r => r.default)
    const res = await render2(props, features, layout, pm)
    const height = Math.max(layout.getTotalHeight(), 1)
    const results = await super.render({
      ...props,
      ...res,
      features,
      layout,
      height,
      width,
    })

    return {
      ...results,
      ...res,
      features: new Map(),
      layout,
      height,
      width,
      maxHeightReached: layout.maxHeightReached,
    }
  }

  createSession(args: PileupLayoutSessionProps) {
    return new PileupLayoutSession(args)
  }
}

export type {
  RenderArgs,
  RenderArgsSerialized,
  RenderResults,
  ResultsSerialized,
  ResultsDeserialized,
}
