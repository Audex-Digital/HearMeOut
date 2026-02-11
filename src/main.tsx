/**
 * main.tsx
 * 
 * The JavaScript entry point for the React application.
 * Responsibility: Mounts the React component tree into the 'root' DOM element.
 * 
 * Features:
 * - React StrictMode (Developer checks for potential issues)
 * - Global CSS Injection (Tailwind + Custom tokens)
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App.tsx'

// Mount the high-level App component into the #root div defined in index.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
