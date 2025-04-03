import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { Event } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EventItem from "./EventItem";

interface EventCalendarProps {
  events: Event[];
}

const EventCalendar = ({ events }: EventCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add days from previous and next month to fill the calendar grid
  const startDay = getDay(monthStart);
  const endDay = getDay(monthEnd);
  
  const prevMonthDays = startDay > 0 
    ? eachDayOfInterval({ 
        start: subMonths(monthStart, 1), 
        end: subMonths(monthStart, 1) 
      }).slice(-startDay)
    : [];
  
  const nextMonthDays = 6 - endDay > 0 
    ? eachDayOfInterval({ 
        start: addMonths(monthStart, 1), 
        end: addMonths(monthStart, 1) 
      }).slice(0, 6 - endDay)
    : [];
  
  const allDays = [...prevMonthDays, ...calendarDays, ...nextMonthDays];
  
  // Check if a day has events
  const hasEventsOnDay = (day: Date) => {
    return events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day.getDate() && 
             eventDate.getMonth() === day.getMonth() && 
             eventDate.getFullYear() === day.getFullYear();
    });
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day.getDate() && 
             eventDate.getMonth() === day.getMonth() && 
             eventDate.getFullYear() === day.getFullYear();
    });
  };

  // Handle day click to show events for that day
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDateDialogOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button 
          className="text-neutral-800 dark:text-neutral-100"
          onClick={prevMonth}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="font-medium">{format(currentMonth, 'MMMM yyyy')}</div>
        <button 
          className="text-neutral-800 dark:text-neutral-100"
          onClick={nextMonth}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">S</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">M</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">T</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">W</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">T</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">F</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">S</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {allDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const dayHasEvents = hasEventsOnDay(day);
          
          return (
            <div 
              key={index} 
              className={`
                calendar-day text-sm py-1
                ${!isCurrentMonth ? 'text-neutral-400' : ''}
                ${isDayToday ? 'bg-accent/20 rounded-full font-medium' : ''}
                ${dayHasEvents ? 'has-event font-medium text-primary' : ''}
                ${isCurrentMonth ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer' : ''}
                transition-colors
              `}
              onClick={() => isCurrentMonth && handleDayClick(day)}
              role={isCurrentMonth ? "button" : undefined}
              aria-label={isCurrentMonth ? `View events for ${format(day, 'MMMM d, yyyy')}` : undefined}
            >
              {format(day, 'd')}
              {dayHasEvents && <div className="w-1 h-1 bg-primary rounded-full mx-auto mt-1"></div>}
            </div>
          );
        })}
      </div>

      {/* Day Events Dialog */}
      {selectedDate && (
        <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Events on {format(selectedDate, 'MMMM d, yyyy')}</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {getEventsForDay(selectedDate).length > 0 ? (
                getEventsForDay(selectedDate).map(event => (
                  <EventItem key={event.id} event={event} />
                ))
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No events scheduled for this day.
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsDateDialogOpen(false);
                // This would normally open the Add Event dialog with the date pre-filled
              }}>
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventCalendar;
