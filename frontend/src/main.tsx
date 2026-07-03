import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import axios from 'axios'

// Localhost so'rovlarini avtomatik ravishda Railway backendiga yo'naltiramiz
axios.interceptors.request.use((config) => {
  const apiBase = import.meta.env.VITE_API_URL || 'https://shifoxona-production.up.railway.app/api';
  if (config.url && config.url.startsWith('http://localhost:5000/api')) {
    config.url = config.url.replace('http://localhost:5000/api', apiBase);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
