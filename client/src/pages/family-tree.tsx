import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TreeCanvas from "@/components/family-tree/TreeCanvas";
import TreeControls from "@/components/family-tree/TreeControls";
import { FamilyMember } from "@shared/schema";

const FamilyTreePage = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get family members for the legend
  const { data: familyMembers = [] } = useQuery({
    queryKey: ["/api/family-members"],
  });

  const handleNodeClick = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleSearch = () => {
    // Implement search functionality
    alert("Search functionality to be implemented");
  };

  const handleZoomIn = () => {
    // Implement zoom in - This would interact with the TreeCanvas component
    alert("Zoom in functionality to be implemented");
  };

  const handleZoomOut = () => {
    // Implement zoom out
    alert("Zoom out functionality to be implemented");
  };

  const handleReset = () => {
    // Reset zoom and pan
    alert("Reset view functionality to be implemented");
  };

  const handleAddMember = () => {
    // Open dialog to add new family member
    alert("Add member functionality to be implemented");
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
          />
        </div>
        
        <TreeCanvas onNodeClick={handleNodeClick} />
        
        <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#5AAE61] mr-2"></div>
              <span className="text-sm">Biological</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#9B7EDE] mr-2"></div>
              <span className="text-sm">Adoptive</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-[#F2994A] mr-2"></div>
              <span className="text-sm">Step/In-law</span>
            </div>
          </div>
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            <i className="fas fa-pen mr-1"></i> Edit Relationships
          </button>
        </div>
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
                  src={selectedMember.avatarUrl} 
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
                <button className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg">
                  <i className="fas fa-edit mr-2"></i>
                  Edit
                </button>
                
                <button className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 py-2 rounded-lg">
                  <i className="fas fa-sitemap mr-2"></i>
                  View Relations
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FamilyTreePage;
