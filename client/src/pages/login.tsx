import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import landingImage from '../assets/landing-page.png';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

// Login form validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [_, setLocation] = useLocation();
  const { login } = useAuthContext();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [animationStage, setAnimationStage] = useState<'normal' | 'text-fading' | 'tree-only' | 'transitioning'>('normal');

  // Initialize form
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Animation effect when login is successful
  useEffect(() => {
    if (loginSuccess) {
      // Start animation sequence
      const animationSequence = [
        { stage: 'text-fading', delay: 1000 },
        { stage: 'tree-only', delay: 2500 },
        { stage: 'transitioning', delay: 4000 }
      ];
      
      let timers: NodeJS.Timeout[] = [];
      
      animationSequence.forEach((step) => {
        const timer = setTimeout(() => {
          setAnimationStage(step.stage as any);
          
          // Navigate to family tree at the end of animation
          if (step.stage === 'transitioning') {
            setLocation('/');
          }
        }, step.delay);
        
        timers.push(timer);
      });
      
      return () => {
        timers.forEach(t => clearTimeout(t));
      };
    }
  }, [loginSuccess, setLocation]);

  // Handle form submission
  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(values);
      
      // Instead of immediately redirecting, set successful login state
      // to trigger animation sequence
      setLoginSuccess(true);
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to Family Pursuit!',
      });
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to login. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {/* Animation overlay for the login page */}
      {loginSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className={`relative transition-all duration-1000 ease-in-out transform ${animationStage === 'tree-only' ? 'scale-110' : 'scale-100'}`}>
            <img 
              src={landingImage} 
              alt="Family Pursuit" 
              className="max-w-full max-h-screen object-contain"
            />
            
            {/* Text fading overlay */}
            <div 
              className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none ${
                animationStage === 'normal' ? 'opacity-0' : animationStage === 'text-fading' ? 'opacity-50' : 'opacity-0'
              }`}
            />
            
            {/* Tree highlight overlay */}
            <div 
              className={`absolute inset-0 bg-gradient-to-t from-black via-black to-black transition-opacity duration-1500 pointer-events-none ${
                animationStage === 'tree-only' ? 'opacity-80' : 'opacity-0'
              }`}
            />
            
            {/* Full fade out overlay */}
            <div 
              className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none ${
                animationStage === 'transitioning' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>
      )}
      
      {/* Full screen version of the landing page image */}
      <div className="fixed inset-0 z-0">
        <img 
          src={landingImage} 
          alt="Family Pursuit Background" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
      </div>
      
      {/* Login form overlay - horizontal layout */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
        <div className="text-white text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">Family Pursuit</h1>
          <p className="text-lg opacity-90">Connect with your roots, build your legacy</p>
        </div>
        
        <Card className="w-full bg-white/90 backdrop-blur-sm shadow-2xl border-0">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 p-6 bg-purple-50/60 flex flex-col justify-center">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-purple-900">Welcome Back</h2>
                <p className="text-sm text-purple-700 mt-1">Sign in to continue to your family tree</p>
              </div>
              
              <Alert variant="default" className="mb-4 bg-blue-50/70 border-blue-200">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Default Login</AlertTitle>
                <AlertDescription>
                  <p>Use these credentials:</p>
                  <ul className="list-disc pl-5 mt-1 text-sm">
                    <li><strong>Username:</strong> admin</li>
                    <li><strong>Password:</strong> password123</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="md:w-2/3 p-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm">
                      Don't have an account?{' '}
                      <Button variant="link" className="p-0" onClick={() => setLocation('/register')}>
                        Register here
                      </Button>
                    </div>
                    
                    <Button type="submit" disabled={isLoading || loginSuccess}>
                      {isLoading ? 'Logging in...' : loginSuccess ? 'Preparing your family tree...' : 'Login'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}