import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import HelpRequestCard from "@/components/help/HelpRequestCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const HelpNeededPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddHelpOpen, setIsAddHelpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dateNeeded: "",
    timeNeeded: ""
  });
  
  // Fetch help requests
  const { data: helpRequests = [], isLoading } = useQuery({
    queryKey: ["/api/help-requests"],
  });
  
  const handleAddHelpRequest = () => {
    setIsAddHelpOpen(true);
  };
  
  // Get active help requests (not completed)
  const activeRequests = helpRequests.filter(request => request.status !== "completed");
  
  // Get completed help requests
  const completedRequests = helpRequests.filter(request => request.status === "completed");

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id === 'date-needed' ? 'dateNeeded' : id === 'time-needed' ? 'timeNeeded' : id]: value
    });
  };

  // Create help request mutation
  const createHelpRequestMutation = useMutation({
    mutationFn: async (helpRequestData: any) => {
      const response = await apiRequest("POST", "/api/help-requests", helpRequestData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create help request");
      }
      return response.json();
    },
    onSuccess: () => {
      // Reset form data
      setFormData({
        title: "",
        description: "",
        dateNeeded: "",
        timeNeeded: ""
      });
      
      // Close dialog
      setIsAddHelpOpen(false);
      
      // Show success toast
      toast({
        title: "Success!",
        description: "Your help request has been created.",
      });
      
      // Refresh help requests list
      queryClient.invalidateQueries({ queryKey: ["/api/help-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Please provide a title for your request",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description) {
      toast({
        title: "Error",
        description: "Please provide a description for your request",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dateNeeded) {
      toast({
        title: "Error",
        description: "Please select a date when help is needed",
        variant: "destructive",
      });
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    
    // Prepare date with time if provided
    let dateNeeded = new Date(formData.dateNeeded);
    if (formData.timeNeeded) {
      const [hours, minutes] = formData.timeNeeded.split(':');
      dateNeeded.setHours(parseInt(hours), parseInt(minutes));
    }

    // Submit help request
    createHelpRequestMutation.mutate({
      title: formData.title,
      description: formData.description,
      dateNeeded: dateNeeded.toISOString(),
      requestedBy: 7 // Current user ID - would be dynamic in a real app
    });
  };

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-montserrat font-bold text-2xl">Help Needed</h1>
        <div className="flex items-center space-x-4">
          <button 
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            onClick={handleAddHelpRequest}
          >
            <i className="fas fa-plus mr-2"></i>
            <span>Add Request</span>
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="font-montserrat font-medium">Active Help Requests</div>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-neutral-500">Loading help requests...</div>
                </div>
              ) : activeRequests.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No active help requests. Click "Add Request" to create one.
                </div>
              ) : (
                activeRequests.map((request) => (
                  <HelpRequestCard 
                    key={request.id} 
                    helpRequest={request} 
                    currentUserId={7} // Current user ID - would be dynamic in a real app
                  />
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="font-montserrat font-medium">Completed Requests</div>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-neutral-500">Loading completed requests...</div>
                </div>
              ) : completedRequests.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No completed requests yet.
                </div>
              ) : (
                completedRequests.map((request) => (
                  <HelpRequestCard 
                    key={request.id} 
                    helpRequest={request} 
                    currentUserId={7} // Current user ID
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden sticky top-6">
            <div className="p-4 border-b border-neutral-200">
              <h2 className="font-montserrat font-medium">Help Dashboard</h2>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Your Contribution</h3>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">Tasks volunteered</div>
                  <div className="text-sm font-medium">3</div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">Tasks completed</div>
                  <div className="text-sm font-medium">2</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Pending tasks</div>
                  <div className="text-sm font-medium">1</div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Most Active Helpers</h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center mr-2">
                      <i className="fas fa-user text-xs text-neutral-600"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Sarah Johnson</div>
                      <div className="text-xs text-neutral-500">4 tasks completed</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center mr-2">
                      <i className="fas fa-user text-xs text-neutral-600"></i>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Michael Johnson</div>
                      <div className="text-xs text-neutral-500">3 tasks completed</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Suggestions</h3>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                  <i className="fas fa-lightbulb text-[#F2994A] mr-1"></i>
                  Schedule recurring tasks for regular family needs.
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                  <i className="fas fa-lightbulb text-[#F2994A] mr-1"></i>
                  Be specific about time and skills needed.
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  <i className="fas fa-lightbulb text-[#F2994A] mr-1"></i>
                  Thank volunteers after they've helped out!
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-neutral-200">
              <button 
                className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                onClick={handleAddHelpRequest}
              >
                Create New Help Request
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Help Request Dialog */}
      <Dialog open={isAddHelpOpen} onOpenChange={setIsAddHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Help Request</DialogTitle>
            <DialogDescription>
              Ask for assistance from your family members.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input 
                id="title" 
                placeholder="Help request title" 
                className="col-span-3" 
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea 
                id="description" 
                placeholder="Describe what help you need and provide any necessary details" 
                className="col-span-3"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date-needed" className="text-right">
                Date Needed
              </Label>
              <Input 
                id="date-needed" 
                type="date" 
                className="col-span-3" 
                value={formData.dateNeeded}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time-needed" className="text-right">
                Time
              </Label>
              <Input 
                id="time-needed" 
                type="time" 
                className="col-span-3" 
                value={formData.timeNeeded}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddHelpOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpNeededPage;
