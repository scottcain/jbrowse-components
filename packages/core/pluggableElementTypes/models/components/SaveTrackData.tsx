import React, { useEffect, useState } from 'react'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import { Dialog, ErrorMessage } from '@jbrowse/core/ui'
import {
  getSession,
  getContainingView,
  Feature,
  Region,
} from '@jbrowse/core/util'
import { getConf } from '@jbrowse/core/configuration'
import { makeStyles } from 'tss-react/mui'
import { BaseTrackModel } from '@jbrowse/core/pluggableElementTypes'
import { observer } from 'mobx-react'

// locals
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

async function fetchFeatures(
  track: BaseTrackModel,
  regions: Region[],
  signal?: AbortSignal,
) {
  const { rpcManager } = getSession(track)
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
  model: BaseTrackModel
  handleClose: () => void
}) {
  const { classes } = useStyles()
  const [error, setError] = useState<unknown>()
  const [features, setFeatures] = useState<string>()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      try {
        const view = getContainingView(model)
        const track = model
        const regions = view.dynamicBlocks.contentBlocks
        setError(undefined)
        const feats = await fetchFeatures(track, regions)
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
