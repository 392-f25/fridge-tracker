import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AddItemForm } from './components/AddItemForm';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Render AddItemForm at the top for quick access during development */}
    <AddItemForm onAdd={(item) => { console.log('AddItemForm.onAdd', item); }} />
    <App />
  </StrictMode>,
)
