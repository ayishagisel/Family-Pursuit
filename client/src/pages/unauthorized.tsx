import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-900">
      <div className="text-6xl text-primary mb-4">
        <i className="fas fa-lock"></i>
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-neutral-600 dark:text-neutral-400 text-center mb-6">
        You don't have permission to access this page.
      </p>
      <div className="space-x-4">
        <Button 
          variant="default" 
          onClick={() => setLocation('/')}
        >
          Return Home
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}