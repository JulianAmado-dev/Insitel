import { createRoot } from 'react-dom/client'
import React from 'react'
import '@styles/global.css'
import './common/styles/brand-insitel.css' // INSITEL BRAND STYLING
import {App} from './App.jsx'
import { ThemeProvider } from './common/contexts/ThemeProvider/ThemeProvider.jsx'

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider>
        <App/>
      </ThemeProvider>
    </React.StrictMode>,
  )
