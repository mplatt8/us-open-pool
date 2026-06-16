import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import { App } from './App'

const theme = createTheme({
  primaryColor: 'usga',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  colors: {
    // USGA / U.S. Open navy + a fairway green accent
    usga: [
      '#e7eef7', '#c5d4e8', '#9fb6d6', '#7898c4', '#587fb6',
      '#3f6aac', '#2f5ea6', '#1f4e96', '#0a3161', '#062247',
    ],
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <App />
    </MantineProvider>
  </React.StrictMode>,
)
