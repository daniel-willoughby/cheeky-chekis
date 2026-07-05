import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './data/auth'
import { SplashScreen } from './components/SplashScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
        <SplashScreen />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
