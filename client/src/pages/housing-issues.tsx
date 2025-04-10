import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BuildingIcon, HomeIcon, DropletIcon, BugIcon, ThermometerIcon, HelpCircleIcon, InfoIcon, AlertCircleIcon, MapPinIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LoaderCircle } from "lucide-react";

type HousingIssue = {
  id: number;
  family_member_id: number;
  address: string;
  issue_type: string;
  description: string | null;
  linked_document_id: number | null;
  created_at: string;
  resolved: boolean;
  resolution_notes: string | null;
  hpd_violations: any[]; // Using 'any' for now, would be better to define a proper type
};

type FamilyMember = {
  id: number;
  name: string;
  role: string;
};

type CheckViolationsResponse = {
  address: string;
  violations: any[];
  count: number;
  hasViolations: boolean;
};

export default function HousingIssuesPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  const [addressCheckResults, setAddressCheckResults] = useState<CheckViolationsResponse | null>(null);
  
  const [newIssue, setNewIssue] = useState({
    family_member_id: 0,
    address: "",
    issue_type: "",
    description: "",
  });
  
  const { toast } = useToast();
  
  const { data: familyMembers, isLoading: isLoadingMembers } = useQuery<FamilyMember[]>({
    queryKey: ["/api/family-members"],
  });
  
  const { data: housingIssues, isLoading: isLoadingIssues } = useQuery<HousingIssue[]>({
    queryKey: ["/api/housing-issues"],
  });
  
  const createIssueMutation = useMutation({
    mutationFn: async (issueData: any) => {
      const response = await apiRequest("POST", "/api/housing-issues", issueData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housing-issues"] });
      setIsAddDialogOpen(false);
      resetNewIssue();
      toast({
        title: "Success",
        description: "Housing issue reported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to report housing issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const resolveIssueMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest("PUT", `/api/housing-issues/${id}`, { 
        resolved: true,
        resolution_notes: notes 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housing-issues"] });
      toast({
        title: "Success",
        description: "Housing issue marked as resolved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to resolve housing issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteIssueMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/housing-issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housing-issues"] });
      toast({
        title: "Success",
        description: "Housing issue deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete housing issue: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const checkViolationsMutation = useMutation({
    mutationFn: async (address: string) => {
      setIsCheckingAddress(true);
      const response = await apiRequest("GET", `/api/housing/check-violations?address=${encodeURIComponent(address)}`);
      return response.json();
    },
    onSuccess: (data: CheckViolationsResponse) => {
      setAddressCheckResults(data);
      setIsCheckingAddress(false);
      
      if (data.hasViolations) {
        toast({
          title: "Warning",
          description: `Found ${data.count} HPD violations at this address`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Information",
          description: "No HPD violations found at this address",
        });
      }
    },
    onError: (error: any) => {
      setIsCheckingAddress(false);
      toast({
        title: "Error",
        description: `Failed to check violations: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const resetNewIssue = () => {
    setNewIssue({
      family_member_id: 0,
      address: "",
      issue_type: "",
      description: "",
    });
    setAddressCheckResults(null);
  };
  
  const handleSubmitNewIssue = () => {
    // Basic validation
    if (!newIssue.family_member_id) {
      toast({
        title: "Validation Error",
        description: "Please select a family member",
        variant: "destructive",
      });
      return;
    }
    
    if (!newIssue.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an address",
        variant: "destructive",
      });
      return;
    }
    
    if (!newIssue.issue_type) {
      toast({
        title: "Validation Error",
        description: "Please select an issue type",
        variant: "destructive",
      });
      return;
    }
    
    // Add HPD violations data if available
    const issueData = {
      ...newIssue,
      hpd_violations: addressCheckResults?.violations || []
    };
    
    createIssueMutation.mutate(issueData);
  };
  
  const handleCheckAddress = () => {
    if (!newIssue.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an address to check",
        variant: "destructive",
      });
      return;
    }
    
    checkViolationsMutation.mutate(newIssue.address);
  };
  
  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case 'plumbing':
        return <DropletIcon className="h-5 w-5 mr-1" />;
      case 'electrical':
        return <BuildingIcon className="h-5 w-5 mr-1" />;
      case 'heating':
        return <ThermometerIcon className="h-5 w-5 mr-1" />;
      case 'pests':
        return <BugIcon className="h-5 w-5 mr-1" />;
      case 'structural':
        return <HomeIcon className="h-5 w-5 mr-1" />;
      default:
        return <HelpCircleIcon className="h-5 w-5 mr-1" />;
    }
  };
  
  const filteredIssues = housingIssues?.filter(issue => {
    if (selectedTab === "all") return true;
    if (selectedTab === "resolved") return issue.resolved;
    if (selectedTab === "unresolved") return !issue.resolved;
    return true;
  });
  
  const getFormattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getFamilyMemberName = (id: number) => {
    const member = familyMembers?.find(m => m.id === id);
    return member ? member.name : "Unknown";
  };
  
  if (isLoadingIssues || isLoadingMembers) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading housing issues...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Housing Issues</h1>
          <p className="text-muted-foreground">Report and track housing-related problems for your family</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Report New Issue
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">All Issues</TabsTrigger>
          <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {filteredIssues && filteredIssues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map(issue => (
            <Card key={issue.id} className={issue.resolved ? "border-green-200 bg-green-50 dark:bg-green-950/10" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      {getIssueTypeIcon(issue.issue_type)}
                      <CardTitle className="text-lg">{issue.issue_type}</CardTitle>
                    </div>
                    <CardDescription className="mt-1 flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {issue.address}
                    </CardDescription>
                  </div>
                  <Badge variant={issue.resolved ? "outline" : "destructive"}>
                    {issue.resolved ? "Resolved" : "Unresolved"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mt-2 mb-2">
                  <div className="text-sm font-medium">Reported by:</div>
                  <div className="text-sm">{getFamilyMemberName(issue.family_member_id)}</div>
                </div>
                <div className="mt-2 mb-2">
                  <div className="text-sm font-medium">Reported on:</div>
                  <div className="text-sm">{getFormattedDate(issue.created_at)}</div>
                </div>
                {issue.description && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Description:</div>
                    <div className="text-sm text-muted-foreground">{issue.description}</div>
                  </div>
                )}
                {issue.hpd_violations && issue.hpd_violations.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <AlertCircleIcon className="h-4 w-4 text-destructive mr-1" />
                      <span className="text-sm font-medium">HPD Violations: {issue.hpd_violations.length}</span>
                    </div>
                  </div>
                )}
                {issue.resolved && issue.resolution_notes && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Resolution:</div>
                    <div className="text-sm">{issue.resolution_notes}</div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                {!issue.resolved ? (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Mark Resolved
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Resolve Housing Issue</DialogTitle>
                          <DialogDescription>
                            Enter resolution details for this housing issue.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Label htmlFor="resolution">Resolution Notes</Label>
                          <Textarea
                            id="resolution"
                            placeholder="Explain how this issue was resolved..."
                            className="w-full"
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('close-dialog')?.click()}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              const notes = (document.getElementById('resolution') as HTMLTextAreaElement)?.value || "";
                              resolveIssueMutation.mutate({ id: issue.id, notes });
                              document.getElementById('close-dialog')?.click();
                            }}
                          >
                            Save Resolution
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this housing issue?")) {
                          deleteIssueMutation.mutate(issue.id);
                        }
                      }}
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this resolved housing issue?")) {
                        deleteIssueMutation.mutate(issue.id);
                      }
                    }}
                  >
                    Delete Record
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <HomeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No housing issues found</h3>
          <p className="text-muted-foreground">
            {selectedTab === "all" ? 
              "There are no housing issues reported yet." : 
              selectedTab === "resolved" ? 
                "There are no resolved housing issues." : 
                "There are no unresolved housing issues."}
          </p>
          <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            Report an Issue
          </Button>
        </div>
      )}
      
      {/* Add New Issue Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Housing Issue</DialogTitle>
            <DialogDescription>
              Report a housing issue for a family member. We'll help track it until it's resolved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="family_member" className="text-right">
                Family Member
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => setNewIssue({...newIssue, family_member_id: parseInt(value)})}
                  value={newIssue.family_member_id.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {familyMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <div className="col-span-3">
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder="123 Main St, Apt 4B, New York, NY 10001"
                    value={newIssue.address}
                    onChange={(e) => setNewIssue({...newIssue, address: e.target.value})}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCheckAddress}
                    disabled={isCheckingAddress}
                  >
                    {isCheckingAddress ? 
                      <LoaderCircle className="h-4 w-4 animate-spin mr-1" /> : 
                      <InfoIcon className="h-4 w-4 mr-1" />
                    }
                    Check
                  </Button>
                </div>
                
                {addressCheckResults && (
                  <div className={`mt-2 p-2 text-sm rounded ${
                    addressCheckResults.hasViolations 
                      ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400" 
                      : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400"
                  }`}>
                    {addressCheckResults.hasViolations 
                      ? `Found ${addressCheckResults.count} HPD violations at this address` 
                      : "No HPD violations found at this address"}
                  </div>
                )}
                
                {addressCheckResults?.violations && addressCheckResults.violations.length > 0 && (
                  <div className="mt-2">
                    <Separator className="my-2" />
                    <p className="text-sm font-medium mb-1">Violation Details:</p>
                    <ScrollArea className="h-[100px] w-full rounded border p-2">
                      {addressCheckResults.violations.map((violation, index) => (
                        <div key={index} className="text-xs mb-2">
                          <div className="font-semibold">{violation.violationType}: {violation.status}</div>
                          <div>{violation.novDescription}</div>
                          <div>Location: Apt {violation.apartment}, Floor {violation.story}</div>
                          <Separator className="my-1" />
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issue_type" className="text-right">
                Issue Type
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => setNewIssue({...newIssue, issue_type: value})}
                  value={newIssue.issue_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Heating">Heating</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Pests">Pests</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail..."
                className="col-span-3"
                value={newIssue.description}
                onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                resetNewIssue();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitNewIssue}
              disabled={createIssueMutation.isPending}
            >
              {createIssueMutation.isPending && <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}