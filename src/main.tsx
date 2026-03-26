import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FitnessProvider } from './context/FitnessContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FitnessProvider>
      <App />
    </FitnessProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep app usable even if SW registration fails.
    })
  })
}
