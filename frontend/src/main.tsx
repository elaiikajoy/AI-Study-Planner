import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: 'var(--success-400)', secondary: 'var(--bg-elevated)' } },
          error:   { iconTheme: { primary: 'var(--danger-400)',  secondary: 'var(--bg-elevated)' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
