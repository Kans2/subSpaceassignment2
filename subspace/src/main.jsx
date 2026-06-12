import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NhostProvider } from '@nhost/react'
import { nhost } from './lib/nhost'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NhostProvider nhost={nhost}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </NhostProvider>
  </StrictMode>,
)
