import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import EventCalendar from "@/components/events/EventCalendar";
import EventItem from "@/components/events/EventItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EventsPage = () => {
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  
  // Get events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
  });
  
  // Get upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["/api/events/upcoming"],
  });
  
  const handleAddEvent = () => {
    setIsAddEventOpen(true);
  };

  return (
    <>
      <header className="flex justify-between items-center mb-6">
        <h1 className="font-montserrat font-bold text-2xl">Events</h1>
        <div className="flex items-center space-x-4">
          <button 
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg flex items-center"
            onClick={handleAddEvent}
          >
            <i className="fas fa-plus mr-2"></i>
            <span>Add Event</span>
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="font-montserrat font-medium">Event Calendar</div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="text-neutral-500">Loading events...</div>
                </div>
              ) : (
                <EventCalendar events={events} />
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="font-montserrat font-medium">All Events</div>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-neutral-500">Loading events...</div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No events found. Click "Add Event" to create one.
                </div>
              ) : (
                events.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-neutral-100 rounded-xl shadow-md overflow-hidden sticky top-6">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="font-montserrat font-medium">Upcoming Events</div>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-neutral-500">Loading upcoming events...</div>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No upcoming events.
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <EventItem key={event.id} event={event} />
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-neutral-200">
              <button 
                className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium"
                onClick={handleAddEvent}
              >
                Create New Event
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Add a new event to your family calendar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input id="title" placeholder="Event title" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event-type" className="text-right">
                Type
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="reunion">Family Reunion</SelectItem>
                  <SelectItem value="graduation">Graduation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" type="date" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input id="time" type="time" className="col-span-3" />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea id="description" placeholder="Event details" className="col-span-3" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
              Cancel
            </Button>
            <Button>Save Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventsPage;
