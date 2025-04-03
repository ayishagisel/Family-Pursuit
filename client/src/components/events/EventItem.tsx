import { format } from "date-fns";
import { Event } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface EventItemProps {
  event: Event;
}

const EventItem = ({ event }: EventItemProps) => {
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

  return (
    <div className="flex items-center p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
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
  );
};

export default EventItem;
