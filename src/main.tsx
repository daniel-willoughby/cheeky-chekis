import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { seedIfEmpty } from './data/seed'
import { claimDailyBonus } from './data/hooks'

seedIfEmpty().then(() => claimDailyBonus())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
