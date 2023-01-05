import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Dialog, ErrorMessage } from '@jbrowse/core/ui'
import {
  getSession,
  Feature,
  Region,
  getContainingView,
} from '@jbrowse/core/util'
import { getConf } from '@jbrowse/core/configuration'
import { Button, DialogActions, DialogContent } from '@mui/material'
import { makeStyles } from 'tss-react/mui'

// locals
import { LinearGenomeViewModel } from '../../LinearGenomeView'
import { BaseTrackModel } from '@jbrowse/core/pluggableElementTypes'

const useStyles = makeStyles()(theme => ({
  root: {
    width: 500,
  },

  field: {
    margin: theme.spacing(2),
  },
}))

type LGV = LinearGenomeViewModel

/**
 * Fetches and returns a list features for a given list of regions
 */
async function fetchFeatures(
  track: BaseTrackModel,
  view: LGV,
  regions: Region[],
  signal?: AbortSignal,
) {
  const session = getSession(view)
  const { rpcManager } = session
  const adapterConfig = getConf(track, ['adapter'])

  const sessionId = 'getSequence'
  return rpcManager.call(sessionId, 'CoreGetFeatures', {
    adapterConfig,
    regions,
    sessionId,
    signal,
  }) as Promise<Feature[]>
}

function SetMaxHeightDlg({
  model,
  handleClose,
}: {
  model: {
    maxHeight?: number
    setMaxHeight: Function
  }
  handleClose: () => void
}) {
  const { classes } = useStyles()
  const [error, setError] = useState<unknown>()
  const [features, setFeatures] = useState<any>()
  useEffect(() => {
    ;async () => {
      try {
        setError(undefined)
        const view = getContainingView(model) as LGV
        const feats = await fetchFeatures(
          view,
          view.dynamicBlocks.contentBlocks,
        )
        setFeatures(feats)
      } catch (e) {
        console.error(e)
        setError(e)
      }
    }
  })

  return (
    <Dialog open onClose={handleClose} title="Save track data">
      <DialogContent className={classes.root}>
        {error ? <ErrorMessage error={error} /> : null}
        {JSON.stringify(features)}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          onClick={() => handleClose()}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default observer(SetMaxHeightDlg)
