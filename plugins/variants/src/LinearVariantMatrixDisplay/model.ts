import { ConfigurationReference } from '@jbrowse/core/configuration'

import { linearBasicDisplayModelFactory } from '@jbrowse/plugin-linear-genome-view'
import { types } from 'mobx-state-tree'

// locals
import { AnyConfigurationSchemaType } from '@jbrowse/core/configuration'

/**
 * #stateModel LinearVariantMatrixDisplay
 * extends `LinearBasicDisplay`
 * very similar to basic display, but provides custom widget on feature click
 */
export default function stateModelFactory(
  configSchema: AnyConfigurationSchemaType,
) {
  return types
    .compose(
      'LinearVariantMatrixDisplay',
      linearBasicDisplayModelFactory(configSchema),
      types.model({
        /**
         * #property
         */
        type: types.literal('LinearVariantMatrixDisplay'),
        /**
         * #property
         */
        configuration: ConfigurationReference(configSchema),
      }),
    )
    .volatile(() => ({
      samples: undefined as string[] | undefined,
    }))
    .views(() => ({
      get blockType() {
        return 'dynamicBlocks'
      },
      get renderDelay() {
        return 1000
      },
    }))
    .actions(self => ({
      /**
       * #action
       */
      setSamples(arg: string[]) {
        self.samples = arg
      },
    }))
    .views(self => {
      const { renderProps: superRenderProps } = self
      return {
        renderProps() {
          const superProps = superRenderProps()
          return {
            ...superProps,
            height: self.height,
          }
        },
      }
    })
}
