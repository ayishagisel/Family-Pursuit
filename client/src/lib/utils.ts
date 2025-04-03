import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createThemeRoot() {
  // Import theme.json and set CSS variables for theming
  try {
    const theme = (window as any).theme || {};
    const root = document.documentElement;
    const isDark = theme.appearance === 'dark' || 
                  (theme.appearance === 'system' && 
                   window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Set border radius if specified
    if (theme.radius) {
      root.style.setProperty('--radius', `${theme.radius}px`);
    }
    
    // Set primary color if specified
    if (theme.primary) {
      const color = theme.primary.startsWith('#') ? theme.primary : `#${theme.primary}`;
      root.style.setProperty('--primary', color);
    }
  } catch (error) {
    console.error('Error setting up theme:', error);
  }
}
