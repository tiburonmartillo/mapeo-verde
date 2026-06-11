import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { LogoMap } from '../common/LogoMap';

interface NavBarProps {
  activeTab: string;
  onNavigate: (tabId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  color: string;
  hoverColor: string;
}

const Logo = () => (
  <LogoMap className="w-20 h-auto md:w-24" />
);

const NavBar = ({ activeTab, onNavigate }: NavBarProps) => {
  const tabs: Tab[] = [
    { id: 'HOME', label: 'INICIO', color: 'bg-[#b4ff6f]', hoverColor: 'hover:bg-[#b4ff6f]' },
    { id: 'AGENDA', label: 'AGENDA', color: 'bg-[#ff7e67]', hoverColor: 'hover:bg-[#ff7e67]' },
    { id: 'GREEN_AREAS', label: 'ÁREAS VERDES', color: 'bg-[#fccb4e]', hoverColor: 'hover:bg-[#fccb4e]' },
    { id: 'PARTICIPATION', label: 'PARTICIPACIÓN', color: 'bg-[#d89dff]', hoverColor: 'hover:bg-[#d89dff]' },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show navbar on scroll (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      // Early return for desktop - navbar is always visible via sticky
      if (window.innerWidth >= 768) {
        return;
      }

      // Mobile only: hide/show navbar
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleTabClick = (tabId: string) => {
    onNavigate(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Navbar - Fixed (only visible on mobile) */}
      <nav
        data-navbar-mobile
        aria-label="Navegación móvil"
        className={`
          md:hidden
          fixed top-0 left-0 right-0
          z-50 bg-white border-b border-black
          transition-transform duration-300 ease-in-out
          ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4">
          <button
            className="flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
            onClick={() => handleTabClick('HOME')}
            aria-label="Ir al inicio"
          >
            <Logo />
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-2 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} className="text-black" /> : <Menu size={24} className="text-black" />}
          </button>
        </div>
      </nav>

      {/* Desktop Navbar - Sticky (only visible on desktop) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden md:block sticky top-0 z-50"
        data-navbar-desktop
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 50
        }}
      >
        <nav
          aria-label="Navegación principal"
          className="w-full border-b border-black bg-white text-xs md:text-sm font-mono tracking-wider uppercase overflow-x-auto scrollbar-hide flex"
          style={{ backgroundColor: 'white' }}
        >
          <button
            className="flex-shrink-0 w-32 h-16 border-r border-black flex items-center justify-center bg-white cursor-pointer focus:outline-none focus:bg-gray-100"
            onClick={() => onNavigate('HOME')}
            aria-label="Ir al inicio"
          >
            <Logo />
          </button>
          {tabs.map((tab, idx) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + idx * 0.05, duration: 0.2 }}
              onClick={() => onNavigate(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`
                flex-1 min-w-[100px] px-4 py-3 border-r border-black text-left transition-colors duration-200 outline-none focus:ring-inset focus:ring-2 focus:ring-black
                ${activeTab === tab.id ? tab.color : `bg-white ${tab.hoverColor}`}
              `}
            >
              {tab.label}
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 right-0 bg-white border-b border-black w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-black bg-white">
                <button
                  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
                  onClick={() => handleTabClick('HOME')}
                  aria-label="Ir al inicio"
                >
                  <Logo />
                </button>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex flex-col bg-white">
                {tabs.map((tab, index) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      w-full px-6 py-5 text-left border-b border-black
                      font-mono text-sm uppercase tracking-wider
                      transition-all duration-200 flex items-center justify-between
                      ${activeTab === tab.id
                        ? `${tab.color} text-black font-black`
                        : 'bg-white text-black hover:bg-black hover:text-white'
                      }
                    `}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id && <motion.div layoutId="activeTabIcon" className="w-2 h-2 bg-black rounded-full" />}
                  </motion.button>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavBar;
