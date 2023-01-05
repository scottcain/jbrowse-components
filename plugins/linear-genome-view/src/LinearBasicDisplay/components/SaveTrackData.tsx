import React, { useEffect, useState } from 'react'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import { Dialog, ErrorMessage } from '@jbrowse/core/ui'
import {
  getSession,
  getContainingView,
  getContainingTrack,
  Feature,
  Region,
} from '@jbrowse/core/util'
import { getConf } from '@jbrowse/core/configuration'
import { makeStyles } from 'tss-react/mui'
import {
  BaseDisplayModel,
  BaseTrackModel,
} from '@jbrowse/core/pluggableElementTypes'
import { observer } from 'mobx-react'

// locals
import { LinearGenomeViewModel } from '../../LinearGenomeView'
import { stringifyGFF3 } from './util'

const useStyles = makeStyles()(theme => ({
  root: {
    width: '80em',
  },
  textAreaFont: {
    fontFamily: 'Courier New',
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

function SaveTrackDataDlg({
  model,
  handleClose,
}: {
  model: BaseDisplayModel
  handleClose: () => void
}) {
  const { classes } = useStyles()
  const [error, setError] = useState<unknown>()
  const [features, setFeatures] = useState<string>()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      try {
        const view = getContainingView(model) as LGV
        const track = getContainingTrack(model) as BaseTrackModel
        const regions = view.dynamicBlocks.contentBlocks
        setError(undefined)
        const feats = await fetchFeatures(track, view, regions)
        const ret = stringifyGFF3(feats)
        setFeatures(ret)
      } catch (e) {
        console.error(e)
        setError(e)
      }
    })()
  }, [model])

  return (
    <Dialog maxWidth="xl" open onClose={handleClose} title="Save track data">
      <DialogContent className={classes.root}>
        {error ? <ErrorMessage error={error} /> : null}
        <TextField
          variant="outlined"
          multiline
          minRows={5}
          maxRows={15}
          fullWidth
          value={features}
          InputProps={{
            readOnly: true,
            classes: {
              input: classes.textAreaFont,
            },
          }}
        />
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

export default observer(SaveTrackDataDlg)
