import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useDarkMode } from "@/hooks/useDarkMode";

const Sidebar = () => {
  const [location] = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="md:w-64 bg-primary dark:bg-neutral-800 text-white p-4 flex flex-col">
      <div className="flex items-center space-x-2 mb-8">
        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
          <i className="fas fa-users text-primary"></i>
        </div>
        <h1 className="font-montserrat font-bold text-xl">Pursuit Family</h1>
      </div>
      
      <div className="flex md:hidden justify-end mb-4">
        <button onClick={toggleMobileMenu} className="text-white">
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
      
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="space-y-4">
          <div className="font-medium text-sm uppercase text-accent/80 mb-2">MAIN</div>
          
          <Link href="/" className={`flex items-center p-2 rounded-lg ${isActive('/') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
            <i className="fas fa-sitemap w-6"></i>
            <span>Family Tree</span>
          </Link>
          
          <Link href="/events" className={`flex items-center p-2 rounded-lg ${isActive('/events') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
            <i className="fas fa-calendar-alt w-6"></i>
            <span>Events</span>
          </Link>
          
          <Link href="/documents" className={`flex items-center p-2 rounded-lg ${isActive('/documents') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
            <i className="fas fa-file-alt w-6"></i>
            <span>Documents</span>
          </Link>
          
          <Link href="/help-needed" className={`flex items-center p-2 rounded-lg ${isActive('/help-needed') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
            <i className="fas fa-hands-helping w-6"></i>
            <span>Help Needed</span>
          </Link>
          
          <Link href="/housing-issues" className={`flex items-center p-2 rounded-lg ${isActive('/housing-issues') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
            <i className="fas fa-home w-6"></i>
            <span>Housing Issues</span>
          </Link>
          
          <Link href="/messages" className={`flex items-center p-2 rounded-lg ${isActive('/messages') ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
            <i className="fas fa-comments w-6"></i>
            <span>Messages</span>
          </Link>
        </div>
        
        <div className="mt-8">
          <div className="font-medium text-sm uppercase text-accent/80 mb-2">SETTINGS</div>
          
          <a href="#" className="flex items-center p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <i className="fas fa-cog w-6"></i>
            <span>Preferences</span>
          </a>
          
          <a href="#" className="flex items-center p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <i className="fas fa-shield-alt w-6"></i>
            <span>Privacy</span>
          </a>
          
          <div 
            className="flex items-center p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
            onClick={toggleDarkMode}
          >
            <i className="fas fa-moon w-6"></i>
            <span>Dark Mode</span>
            <div className="ml-auto">
              <div className="w-10 h-5 bg-white/30 rounded-full flex items-center p-0.5">
                <div 
                  className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center p-2">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
          <div className="ml-2">
            <div className="text-sm font-medium">Sarah Johnson</div>
            <div className="text-xs text-white/70">Family Admin</div>
          </div>
          <div className="ml-auto">
            <i className="fas fa-chevron-down text-xs text-white/60"></i>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
