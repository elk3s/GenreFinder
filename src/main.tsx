import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and swallow the Firebase Auth internal assertion bug that occurs in nested iframes
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reasonMsg = event.reason?.message || "";
    const reasonStr = event.reason?.toString?.() || "";
    if (
      reasonMsg.includes("INTERNAL ASSERTION FAILED") ||
      reasonMsg.includes("Pending promise was never set") ||
      reasonStr.includes("INTERNAL ASSERTION FAILED") ||
      reasonStr.includes("Pending promise was never set")
    ) {
      console.warn("[Firebase Patch] Safely intercepted and suppressed iframe auth assertion warning:", event.reason);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const errorMsg = event.message || "";
    const errorReasonMsg = event.error?.message || "";
    if (
      errorMsg.includes("INTERNAL ASSERTION FAILED") ||
      errorMsg.includes("Pending promise was never set") ||
      errorReasonMsg.includes("INTERNAL ASSERTION FAILED") ||
      errorReasonMsg.includes("Pending promise was never set")
    ) {
      console.warn("[Firebase Patch] Safely intercepted and suppressed iframe auth error:", event.message);
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
