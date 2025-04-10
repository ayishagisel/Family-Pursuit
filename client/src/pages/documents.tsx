import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DocumentItem from "@/components/documents/DocumentItem";
import { Document } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const DocumentsPage = () => {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filter, setFilter] = useState(""); // For document type filtering
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents"],
  });
  
  // Fetch secure documents
  const { data: secureDocuments = [], isLoading: isSecureLoading } = useQuery({
    queryKey: ["/api/documents/secure"],
  });
  
  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };
  
  const handleDownload = (document: Document) => {
    // In a real app, this would trigger a download
    toast({
      title: "Download Started",
      description: `Downloading ${document.title}...`,
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      toast({
        title: "File Selected",
        description: `Selected: ${e.target.files[0].name}`,
      });
    }
  };
  
  // Filter documents based on tab and document type filter
  const getFilteredDocuments = () => {
    let filtered = [];
    
    // First apply the tab filter
    if (activeTab === "all") {
      filtered = documents;
    } else if (activeTab === "recent") {
      filtered = [...documents].sort((a, b) => {
        const aDate = a.uploadedAt ? new Date(a.uploadedAt) : new Date(0);
        const bDate = b.uploadedAt ? new Date(b.uploadedAt) : new Date(0);
        return bDate.getTime() - aDate.getTime();
      }).slice(0, 5);
    } else if (activeTab === "secure") {
      filtered = secureDocuments;
    }
    
    // Then apply the document type filter
    if (filter) {
      filtered = filtered.filter(doc => doc.documentType === filter);
    }
    
    return filtered;
  };
  
  const regularDocs = documents.filter(doc => !doc.isSecure);

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-montserrat font-bold text-2xl">Family Documents</h1>
        <div className="flex items-center space-x-4">
          <button 
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            onClick={handleUploadClick}
          >
            <i className="fas fa-upload mr-2"></i>
            <span>Upload Document</span>
          </button>
        </div>
      </header>
      
      <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden mb-6">
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="p-4 border-b border-neutral-200">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="recent">Recently Added</TabsTrigger>
              <TabsTrigger value="secure">Secure Documents</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4">
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-neutral-500">Loading documents...</div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No documents found. Click "Upload Document" to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredDocuments().map((document) => (
                    <DocumentItem 
                      key={document.id} 
                      document={document} 
                      onDownload={!document.isSecure ? handleDownload : undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-neutral-500">Loading documents...</div>
                </div>
              ) : getFilteredDocuments().length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No documents found in this category.
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredDocuments().map((document) => (
                    <DocumentItem 
                      key={document.id} 
                      document={document} 
                      onDownload={!document.isSecure ? handleDownload : undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="secure" className="mt-0">
              {isSecureLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-neutral-500">Loading secure documents...</div>
                </div>
              ) : getFilteredDocuments().length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  No secure documents found in this category.
                </div>
              ) : (
                <div className="space-y-2">
                  {getFilteredDocuments().map((document) => (
                    <DocumentItem 
                      key={document.id} 
                      document={document} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="font-montserrat font-medium">Document Categories</h2>
            {filter && (
              <button 
                onClick={() => setFilter("")}
                className="text-xs text-primary hover:text-primary/80 flex items-center"
              >
                <i className="fas fa-times-circle mr-1"></i>
                Clear Filter
              </button>
            )}
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <button 
                className={`bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-4 rounded-lg text-center ${filter === 'generic' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setFilter('generic')}
              >
                <div className="text-4xl text-primary mb-2">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="font-medium">General</div>
                <div className="text-xs text-neutral-500">
                  {documents.filter(doc => doc.documentType === 'generic').length || 0} documents
                </div>
              </button>
              
              <button 
                className={`bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-4 rounded-lg text-center ${filter === 'image' ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setFilter('image')}
              >
                <div className="text-4xl text-purple-500 mb-2">
                  <i className="fas fa-file-image"></i>
                </div>
                <div className="font-medium">Photos & Media</div>
                <div className="text-xs text-neutral-500">
                  {documents.filter(doc => doc.documentType === 'image').length || 0} documents
                </div>
              </button>
              
              <button 
                className={`bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-4 rounded-lg text-center ${filter === 'legal' ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => setFilter('legal')}
              >
                <div className="text-4xl text-yellow-500 mb-2">
                  <i className="fas fa-file-signature"></i>
                </div>
                <div className="font-medium">Legal</div>
                <div className="text-xs text-neutral-500">
                  {documents.filter(doc => doc.documentType === 'legal').length || 0} documents
                </div>
              </button>
              
              <button 
                className={`bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-4 rounded-lg text-center ${filter === 'financial' ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => setFilter('financial')}
              >
                <div className="text-4xl text-green-500 mb-2">
                  <i className="fas fa-file-invoice-dollar"></i>
                </div>
                <div className="font-medium">Financial</div>
                <div className="text-xs text-neutral-500">
                  {documents.filter(doc => doc.documentType === 'financial').length || 0} documents
                </div>
              </button>
              
              <button 
                className={`bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-4 rounded-lg text-center ${filter === 'medical' ? 'ring-2 ring-red-500' : ''}`}
                onClick={() => setFilter('medical')}
              >
                <div className="text-4xl text-red-500 mb-2">
                  <i className="fas fa-file-medical"></i>
                </div>
                <div className="font-medium">Medical</div>
                <div className="text-xs text-neutral-500">
                  {documents.filter(doc => doc.documentType === 'medical').length || 0} documents
                </div>
              </button>
              
              <button 
                className={`bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-4 rounded-lg text-center ${filter === 'intellectual' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setFilter('intellectual')}
              >
                <div className="text-4xl text-blue-500 mb-2 relative">
                  <i className="fas fa-file-alt"></i>
                  <i className="fas fa-brain absolute text-sm top-1 right-1"></i>
                </div>
                <div className="font-medium">Intellectual</div>
                <div className="text-xs text-neutral-500">
                  {documents.filter(doc => doc.documentType === 'intellectual').length || 0} documents
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-montserrat font-medium">Storage & Security</h2>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Storage Usage</h3>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="text-xs text-neutral-500 mt-1">3.5 GB of 10 GB used</div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Document Security</h3>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                <i className="fas fa-lock text-primary mr-1"></i>
                Secure documents can only be accessed by authorized family members.
              </div>
              
              <button className="text-primary hover:text-primary/80 text-sm font-medium">
                <i className="fas fa-cog mr-1"></i> Manage Access Controls
              </button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Document Tips</h3>
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <li><i className="fas fa-lightbulb text-[#F2994A] mr-1"></i> Keep important documents secure</li>
                <li><i className="fas fa-lightbulb text-[#F2994A] mr-1"></i> Regularly update legal documents</li>
                <li><i className="fas fa-lightbulb text-[#F2994A] mr-1"></i> Share family photos with everyone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to your family vault.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" placeholder="Document title" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                File
              </Label>
              <div className="col-span-3">
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center">
                  <i className="fas fa-cloud-upload-alt text-3xl text-neutral-400 mb-2"></i>
                  <p className="text-sm text-neutral-500">Drag files here or click to browse</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    id="file-upload" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="mt-2 inline-block bg-primary hover:bg-primary/90 text-white text-sm font-medium py-1 px-3 rounded-lg cursor-pointer">
                    Select File
                  </label>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      <i className="fas fa-check-circle mr-1"></i>
                      {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Security
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <input type="checkbox" id="secure-document" className="rounded text-primary focus:ring-primary" />
                <Label htmlFor="secure-document" className="text-sm">
                  This is a secure document
                </Label>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="access-level" className="text-right">
                Access Level
              </Label>
              <select 
                id="access-level" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
              >
                <option value="all">All Family Members</option>
                <option value="limited">Limited Access</option>
                <option value="admin">Admin Only</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentsPage;
