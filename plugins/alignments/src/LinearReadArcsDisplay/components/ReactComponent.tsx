import React from 'react'
import { isAlive } from 'mobx-state-tree'
import { observer } from 'mobx-react'
import { getContainingView } from '@jbrowse/core/util'
import { LoadingEllipses } from '@jbrowse/core/ui'
import {
  BlockMsg,
  LinearGenomeViewModel,
} from '@jbrowse/plugin-linear-genome-view'

// local
import { LinearReadArcsDisplayModel } from '../model'
import useStyles from '../../shared/loadingStyles'

type LGV = LinearGenomeViewModel

const Arcs = observer(function ({
  model,
}: {
  model: LinearReadArcsDisplayModel
}) {
  const view = getContainingView(model) as LGV
  return (
    <canvas
      data-testid="Arc-display"
      ref={ref => {
        if (isAlive(model)) {
          model.setRef(ref)
        }
      }}
      style={{
        position: 'absolute',
        left: -view.offsetPx + model.lastDrawnOffsetPx,
        width: view.dynamicBlocks.totalWidthPx,
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
  model: LinearReadArcsDisplayModel
}) {
  const { classes } = useStyles()
  const view = getContainingView(model)
  const err = model.error
  return err ? (
    <BlockMsg
      message={`${err}`}
      severity="error"
      buttonText={'Reload'}
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
    <Arcs model={model} />
  )
})
