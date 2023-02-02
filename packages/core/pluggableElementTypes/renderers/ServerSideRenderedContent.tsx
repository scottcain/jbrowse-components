import React, { useEffect, useRef } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { hydrateRoot } from 'react-dom/client'

// locals
import { createJBrowseTheme } from '../../ui'
import { rIC } from '../../util'
import { ResultsSerialized, RenderArgs } from './ServerSideRendererType'

interface Props extends ResultsSerialized, RenderArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RenderingComponent: React.ComponentType<any>
}

export default function ({ theme, html, RenderingComponent, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const jbrowseTheme = createJBrowseTheme(theme)

  useEffect(() => {
    const domNode = ref.current
    if (domNode) {
      domNode.innerHTML = html

      // defer main-thread rendering and hydration for when
      // we have some free time. helps keep the framerate up.
      //
      // note: the timeout param to rIC below helps when you are doing
      // a long continuous scroll, it forces it to evaluate because
      // otherwise the continuous scroll would never give it time to do
      // so
      rIC(
        () => {
          hydrateRoot(
            domNode,
            <ThemeProvider theme={jbrowseTheme}>
              <RenderingComponent {...rest} />
            </ThemeProvider>,
          )
        },
        { timeout: 300 },
      )
    }
  }, [html, jbrowseTheme, rest, RenderingComponent])

  return <div ref={ref} />
}
