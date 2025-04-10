import { Document } from "@shared/schema";
import { format } from "date-fns";

interface DocumentItemProps {
  document: Document;
  onDownload?: (document: Document) => void;
}

const DocumentItem = ({ document, onDownload }: DocumentItemProps) => {
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
    if (document.isSecure) {
      return "bg-neutral-200 dark:bg-neutral-700";
    }
    
    switch (document.documentType) {
      case "pdf":
        return "bg-primary/10";
      case "image":
      case "zip":
        return "bg-secondary/10";
      default:
        return "bg-primary/10";
    }
  };
  
  // Get text color class based on document type
  const getTextColorClass = () => {
    if (document.isSecure) {
      return "text-neutral-500 dark:text-neutral-400";
    }
    
    switch (document.documentType) {
      case "pdf":
        return "text-primary";
      case "image":
      case "zip":
        return "text-secondary";
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

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
      <div className={`rounded-lg p-2 mr-3 ${getDocumentColorClass()}`}>
        <i className={`fas ${getDocumentIcon()} ${getTextColorClass()}`}></i>
      </div>
      <div>
        <div className="font-medium text-sm">{document.title}</div>
        {document.isSecure ? (
          <div className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center">
            <i className="fas fa-lock text-primary mr-1"></i>
            <span>{document.accessLevel === "admin" ? "Admin access only" : "Limited access"}</span>
          </div>
        ) : (
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            Uploaded {formatTimeAgo(new Date(document.uploadedAt))}
          </div>
        )}
      </div>
      <div className="ml-auto">
        {document.isSecure ? (
          <button className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
            <i className="fas fa-key"></i>
          </button>
        ) : (
          <button 
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
            onClick={() => onDownload && onDownload(document)}
          >
            <i className="fas fa-download"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentItem;
