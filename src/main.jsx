import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, useTheme } from './components/theme-provider.jsx'
import { ClarityIcons, userIcon, homeIcon, heartIcon, cogIcon, plusIcon, timesIcon } from '@cds/core/icon';

ClarityIcons.addIcons(userIcon, homeIcon, heartIcon, cogIcon, plusIcon, timesIcon);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <App />
    </ThemeProvider>
    
  </StrictMode>,
)
