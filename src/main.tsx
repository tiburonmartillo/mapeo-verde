
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
      // Clean the redirect parameter from URL
      const cleanPath = redirectPath.split('?')[0]; // Remove query params if any
      const cleanURL = cleanPath.split('#')[0]; // Remove hash if any
      
      // Preserve query params and hash from redirectPath if they exist
      const urlParts = redirectPath.split('?');
      const queryPart = urlParts[1]?.split('#')[0] || '';
      const hashPart = redirectPath.includes('#') ? redirectPath.split('#')[1] : '';
      
      // Build the final URL
      let finalPath = cleanURL;
      if (queryPart) {
        finalPath += '?' + queryPart;
      }
      if (hashPart) {
        finalPath += '#' + hashPart;
      }
      
      // Remove the redirect parameter from current URL and navigate
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search.replace(/[?&]redirect=[^&]*/, '').replace(/^&/, '?');
      const currentHash = window.location.hash;
      const cleanCurrentURL = currentPath + (currentSearch || '') + currentHash;
      
      // Update URL without redirect parameter
      window.history.replaceState({}, '', cleanCurrentURL);
      
      // Navigate to the intended path
      navigate(finalPath, { replace: true });
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
  