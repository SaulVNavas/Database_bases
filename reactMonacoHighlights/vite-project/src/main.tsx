import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Appy from './Appy.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Appy />
  </StrictMode>,
)
