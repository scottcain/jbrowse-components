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
    .views(self => ({
      get blockType() {
        return 'dynamicBlocks'
      },
      get renderDelay() {
        return 2000
      },
    }))
}
