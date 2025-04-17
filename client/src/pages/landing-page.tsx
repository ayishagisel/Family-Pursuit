import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import landingImage from '../assets/landing-page.png';
import { useAuthContext } from '@/contexts/AuthContext';

const LandingPage = () => {
  const [_, setLocation] = useLocation();
  const [stage, setStage] = useState<'full' | 'text-faded' | 'tree-only' | 'done'>('full');
  
  // Try to get user info, but don't crash if auth context is not available
  let user = null;
  try {
    const authContext = useAuthContext();
    user = authContext.user;
  } catch (error) {
    console.log('Auth context not available, redirecting to login after animation');
  }

  useEffect(() => {
    // Animation sequence timing
    const sequence = [
      { stage: 'text-faded', delay: 1500 },   // Start fading text after 1.5s
      { stage: 'tree-only', delay: 3000 },    // Show only tree after 3s
      { stage: 'done', delay: 4500 }          // Finish animation after 4.5s total
    ];

    // Set up animation sequence
    let timer: NodeJS.Timeout;
    let timers: NodeJS.Timeout[] = [];
    
    sequence.forEach(step => {
      const t = setTimeout(() => {
        setStage(step.stage as any);
        
        // When animation is done, navigate to the appropriate page
        if (step.stage === 'done') {
          if (user) {
            // Navigate to family tree if authenticated
            setLocation("/");
          } else {
            // Navigate to login if not authenticated
            setLocation("/login");
          }
        }
      }, step.delay);
      
      timers.push(t);
    });

    // Clean up timers on unmount
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [setLocation, user]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black transition-opacity duration-1000 z-50">
      <div className={`relative transition-all duration-1000 ease-in-out transform ${stage === 'tree-only' ? 'scale-110' : 'scale-100'}`}>
        <img 
          src={landingImage} 
          alt="Family Pursuit" 
          className="max-w-full max-h-screen object-contain"
        />
        
        {/* Overlay for text fading effect */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none ${
            stage === 'full' ? 'opacity-0' : stage === 'text-faded' ? 'opacity-25' : 'opacity-0'
          }`}
        />
        
        {/* White overlay to show only the tree */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black via-black to-black transition-opacity duration-1500 pointer-events-none ${
            stage === 'tree-only' ? 'opacity-80' : 'opacity-0'
          }`}
        />
        
        {/* Fade out the entire image */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none ${
            stage === 'done' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </div>
  );
};

export default LandingPage;