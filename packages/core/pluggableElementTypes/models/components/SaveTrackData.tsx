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
import { saveAs } from 'file-saver'
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

// icons
import GetAppIcon from '@mui/icons-material/GetApp'

// locals
import { stringifyGFF3 } from './gff3'
import { stringifyGenbank } from './genbank'

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
  const [str, setStr] = useState('')
  const options = {
    gff3: { name: 'GFF3', extension: 'gff3' },
    genbank: { name: 'GenBank', extension: 'genbank' },
  }

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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      const view = getContainingView(model)
      const session = getSession(model)
      if (!features) {
        return
      }
      const str = await (type === 'gff3'
        ? stringifyGFF3(features)
        : stringifyGenbank({
            features,
            session,
            assemblyName: view.dynamicBlocks.contentBlocks[0].assemblyName,
          }))

      setStr(str)
    })()
  }, [type, features, model])

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
              <FormControlLabel
                key={key}
                value={key}
                control={<Radio />}
                label={val.name}
              />
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
        <Button
          onClick={() => {
            saveAs(
              new Blob([str || ''], {
                type: 'text/plain;charset=utf-8',
              }),
              `jbrowse_track_data.${
                options[type as keyof typeof options].extension
              }`,
            )
          }}
          disabled={!str || !!error}
          startIcon={<GetAppIcon />}
        >
          Download
        </Button>

        <Button variant="contained" type="submit" onClick={() => handleClose()}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})
