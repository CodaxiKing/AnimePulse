import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Tratamento global para promessas rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  console.warn('🔧 Unhandled promise rejection caught:', event.reason);
  // Prevenir que o erro apareça no console como não tratado
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
