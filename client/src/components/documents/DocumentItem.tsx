import { Document } from "@shared/schema";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DocumentItemProps {
  document: Document;
  onDownload?: (document: Document) => void;
}

const DocumentItem = ({ document, onDownload }: DocumentItemProps) => {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  // Get icon based on document type
  const getDocumentIcon = () => {
    switch (document.documentType) {
      case "pdf":
        return "fa-file-pdf";
      case "image":
      case "zip":
        return "fa-file-image";
      case "contract":
        return "fa-file-contract";
      case "legal":
        return "fa-file-signature";
      case "medical":
        return "fa-file-medical";
      default:
        return "fa-file";
    }
  };
  
  // Get color class based on document type
  const getDocumentColorClass = () => {
    if (document.isSecure === true) {
      return "bg-neutral-200 dark:bg-neutral-700";
    }
    
    switch (document.documentType) {
      case "pdf":
        return "bg-primary/10";
      case "image":
      case "zip":
        return "bg-secondary/10";
      case "legal":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      case "medical":
        return "bg-red-100 dark:bg-red-900/30";
      case "contract":
        return "bg-blue-100 dark:bg-blue-900/30";
      default:
        return "bg-primary/10";
    }
  };
  
  // Get text color class based on document type
  const getTextColorClass = () => {
    if (document.isSecure === true) {
      return "text-neutral-500 dark:text-neutral-400";
    }
    
    switch (document.documentType) {
      case "pdf":
        return "text-primary";
      case "image":
      case "zip":
        return "text-secondary";
      case "legal":
        return "text-yellow-600 dark:text-yellow-400";
      case "medical":
        return "text-red-600 dark:text-red-400";
      case "contract":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-primary";
    }
  };
  
  // Format the time ago string
  const formatTimeAgo = (date: Date) => {
    if (!date) return "Unknown date";
    
    try {
      // Ensure date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return `${days} days ago`;
      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date format";
    }
  };

  // Function to render document preview based on document type
  const renderDocumentPreview = () => {
    // For the demo, we'll show a placeholder for different document types
    switch (document.documentType) {
      case "image":
        return (
          <div className="flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md h-64 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-image text-6xl text-neutral-400"></i>
            </div>
            <p className="text-neutral-500 text-sm">Sample image preview for: {document.title}</p>
          </div>
        );
      case "legal":
      case "financial":
      case "medical":
      case "intellectual":
        return (
          <div className="p-6">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2">{document.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                Document ID: {document.id}<br />
                Type: {document.documentType}<br />
                Created: {new Date(document.created_at).toLocaleDateString()}
              </p>
              <div className="border-l-4 border-primary pl-3 italic text-neutral-500">
                This is a preview of the {document.documentType} document content. In a production environment, 
                this would display the actual document content from the server.
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 text-center">
            <div className="mb-4 text-6xl">
              <i className={`fas ${getDocumentIcon()} ${getTextColorClass()}`}></i>
            </div>
            <h3 className="font-bold mb-2">{document.title}</h3>
            <p className="text-neutral-500">
              This document type cannot be previewed directly. You can download it to view its contents.
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        className="flex items-center p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        onClick={() => setIsViewDialogOpen(true)}
      >
        <div className={`rounded-lg p-2 mr-3 ${getDocumentColorClass()}`}>
          <i className={`fas ${getDocumentIcon()} ${getTextColorClass()}`}></i>
        </div>
        <div>
          <div className="font-medium text-sm">{document.title}</div>
          {document.isSecure === true ? (
            <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center">
              <i className="fas fa-lock text-primary mr-1"></i>
              <span>{document.accessLevel === "admin" ? "Admin access only" : "Limited access"}</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {document.uploadedAt ? 
                `Uploaded ${formatTimeAgo(new Date(document.uploadedAt))}` : 
                `Added ${formatTimeAgo(new Date(document.created_at))}`
              }
            </div>
          )}
        </div>
        <div className="ml-auto">
          {document.isSecure === true ? (
            <button 
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening the view dialog
                // Handle secure document access
              }}
            >
              <i className="fas fa-key"></i>
            </button>
          ) : (
            <button 
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening the view dialog
                onDownload && onDownload(document);
              }}
            >
              <i className="fas fa-download"></i>
            </button>
          )}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{document.title}</DialogTitle>
          </DialogHeader>
          
          {renderDocumentPreview()}
          
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              {!document.isSecure && (
                <Button
                  variant="outline"
                  onClick={() => onDownload && onDownload(document)}
                >
                  <i className="fas fa-download mr-2"></i>
                  Download
                </Button>
              )}
              <Button onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentItem;
