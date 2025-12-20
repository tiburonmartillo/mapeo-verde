
import { createRoot } from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [hasRedirected, setHasRedirected] = useState(false);
  
  useEffect(() => {
    // Only process redirect once and if we're coming from 404.html
    if (hasRedirected) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (redirectPath) {
      setHasRedirected(true);
      
      // Parse the redirect path properly, preserving query params and hash
      let pathname = redirectPath;
      let search = '';
      let hash = '';
      
      // Extract hash first
      const hashIndex = redirectPath.indexOf('#');
      if (hashIndex !== -1) {
        hash = redirectPath.substring(hashIndex);
        pathname = redirectPath.substring(0, hashIndex);
      }
      
      // Extract query params
      const queryIndex = pathname.indexOf('?');
      if (queryIndex !== -1) {
        search = pathname.substring(queryIndex);
        pathname = pathname.substring(0, queryIndex);
      }
      
      // Build the final path with all parts
      const finalPath = pathname + search + hash;
      
      // Use requestAnimationFrame to ensure React Router is fully initialized
      requestAnimationFrame(() => {
        // Navigate to the intended path with replace to avoid adding to history
        navigate(finalPath, { replace: true });
      });
    }
  }, [navigate, hasRedirected]);
  
  return null;
};

const basename = getBasename();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={basename}>
    <RedirectHandler />
    <App />
  </BrowserRouter>
);
  