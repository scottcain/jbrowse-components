import React from 'react'
import { isAlive } from 'mobx-state-tree'
import { observer } from 'mobx-react'
import { getContainingView } from '@jbrowse/core/util'
import { LoadingEllipses } from '@jbrowse/core/ui'
import {
  BlockMsg,
  LinearGenomeViewModel,
} from '@jbrowse/plugin-linear-genome-view'
import useStyles from '../../shared/loadingStyles'

// local
import { LinearReadCloudDisplayModel } from '../model'

type LGV = LinearGenomeViewModel

const Cloud = observer(function ({
  model,
}: {
  model: LinearReadCloudDisplayModel
}) {
  const view = getContainingView(model) as LGV
  return (
    <canvas
      data-testid="ReadCloud-display"
      ref={ref => {
        if (isAlive(model)) {
          model.setRef(ref)
        }
      }}
      style={{
        position: 'absolute',
        left: -view.offsetPx,
        width: view.dynamicBlocks.totalWidthPx + model.lastDrawnOffsetPx,
        height: model.height,
      }}
      width={view.dynamicBlocks.totalWidthPx * 2}
      height={model.height * 2}
    />
  )
})

export default observer(function ({
  model,
}: {
  model: LinearReadCloudDisplayModel
}) {
  const view = getContainingView(model)
  const { classes } = useStyles()
  const err = model.error
  return err ? (
    <BlockMsg
      message={`${err}`}
      severity="error"
      buttonText="Reload"
      action={model.reload}
    />
  ) : model.loading ? (
    <div
      className={classes.loading}
      style={{
        width: view.dynamicBlocks.totalWidthPx,
        left: Math.max(0, -view.offsetPx),
      }}
    >
      <LoadingEllipses message={model.message} />
    </div>
  ) : (
    <Cloud model={model} />
  )
})
