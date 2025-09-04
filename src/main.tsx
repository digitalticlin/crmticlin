
import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './index.css'
import './styles/chat-scrollbars.css'

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(<App />);
