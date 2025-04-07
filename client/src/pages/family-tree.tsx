import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import TreeCanvas from "@/components/family-tree/TreeCanvas";
import TreeControls from "@/components/family-tree/TreeControls";
import InfographicCreator from "@/components/family-tree/InfographicCreator";
import GenerationalTimeline from "@/components/family-tree/GenerationalTimeline";
import MemberNarrative from "@/components/ai/MemberNarrative";
import RelationshipInsights from "@/components/ai/RelationshipInsights";
import { FamilyMember, Relationship, insertFamilyMemberSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAIValidation } from "@/hooks/useAIValidation";
import { Loader2, AlertTriangle, Check, Users, Search, UserX, FileImage } from "lucide-react";
import { z } from "zod";

// Extended zod schema with validation
const addMemberFormSchema = insertFamilyMemberSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
});

type AddMemberFormValues = z.infer<typeof addMemberFormSchema>;

const FamilyTreePage = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [isRelationsDialogOpen, setIsRelationsDialogOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'warning' | 'error'>('idle');
  
  // Zoom controls state
  const [currentZoom, setCurrentZoom] = useState(1);
  const [zoomInTrigger, setZoomInTrigger] = useState(false);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(false);
  const [resetViewTrigger, setResetViewTrigger] = useState(false);
  const [isInfographicDialogOpen, setIsInfographicDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { validateFamilyMemberData, isValidating, validationResult } = useAIValidation();
  
  // Get family members
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["/api/family-members"],
  });
  
  // Get all relationships
  const { data: allRelationships = [] } = useQuery({
    queryKey: ["/api/relationships"],
  });
  
  // Get member-specific relationships when a member is selected
  const memberRelationships = useMemo(() => {
    if (!selectedMember) return [];
    
    // Find relationships where the selected member is either the source or target
    return allRelationships.filter((relationship: Relationship) => 
      relationship.source_id === selectedMember.id || 
      relationship.target_id === selectedMember.id
    );
  }, [selectedMember, allRelationships]);

  // Set up form
  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      name: "",
      role: "",
      relationship: "biological",
      avatarUrl: "https://randomuser.me/api/portraits/men/1.jpg", // Default avatar for demo
    }
  });

  // Create mutation for adding a new family member
  const addMemberMutation = useMutation({
    mutationFn: async (newMember: AddMemberFormValues) => {
      return apiRequest("POST", "/api/family-members", newMember);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New family member added successfully!",
      });
      setIsAddMemberDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add family member. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to add family member:", error);
    },
  });
  
  // Create mutation for updating an existing family member
  const updateMemberMutation = useMutation({
    mutationFn: async (data: { id: number; member: Partial<AddMemberFormValues> }) => {
      return apiRequest("PUT", `/api/family-members/${data.id}`, data.member);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Family member updated successfully!",
      });
      setIsEditMemberDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/family-members"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update family member. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update family member:", error);
    },
  });

  const handleNodeClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };
  
  const handleViewRelations = () => {
    // Close the member details dialog and open the relationships dialog
    setIsDialogOpen(false);
    setIsRelationsDialogOpen(true);
  };
  
  const handleEditMember = () => {
    // Close the member details dialog and open the edit dialog
    if (selectedMember) {
      // Pre-populate the form with the selected member's data
      form.setValue('name', selectedMember.name);
      form.setValue('role', selectedMember.role);
      form.setValue('relationship', selectedMember.relationship);
      form.setValue('avatarUrl', selectedMember.avatarUrl || '');
      
      setIsDialogOpen(false);
      setIsEditMemberDialogOpen(true);
    }
  };

  // Search state
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FamilyMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    // Open search dialog
    setIsSearchDialogOpen(true);
  };
  
  const performSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Search through family members for matches in name or role
    const query = searchQuery.toLowerCase();
    const results = familyMembers.filter((member: FamilyMember) => 
      member.name.toLowerCase().includes(query) || 
      member.role.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
    setIsSearching(false);
  };
  
  // Focus member on search result click
  const handleSearchResultClick = (member: FamilyMember) => {
    // Focus on specific node (could trigger animation or highlighting)
    setSelectedMember(member);
    setIsSearchDialogOpen(false);
    
    // Open details dialog
    setIsDialogOpen(true);
  };

  const handleZoomIn = () => {
    // Trigger zoom in for TreeCanvas
    setZoomInTrigger(prev => !prev);
  };

  const handleZoomOut = () => {
    // Trigger zoom out for TreeCanvas
    setZoomOutTrigger(prev => !prev);
  };

  const handleReset = () => {
    // Trigger reset view for TreeCanvas
    setResetViewTrigger(prev => !prev);
  };
  
  // Function to keep track of current zoom level
  const handleZoomChange = (zoom: number) => {
    setCurrentZoom(zoom);
  };

  const handleAddMember = () => {
    // Open dialog to add new family member
    setIsAddMemberDialogOpen(true);
  };

  // Effect to reset validation status when dialogs close
  useEffect(() => {
    if (!isAddMemberDialogOpen && !isEditMemberDialogOpen) {
      setValidationStatus('idle');
    }
  }, [isAddMemberDialogOpen, isEditMemberDialogOpen]);

  const handleValidation = async (values: AddMemberFormValues) => {
    // Set validating status
    setValidationStatus('validating');
    
    try {
      // AI validation before submitting
      const result = await validateFamilyMemberData({
        name: values.name,
        role: values.role,
        relationship: values.relationship
      });
      
      // Handle validation result
      if (!result.isValid && result.issues.length > 0) {
        // Set status based on issues
        setValidationStatus('warning');
        
        // Show warning toast with AI suggestions
        toast({
          title: "AI Validation Warning",
          description: "Some issues were found with the family member data. Check the warnings for details.",
          variant: "warning",
        });
        
        // If AI provided suggestions, apply them to form
        if (result.suggestions) {
          if (result.suggestions.name) form.setValue('name', result.suggestions.name);
          if (result.suggestions.role) form.setValue('role', result.suggestions.role);
          if (result.suggestions.relationship) form.setValue('relationship', result.suggestions.relationship as "biological" | "adoptive" | "step");
        }
        
        return false; // Validation failed
      }
      
      // If validation passed, set success status
      setValidationStatus('success');
      return true; // Validation succeeded
    } catch (error) {
      console.error("Error during form validation:", error);
      setValidationStatus('error');
      return true; // Continue despite error to avoid blocking users
    }
  };
  
  const onSubmit = async (values: AddMemberFormValues) => {
    const isValid = await handleValidation(values);
    if (isValid) {
      addMemberMutation.mutate(values);
    }
  };
  
  const onUpdate = async (values: AddMemberFormValues) => {
    if (!selectedMember) return;
    
    const isValid = await handleValidation(values);
    if (isValid) {
      updateMemberMutation.mutate({
        id: selectedMember.id,
        member: values
      });
    }
  };

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-montserrat font-bold text-2xl">Family Tree</h1>
        <div className="flex items-center space-x-4">
          <button 
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            onClick={handleAddMember}
          >
            <i className="fas fa-plus mr-2"></i>
            <span>Add Member</span>
          </button>
          <div className="relative">
            <button className="text-neutral-800 dark:text-neutral-100">
              <i className="fas fa-bell text-xl"></i>
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent"></span>
            </button>
          </div>
        </div>
      </header>
      
      <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <div className="font-montserrat font-medium">Your Family Tree</div>
          <TreeControls 
            onSearch={handleSearch}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            onCreateInfographic={() => setIsInfographicDialogOpen(true)}
            currentZoom={currentZoom}
          />
        </div>
        
        <TreeCanvas 
          onNodeClick={handleNodeClick}
          onZoomChange={handleZoomChange}
          zoomIn={zoomInTrigger}
          zoomOut={zoomOutTrigger}
          resetView={resetViewTrigger}
        />
        
        <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center bg-white dark:bg-neutral-800 px-2 py-1 rounded-md">
              <div className="w-3 h-3 rounded-full bg-[#5AAE61] mr-2"></div>
              <span className="text-sm text-neutral-900 dark:text-white">Biological</span>
            </div>
            <div className="flex items-center bg-white dark:bg-neutral-800 px-2 py-1 rounded-md">
              <div className="w-3 h-3 rounded-full bg-[#9B7EDE] mr-2"></div>
              <span className="text-sm text-neutral-900 dark:text-white">Adoptive</span>
            </div>
            <div className="flex items-center bg-white dark:bg-neutral-800 px-2 py-1 rounded-md">
              <div className="w-3 h-3 rounded-full bg-[#F2994A] mr-2"></div>
              <span className="text-sm text-neutral-900 dark:text-white">Step/In-law</span>
            </div>
          </div>
          <button className="text-primary hover:text-primary/80 text-sm font-medium bg-white dark:bg-neutral-800 px-3 py-1 rounded-md">
            <i className="fas fa-pen mr-1"></i> Edit Relationships
          </button>
        </div>
      </div>
      
      {/* AI Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Relationship Insights Card */}
        <RelationshipInsights 
          memberId={selectedMember?.id} 
          className="h-full"
        />
        
        {/* Member Narrative Card */}
        <MemberNarrative 
          memberId={selectedMember?.id || 0} 
          className="h-full"
        />
      </div>
      
      {/* Generational Timeline Section */}
      <div className="mb-6">
        <GenerationalTimeline
          familyMembers={familyMembers as FamilyMember[]}
          relationships={allRelationships as Relationship[]}
          onSelectMember={handleNodeClick}
        />
      </div>
      
      {/* Member Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMember?.name}</DialogTitle>
            <DialogDescription>{selectedMember?.role}</DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="flex flex-col items-center mt-4">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                <img 
                  src={selectedMember.avatarUrl || ""} 
                  alt={selectedMember.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="mb-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    selectedMember.relationship === 'biological' ? 'bg-[#5AAE61]' : 
                    selectedMember.relationship === 'adoptive' ? 'bg-[#9B7EDE]' : 
                    'bg-[#F2994A]'
                  }`}></div>
                  <span className="capitalize">{selectedMember.relationship} Relation</span>
                </div>
              </div>
              
              <div className="w-full flex space-x-2">
                <button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg"
                  onClick={handleEditMember}
                >
                  <i className="fas fa-edit mr-2"></i>
                  Edit
                </button>
                
                <button 
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 py-2 rounded-lg"
                  onClick={handleViewRelations}
                >
                  <i className="fas fa-sitemap mr-2"></i>
                  View Relations
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Search Family Tree
            </DialogTitle>
            <DialogDescription>
              Find family members by name or role
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by name or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={performSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {searchResults.length === 0 && searchQuery.trim() !== '' ? (
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <UserX className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-muted-foreground">No family members found for "{searchQuery}"</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-muted-foreground">Enter a search term to find family members</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {searchResults.map((member) => (
                    <Card 
                      key={member.id} 
                      className="overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => handleSearchResultClick(member)}
                    >
                      <CardContent className="p-3 flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={member.avatarUrl || ""} alt={member.name} />
                          <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <div className="ml-auto">
                          <div className={`w-3 h-3 rounded-full ${
                            member.relationship === 'biological' ? 'bg-[#5AAE61]' : 
                            member.relationship === 'adoptive' ? 'bg-[#9B7EDE]' : 
                            'bg-[#F2994A]'
                          }`}></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSearchDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Relationships Dialog */}
      <Dialog open={isRelationsDialogOpen} onOpenChange={setIsRelationsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Relationships for {selectedMember?.name}
            </DialogTitle>
            <DialogDescription>
              View all connections and relationships for this family member.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {memberRelationships.length === 0 ? (
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-muted-foreground">No relationships found for this family member.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {memberRelationships.map((relationship) => {
                  // Find the other member in the relationship (not the selected member)
                  const otherMemberId = 
                    relationship.source_id === selectedMember?.id 
                      ? relationship.target_id 
                      : relationship.source_id;
                  
                  const otherMember = familyMembers.find((m: FamilyMember) => m.id === otherMemberId);
                  
                  if (!otherMember) return null;
                  
                  // Determine relationship direction
                  const direction = relationship.source_id === selectedMember?.id 
                    ? "to" 
                    : "from";
                    
                  return (
                    <Card key={relationship.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/20 pb-2">
                        <CardTitle className="text-base font-semibold flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            otherMember.relationship === 'biological' ? 'bg-[#5AAE61]' : 
                            otherMember.relationship === 'adoptive' ? 'bg-[#9B7EDE]' : 
                            'bg-[#F2994A]'
                          }`}></div>
                          {otherMember.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="flex items-center">
                          <Avatar className="h-9 w-9 mr-3">
                            <AvatarImage src={otherMember.avatarUrl || ""} alt={otherMember.name} />
                            <AvatarFallback>{otherMember.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{otherMember.role}</p>
                            <div className="text-xs text-muted-foreground capitalize">
                              <span>{direction === "to" ? "Connected to" : "Connected from"}</span> 
                              <Badge variant="outline" className="ml-2 capitalize">
                                {relationship.relationship_type || otherMember.relationship}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRelationsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Family Member</DialogTitle>
            <DialogDescription>
              Update the details for {selectedMember?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Father, Sister, Cousin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="biological">Biological</SelectItem>
                        <SelectItem value="adoptive">Adoptive</SelectItem>
                        <SelectItem value="step">Step/In-law</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/avatar.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Validation Alert */}
              {validationStatus === 'warning' && validationResult && validationResult.issues.length > 0 && (
                <Alert variant="warning" className="mt-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>AI Validation Warning</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      {validationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                    {validationResult.suggestions && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Suggestions:</p>
                        <ul className="list-disc pl-5">
                          {validationResult.suggestions.name && (
                            <li>Name: {validationResult.suggestions.name}</li>
                          )}
                          {validationResult.suggestions.role && (
                            <li>Role: {validationResult.suggestions.role}</li>
                          )}
                          {validationResult.suggestions.relationship && (
                            <li>Relationship: {validationResult.suggestions.relationship}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {validationStatus === 'success' && (
                <Alert variant="default" className="mt-2 mb-2 bg-green-50 text-green-800 border-green-200">
                  <Check className="h-4 w-4" />
                  <AlertTitle>AI Validation Passed</AlertTitle>
                  <AlertDescription>
                    The family member data looks valid and consistent.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditMemberDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMemberMutation.isPending || isValidating}
                >
                  {updateMemberMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Update Member"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
            <DialogDescription>
              Enter the details to add a new member to your family tree.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Father, Sister, Cousin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="biological">Biological</SelectItem>
                        <SelectItem value="adoptive">Adoptive</SelectItem>
                        <SelectItem value="step">Step/In-law</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/avatar.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Validation Alert */}
              {validationStatus === 'warning' && validationResult && validationResult.issues.length > 0 && (
                <Alert variant="warning" className="mt-2 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>AI Validation Warning</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 text-sm">
                      {validationResult.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                    {validationResult.suggestions && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Suggestions:</p>
                        <ul className="list-disc pl-5">
                          {validationResult.suggestions.name && (
                            <li>Name: {validationResult.suggestions.name}</li>
                          )}
                          {validationResult.suggestions.role && (
                            <li>Role: {validationResult.suggestions.role}</li>
                          )}
                          {validationResult.suggestions.relationship && (
                            <li>Relationship: {validationResult.suggestions.relationship}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {validationStatus === 'success' && (
                <Alert variant="default" className="mt-2 mb-2 bg-green-50 text-green-800 border-green-200">
                  <Check className="h-4 w-4" />
                  <AlertTitle>AI Validation Passed</AlertTitle>
                  <AlertDescription>
                    The family member data looks valid and consistent.
                  </AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddMemberDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addMemberMutation.isPending || isValidating}
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Infographic Creator Dialog */}
      <Dialog 
        open={isInfographicDialogOpen} 
        onOpenChange={setIsInfographicDialogOpen}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Family Tree Infographic Creator</DialogTitle>
            <DialogDescription className="sr-only">Create and download a visual representation of your family tree</DialogDescription>
          </DialogHeader>
          <InfographicCreator onClose={() => setIsInfographicDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyTreePage;
