import { useLocation } from 'react-router-dom';

export const pathToTab = (pathname: string) => {
  // Remove ID parameter for tab detection
  const pathWithoutId = pathname.split('/').slice(0, 2).join('/');
  if (pathWithoutId === '/agenda' || pathname.startsWith('/agenda/')) return 'AGENDA';
  if (pathWithoutId === '/areas-verdes' || pathname.startsWith('/areas-verdes/')) return 'GREEN_AREAS';
  if (pathname.startsWith('/participacion')) return 'PARTICIPATION';
  return 'HOME';
};

// Helper function to get accent color based on page
export const getAccentColor = (tab: string): string => {
  const accentColors: { [key: string]: string } = {
    'HOME': '#b4ff6f',
    'AGENDA': '#ff7e67',
    'GREEN_AREAS': '#fccb4e',
    'NEWSLETTERS': '#ff9d9d',
    'GAZETTES': '#9dcdff',
    'PARTICIPATION': '#d89dff',
  };
  return accentColors[tab] || '#ff7e67'; // Default to AGENDA color
};

// Helper hook to get current accent color
export const useAccentColor = (): string => {
  const location = useLocation();
  const tab = pathToTab(location.pathname);
  return getAccentColor(tab);
};

