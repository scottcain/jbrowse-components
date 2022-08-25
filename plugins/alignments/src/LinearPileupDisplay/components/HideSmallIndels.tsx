import React, { useState } from 'react'
import { observer } from 'mobx-react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import CloseIcon from '@mui/icons-material/Close'

const useStyles = makeStyles()(theme => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  table: {
    border: '1px solid #888',
    margin: theme.spacing(4),
    '& td': {
      padding: theme.spacing(1),
    },
  },
}))

function HideSmallIndelsDlg(props: {
  model: {
    hideSmallIndels?: { del: number; ins: number }
    setHideSmallIndels: (arg?: { del: number; ins: number }) => void
  }
  handleClose: () => void
}) {
  const { classes } = useStyles()
  const { model, handleClose } = props
  const { hideSmallIndels } = model
  const [del, setDel] = useState(hideSmallIndels?.del || 0)
  const [ins, setIns] = useState(hideSmallIndels?.ins || 0)

  return (
    <Dialog open onClose={handleClose}>
      <DialogTitle>
        Hide small indels
        <IconButton className={classes.closeButton} onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          type="numeric"
          value={ins}
          helperText="Hide deletions smaller than bp"
          onChange={event => setIns(+event.target.value)}
        />
        <TextField
          type="numeric"
          value={del}
          helperText="Hide insertions smaller than bp"
          onChange={event => setDel(+event.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            model.setHideSmallIndels({ del, ins })
            handleClose()
          }}
        >
          Submit
        </Button>
        <Button variant="contained" onClick={() => model.setHideSmallIndels()}>
          Clear
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

export default observer(HideSmallIndelsDlg)
