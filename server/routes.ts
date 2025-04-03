import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertFamilyMemberSchema, 
  insertRelationshipSchema,
  insertEventSchema,
  insertDocumentSchema,
  insertHelpRequestSchema,
  insertMessageSchema 
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Family Members API
  app.get("/api/family-members", async (req: Request, res: Response) => {
    try {
      const members = await storage.getAllFamilyMembers();
      res.json(members);
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ message: "Failed to fetch family members" });
    }
  });

  app.get("/api/family-members/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const member = await storage.getFamilyMember(id);
      if (!member) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.json(member);
    } catch (error) {
      console.error("Error fetching family member:", error);
      res.status(500).json({ message: "Failed to fetch family member" });
    }
  });

  app.post("/api/family-members", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFamilyMemberSchema.parse(req.body);
      const newMember = await storage.createFamilyMember(validatedData);
      res.status(201).json(newMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error creating family member:", error);
      res.status(500).json({ message: "Failed to create family member" });
    }
  });

  app.put("/api/family-members/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = insertFamilyMemberSchema.partial().parse(req.body);
      const updatedMember = await storage.updateFamilyMember(id, validatedData);
      
      if (!updatedMember) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.json(updatedMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error updating family member:", error);
      res.status(500).json({ message: "Failed to update family member" });
    }
  });

  app.delete("/api/family-members/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteFamilyMember(id);
      
      if (!success) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting family member:", error);
      res.status(500).json({ message: "Failed to delete family member" });
    }
  });

  // Relationships API
  app.get("/api/relationships", async (req: Request, res: Response) => {
    try {
      const relationships = await storage.getAllRelationships();
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });

  app.post("/api/relationships", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRelationshipSchema.parse(req.body);
      const newRelationship = await storage.createRelationship(validatedData);
      res.status(201).json(newRelationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error creating relationship:", error);
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  app.put("/api/relationships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = insertRelationshipSchema.partial().parse(req.body);
      const updatedRelationship = await storage.updateRelationship(id, validatedData);
      
      if (!updatedRelationship) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      
      res.json(updatedRelationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error updating relationship:", error);
      res.status(500).json({ message: "Failed to update relationship" });
    }
  });

  app.delete("/api/relationships/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteRelationship(id);
      
      if (!success) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting relationship:", error);
      res.status(500).json({ message: "Failed to delete relationship" });
    }
  });

  // Events API
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/upcoming", async (req: Request, res: Response) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const newEvent = await storage.createEvent(validatedData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.post("/api/events/:id/attendees/:userId", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(eventId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedEvent = await storage.addAttendee(eventId, userId);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error adding attendee:", error);
      res.status(500).json({ message: "Failed to add attendee" });
    }
  });

  app.delete("/api/events/:id/attendees/:userId", async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(eventId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedEvent = await storage.removeAttendee(eventId, userId);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error removing attendee:", error);
      res.status(500).json({ message: "Failed to remove attendee" });
    }
  });

  // Documents API
  app.get("/api/documents", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/secure", async (req: Request, res: Response) => {
    try {
      const documents = await storage.getSecureDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching secure documents:", error);
      res.status(500).json({ message: "Failed to fetch secure documents" });
    }
  });

  app.post("/api/documents", async (req: Request, res: Response) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const newDocument = await storage.createDocument(validatedData);
      res.status(201).json(newDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Help Requests API
  app.get("/api/help-requests", async (req: Request, res: Response) => {
    try {
      const helpRequests = await storage.getAllHelpRequests();
      res.json(helpRequests);
    } catch (error) {
      console.error("Error fetching help requests:", error);
      res.status(500).json({ message: "Failed to fetch help requests" });
    }
  });

  app.post("/api/help-requests", async (req: Request, res: Response) => {
    try {
      const validatedData = insertHelpRequestSchema.parse(req.body);
      const newHelpRequest = await storage.createHelpRequest(validatedData);
      res.status(201).json(newHelpRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error creating help request:", error);
      res.status(500).json({ message: "Failed to create help request" });
    }
  });

  app.post("/api/help-requests/:id/volunteers/:userId", async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(requestId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedRequest = await storage.addVolunteer(requestId, userId);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error adding volunteer:", error);
      res.status(500).json({ message: "Failed to add volunteer" });
    }
  });

  app.delete("/api/help-requests/:id/volunteers/:userId", async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(requestId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedRequest = await storage.removeVolunteer(requestId, userId);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Help request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error removing volunteer:", error);
      res.status(500).json({ message: "Failed to remove volunteer" });
    }
  });

  // Messages API
  app.get("/api/messages/received/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const messages = await storage.getMessagesByReceiver(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching received messages:", error);
      res.status(500).json({ message: "Failed to fetch received messages" });
    }
  });

  app.get("/api/messages/sent/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const messages = await storage.getMessagesBySender(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching sent messages:", error);
      res.status(500).json({ message: "Failed to fetch sent messages" });
    }
  });

  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const newMessage = await storage.createMessage(validatedData);
      res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.post("/api/messages/:id/read", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedMessage = await storage.markMessageAsRead(id);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
