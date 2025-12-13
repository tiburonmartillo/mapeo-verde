
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import App from "./App.tsx";
import "./index.css";

// Detect base path for GitHub Pages
// If the pathname includes /mapeo-verde, use that as base, otherwise use /
const getBasename = () => {
  const pathname = window.location.pathname;
  // Check if we're in a GitHub Pages subdirectory
  if (pathname.includes('/mapeo-verde')) {
    return '/mapeo-verde';
  }
  // For local development, use root
  return '/';
};

// Component to handle redirect from 404.html
const RedirectHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (redirectPath) {
      // Remove the redirect parameter from URL
      const newURL = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newURL);
      // Navigate to the intended path
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);
  
  return null;
};

const basename = getBasename();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename}>
    <RedirectHandler />
    <App />
  </BrowserRouter>
);
  