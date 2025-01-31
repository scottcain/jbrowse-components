import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Dialog } from '@jbrowse/core/ui'
import {
  Button,
  DialogActions,
  DialogContent,
  Typography,
  TextField,
} from '@mui/material'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(theme => ({
  root: {
    width: 500,
  },

  field: {
    margin: theme.spacing(2),
  },
}))

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
  const { maxHeight = '' } = model
  const [max, setMax] = useState(`${maxHeight}`)

  return (
    <Dialog open onClose={handleClose} title="Set max height">
      <DialogContent className={classes.root}>
        <Typography>
          Set max height for the track. For example, you can increase this if
          the layout says &quot;Max height reached&quot;
        </Typography>
        <TextField
          value={max}
          onChange={event => setMax(event.target.value)}
          placeholder="Enter max score"
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          autoFocus
          onClick={() => {
            model.setMaxHeight(
              max !== '' && !Number.isNaN(+max) ? +max : undefined,
            )
            handleClose()
          }}
        >
          Submit
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleClose()}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default observer(SetMaxHeightDlg)
