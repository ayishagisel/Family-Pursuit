import { useState } from "react";
import { HelpRequest } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HelpRequestCardProps {
  helpRequest: HelpRequest;
  currentUserId: number;
}

const HelpRequestCard = ({ helpRequest, currentUserId }: HelpRequestCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get status badge color
  const getStatusBadgeClass = () => {
    switch (helpRequest.status) {
      case "needs_volunteer":
        return "bg-primary/10 text-primary";
      case "has_volunteers":
        return "bg-secondary/10 text-secondary";
      case "completed":
        return "bg-accent text-white";
      default:
        return "bg-primary/10 text-primary";
    }
  };
  
  // Format status text
  const getStatusText = () => {
    switch (helpRequest.status) {
      case "needs_volunteer":
        return "Needs Volunteer";
      case "has_volunteers":
        return `${Array.isArray(helpRequest.volunteers) ? helpRequest.volunteers.length : 0} Volunteer${helpRequest.volunteers.length !== 1 ? 's' : ''}`;
      case "completed":
        return "Completed";
      default:
        return "Unknown Status";
    }
  };
  
  // Check if the current user is already a volunteer
  const isCurrentUserVolunteer = () => {
    return Array.isArray(helpRequest.volunteers) && helpRequest.volunteers.includes(currentUserId);
  };
  
  // Handle volunteering for a help request
  const volunteerMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const response = await apiRequest(
        "POST", 
        `/api/help-requests/${helpRequest.id}/volunteers/${currentUserId}`,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/help-requests'] });
      toast({
        title: "Success!",
        description: "You've volunteered to help.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to volunteer: ${error}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });
  
  const handleVolunteer = () => {
    volunteerMutation.mutate();
  };

  return (
    <div className="mb-4 border-b border-neutral-200 pb-4 last:mb-0 last:border-0 last:pb-0">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium">{helpRequest.title}</div>
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeClass()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        {helpRequest.description}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* This would be a real user avatar in a production app */}
          <div className="w-6 h-6 rounded-full bg-neutral-300 flex items-center justify-center">
            <i className="fas fa-user text-xs text-neutral-600"></i>
          </div>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 ml-2">
            Posted by User #{helpRequest.requestedBy}
          </span>
        </div>
        
        {helpRequest.status !== "completed" && !isCurrentUserVolunteer() && (
          <button
            className="bg-accent hover:bg-accent/90 text-white text-xs font-medium py-1 px-3 rounded-lg disabled:opacity-50"
            onClick={handleVolunteer}
            disabled={isLoading}
          >
            {isLoading ? (
              <i className="fas fa-spinner fa-spin mr-1"></i>
            ) : 'I Can Help'}
          </button>
        )}
        
        {isCurrentUserVolunteer() && (
          <div className="text-xs text-accent font-medium">
            <i className="fas fa-check-circle mr-1"></i>
            Volunteered
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpRequestCard;
