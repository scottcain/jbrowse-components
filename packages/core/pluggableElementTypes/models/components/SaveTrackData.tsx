import React, { useEffect, useState } from 'react'
import {
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { observer } from 'mobx-react'
import { Dialog, ErrorMessage, LoadingEllipses } from '@jbrowse/core/ui'
import {
  getSession,
  getContainingView,
  Feature,
  Region,
} from '@jbrowse/core/util'
import { getConf } from '@jbrowse/core/configuration'
import { BaseTrackModel } from '@jbrowse/core/pluggableElementTypes'

// locals
import { stringifyGenbank, stringifyGFF3 } from './util'

const useStyles = makeStyles()({
  root: {
    width: '80em',
  },
  textAreaFont: {
    fontFamily: 'Courier New',
  },
})

async function fetchFeatures(
  track: BaseTrackModel,
  regions: Region[],
  signal?: AbortSignal,
) {
  const { rpcManager } = getSession(track)
  const adapterConfig = getConf(track, ['adapter'])
  const sessionId = 'getFeatures'
  return rpcManager.call(sessionId, 'CoreGetFeatures', {
    adapterConfig,
    regions,
    sessionId,
    signal,
  }) as Promise<Feature[]>
}

export default observer(function SaveTrackDataDlg({
  model,
  handleClose,
}: {
  model: BaseTrackModel
  handleClose: () => void
}) {
  const { classes } = useStyles()
  const [error, setError] = useState<unknown>()
  const [features, setFeatures] = useState<Feature[]>()
  const [type, setType] = useState('gff3')
  const options = { gff3: 'GFF3', genbank: 'GenBank' }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      try {
        const view = getContainingView(model)
        setError(undefined)
        setFeatures(
          await fetchFeatures(model, view.dynamicBlocks.contentBlocks),
        )
      } catch (e) {
        console.error(e)
        setError(e)
      }
    })()
  }, [model])

  const str = features
    ? type === 'gff3'
      ? stringifyGFF3(features)
      : stringifyGenbank(features, {})
    : ''

  return (
    <Dialog maxWidth="xl" open onClose={handleClose} title="Save track data">
      <DialogContent className={classes.root}>
        {error ? <ErrorMessage error={error} /> : null}
        {!features ? (
          <LoadingEllipses />
        ) : !features.length ? (
          <Typography>No features found</Typography>
        ) : null}

        <FormControl>
          <FormLabel>File type</FormLabel>
          <RadioGroup
            value={type}
            onChange={event => setType(event.target.value)}
          >
            {Object.entries(options).map(([key, val]) => (
              <FormControlLabel value={key} control={<Radio />} label={val} />
            ))}
          </RadioGroup>
        </FormControl>
        <TextField
          variant="outlined"
          multiline
          minRows={5}
          maxRows={15}
          fullWidth
          value={str}
          InputProps={{
            readOnly: true,
            classes: {
              input: classes.textAreaFont,
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" type="submit" onClick={() => handleClose()}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})
