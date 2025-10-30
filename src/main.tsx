import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './components/App'
import { useSystemStore } from './store/system-store'

// Expose store to window for console testing
declare global {
  interface Window {
    __KHORA_STORE__: typeof useSystemStore;
  }
}

window.__KHORA_STORE__ = useSystemStore;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
