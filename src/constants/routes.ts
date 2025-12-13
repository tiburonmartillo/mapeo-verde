export const TAB_ROUTES = {
  HOME: '/',
  AGENDA: '/agenda',
  GREEN_AREAS: '/areas-verdes',
  NEWSLETTERS: '/boletines',
  GAZETTES: '/gacetas',
  PARTICIPATION: '/participacion'
} as const;

export type TabId = keyof typeof TAB_ROUTES;

export const pathToTab = (pathname: string): TabId => {
  // Remove ID parameter for tab detection
  const pathWithoutId = pathname.split('/').slice(0, 2).join('/');
  if (pathWithoutId === '/agenda' || pathname.startsWith('/agenda/')) return 'AGENDA';
  if (pathWithoutId === '/areas-verdes' || pathname.startsWith('/areas-verdes/')) return 'GREEN_AREAS';
  if (pathname.startsWith('/boletines')) return 'NEWSLETTERS';
  if (pathname.startsWith('/gacetas')) return 'GAZETTES';
  if (pathname.startsWith('/participacion')) return 'PARTICIPATION';
  return 'HOME';
};

