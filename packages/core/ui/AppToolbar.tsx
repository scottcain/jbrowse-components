import React from 'react'
import { Toolbar, Tooltip } from '@mui/material'
import { makeStyles } from 'tss-react/mui'
import { observer } from 'mobx-react'

// locals
import {
  NotificationLevel,
  SessionWithDrawerWidgets,
  SnackAction,
} from '../util'

// ui elements
import DropDownMenu from './DropDownMenu'
import EditableTypography from './EditableTypography'
import AppLogo from './AppLogo'
import { MenuItem as JBMenuItem } from './Menu'

const useStyles = makeStyles()(theme => ({
  grow: {
    flexGrow: 1,
  },
  inputBase: {
    color: theme.palette.primary.contrastText,
  },
  inputRoot: {
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    },
  },
  inputFocused: {
    borderColor: theme.palette.secondary.main,
    backgroundColor: theme.palette.primary.light,
  },
}))

type SnackbarMessage = [string, NotificationLevel, SnackAction]

type AppSession = SessionWithDrawerWidgets & {
  savedSessionNames: string[]
  menus: { label: string; menuItems: JBMenuItem[] }[]
  renameCurrentSession: (arg: string) => void
  snackbarMessages: SnackbarMessage[]
  popSnackbarMessage: () => unknown
}

const AppToolbar = observer(function ({
  session,
  HeaderButtons = <div />,
}: {
  HeaderButtons?: React.ReactElement
  session: AppSession
}) {
  const { classes } = useStyles()
  const { savedSessionNames, name, menus } = session

  function handleNameChange(newName: string) {
    if (savedSessionNames?.includes(newName)) {
      session.notify(
        `Cannot rename session to "${newName}", a saved session with that name already exists`,
        'warning',
      )
    } else {
      session.renameCurrentSession(newName)
    }
  }
  return (
    <Toolbar>
      {menus.map(menu => (
        <DropDownMenu
          key={menu.label}
          menuTitle={menu.label}
          menuItems={menu.menuItems}
          session={session}
        />
      ))}
      <div className={classes.grow} />
      <Tooltip title="Rename Session" arrow>
        <EditableTypography
          value={name}
          setValue={handleNameChange}
          variant="body1"
          classes={{
            inputBase: classes.inputBase,
            inputRoot: classes.inputRoot,
            inputFocused: classes.inputFocused,
          }}
        />
      </Tooltip>
      {HeaderButtons}
      <div className={classes.grow} />
      <div style={{ width: 150, maxHeight: 48 }}>
        <AppLogo session={session} />
      </div>
    </Toolbar>
  )
})

export default AppToolbar
