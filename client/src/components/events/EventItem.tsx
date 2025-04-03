import { format } from "date-fns";
import { Event } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EventItemProps {
  event: Event;
}

const EventItem = ({ event }: EventItemProps) => {
  const [isViewEventOpen, setIsViewEventOpen] = useState(false);

  // Get icon based on event type
  const getEventIcon = () => {
    switch (event.eventType) {
      case "birthday":
        return "fa-birthday-cake";
      case "reunion":
        return "fa-users";
      case "graduation":
        return "fa-graduation-cap";
      default:
        return "fa-calendar-day";
    }
  };
  
  // Get background color based on event type
  const getEventColorClass = () => {
    switch (event.eventType) {
      case "birthday":
        return "bg-primary/10";
      case "reunion":
        return "bg-accent/10";
      case "graduation":
        return "bg-secondary/10";
      default:
        return "bg-primary/10";
    }
  };
  
  // Get text color based on event type
  const getEventTextColorClass = () => {
    switch (event.eventType) {
      case "birthday":
        return "text-primary";
      case "reunion":
        return "text-accent";
      case "graduation":
        return "text-secondary";
      default:
        return "text-primary";
    }
  };

  const handleAttendEvent = () => {
    // This would be connected to an API call in a real implementation
    // For now, just close the dialog
    setIsViewEventOpen(false);
  };

  // Open the event details when clicked
  const handleViewEvent = () => {
    setIsViewEventOpen(true);
  };

  return (
    <>
      <div 
        className="flex items-center p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        onClick={handleViewEvent}
        role="button"
        aria-label={`View details for ${event.title}`}
      >
        <div className={`rounded-lg p-2 mr-3 ${getEventColorClass()}`}>
          <i className={`fas ${getEventIcon()} ${getEventTextColorClass()}`}></i>
        </div>
        <div>
          <div className="font-medium text-sm">{event.title}</div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {format(new Date(event.date), 'MMM d, yyyy')}
          </div>
        </div>
        <div 
          className={`ml-auto text-xs ${getEventColorClass()} ${getEventTextColorClass()} px-2 py-1 rounded-full`}
        >
          {Array.isArray(event.attendees) ? event.attendees.length : 0} attending
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isViewEventOpen} onOpenChange={setIsViewEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center mb-3">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${getEventColorClass()}`}>
                <i className={`fas ${getEventIcon()} ${getEventTextColorClass()}`}></i>
              </div>
              <div className="text-sm font-medium">{event.eventType}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-neutral-500">Date</div>
                <div className="text-sm">{format(new Date(event.date), 'MMMM d, yyyy')}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Time</div>
                <div className="text-sm">All day</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs text-neutral-500">Description</div>
              <div className="text-sm">{event.description || 'No description available.'}</div>
            </div>
            
            <div>
              <div className="text-xs text-neutral-500 mb-1">Attendees ({Array.isArray(event.attendees) ? event.attendees.length : 0})</div>
              {Array.isArray(event.attendees) && event.attendees.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {event.attendees.map((attendeeId) => (
                    <div key={attendeeId} className="bg-neutral-100 rounded-full px-2 py-1 text-xs">
                      User {attendeeId}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-neutral-500">No attendees yet</div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewEventOpen(false)}>
              Close
            </Button>
            <Button onClick={handleAttendEvent}>
              {Array.isArray(event.attendees) && event.attendees.includes(1) ? 'Cancel Attendance' : 'Attend Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventItem;
