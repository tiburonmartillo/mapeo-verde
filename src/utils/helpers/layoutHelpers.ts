/**
 * Get the height of the navbar element
 * Looks for navbar elements and returns their combined height
 */
export const getNavbarHeight = (): number => {
  const navbarMobile = document.querySelector('[data-navbar-mobile]') as HTMLElement;
  const navbarDesktop = document.querySelector('[data-navbar-desktop]') as HTMLElement;
  
  const mobileHeight = navbarMobile?.offsetHeight ?? 0;
  const desktopHeight = navbarDesktop?.offsetHeight ?? 0;
  
  return Math.max(mobileHeight, desktopHeight, 64); // Default 64px if not found
};
