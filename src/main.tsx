import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; text-align: center; margin-top: 50px;">Error: No se encontró el elemento root</div>';
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `<div style="color: red; text-align: center; margin-top: 50px;">
      <h2>Error al cargar la aplicación</h2>
      <p>${error instanceof Error ? error.message : 'Error desconocido'}</p>
    </div>`;
  }
}