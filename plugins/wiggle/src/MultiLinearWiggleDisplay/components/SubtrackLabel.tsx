import React, { useState } from 'react'
import { Tooltip, Typography, alpha } from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { observer } from 'mobx-react'
import Menu from '@jbrowse/core/ui/Menu'
import { WiggleDisplayModel } from '../models/model'
import { moveUp, moveDown } from './util'

const useStyles = makeStyles()(theme => ({
  root: {
    background: alpha(theme.palette.background.paper, 0.8),
    '&:hover': {
      background: theme.palette.background.paper,
    },
    transition: theme.transitions.create(['background'], {
      duration: theme.transitions.duration.shortest,
    }),
  },
}))

function SubtrackLabel({
  model,
  source,
  style,
}: {
  model: WiggleDisplayModel
  source: any
  style: any
}) {
  const [mouseOver, setMouseOver] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
  const items = [
    {
      label: 'Move up',
      onClick: () => {
        if (model.sources) {
          model.setLayout(moveUp([...model.sources], [source.name]))
        }
      },
    },
    {
      label: 'Move down',
      onClick: () => {
        if (model.sources) {
          model.setLayout(moveDown([...model.sources], [source.name]))
        }
      },
    },
  ]
  const { classes } = useStyles()

  return (
    <Tooltip
      title={source.description || 'No description'}
      enterDelay={0}
      leaveDelay={0}
      placement="right"
    >
      <div
        style={{ ...style, background: mouseOver ? '#ccc' : 'white' }}
        onClick={event => {
          // this check for !anchorEl is needed or else the menu cannot be
          // closed. it is a weird behavior that might be related to
          // position:absolute in the div
          if (!anchorEl) {
            setAnchorEl(event.currentTarget)
          }
        }}
        onMouseOver={() => setMouseOver(true)}
        onMouseOut={() => setMouseOver(false)}
        className={classes.root}
      >
        <div
          style={{
            width: 10,
            height: style.height,
            background: source.color,
            marginRight: 5,
            display: 'inline-block',
          }}
        />
        {source.name}

        <Menu
          open={Boolean(anchorEl)}
          onMenuItemClick={(_: unknown, callback: Function) => {
            callback()
            setAnchorEl(null)
            setMouseOver(false)
          }}
          menuItems={items}
          anchorEl={anchorEl}
          onClose={() => {
            setAnchorEl(null)
            setMouseOver(false)
          }}
        />
      </div>
    </Tooltip>
  )
}

export default observer(SubtrackLabel)
