import React from 'react'
import { observer } from 'mobx-react'
import { ThemeProvider, ScopedCssBaseline } from '@mui/material'
import { makeStyles } from 'tss-react/mui'

// locals
import App from '@jbrowse/core/ui/App'
import { createJBrowseTheme } from '@jbrowse/core/ui'
import { getConf } from '@jbrowse/core/configuration'

const useStyles = makeStyles()({
  // avoid parent styles getting into this div
  // https://css-tricks.com/almanac/properties/a/all/
  avoidParentStyle: {
    all: 'initial',
  },
})

const JBrowseWebApp = observer(function ({ viewState }: { viewState: any }) {
  const { classes } = useStyles()

  const session = viewState?.session as any
  const theme = createJBrowseTheme(getConf(viewState.jbrowse, 'theme'))

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.avoidParentStyle}>
        <ScopedCssBaseline>
          <App session={session} />
        </ScopedCssBaseline>
      </div>
    </ThemeProvider>
  )
})

export default JBrowseWebApp
