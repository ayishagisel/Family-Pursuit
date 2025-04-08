import type { Express, Request, Response, NextFunction } from "express";
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
import { aiService } from "./services/aiService";
import { hashPassword, verifyPassword, generateToken } from "./services/authService";
import { authenticate, requireAdmin } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication API
  
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email, name } = req.body;
      
      if (!username || !password || !email || !name) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: "member",
        is_active: true,
      });
      
      // Generate token
      const token = generateToken(newUser);
      
      console.log(`User registered successfully: ${username}`);
      
      // Return user data without password and token
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Missing credentials" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const passwordValid = await verifyPassword(password, user.password);
      if (!passwordValid) {
        console.log(`Failed login attempt for user: ${username}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate token
      const token = generateToken(user);
      
      // Update last login
      // No storage implementation for this yet, but could be added
      
      console.log(`User logged in successfully: ${username}`);
      
      // Return user data without password and token
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  // Get current user (protected route)
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      // User is attached to request by authenticate middleware
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // Administrative route example (protected + admin only)
  app.get("/api/admin/users", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      // This would be a call to get all users, not implemented yet
      // const users = await storage.getAllUsers();
      res.json({ message: "Admin access successful" });
    } catch (error) {
      console.error("Error in admin route:", error);
      res.status(500).json({ message: "Failed to process admin request" });
    }
  });
  
  // We're not using this old AI validation function, just providing a simple response
  app.post("/api/validate/family-member", async (req: Request, res: Response) => {
    try {
      const { name, role, relationship } = req.body;
      
      if (!name || !role || !relationship) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          fields: { name, role, relationship }
        });
      }
      
      // Return a simple validation result - no AI validation needed here
      res.json({
        isValid: true,
        issues: []
      });
    } catch (error) {
      console.error("Error validating family member data:", error);
      res.status(500).json({ 
        message: "Failed to validate family member data",
        isValid: true, // Default to true in case of error to not block the form
        issues: ["Validation service unavailable"]
      });
    }
  });

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
      // Check if the client wants a flat list or hierarchical structure
      const format = req.query.format as string || 'hierarchical';
      
      if (format === 'flat') {
        // Return the traditional flat list of relationships if specifically requested
        console.log("Fetching flat relationships list as requested");
        const relationships = await storage.getAllRelationships();
        res.json(relationships);
      } else {
        // By default, return the hierarchical family structure
        console.log("Fetching hierarchical family structure for relationships endpoint");
        
        // Get visualization type from query parameters
        const visualizationType = req.query.type as string || 'hierarchical';
        const rootMemberId = req.query.root ? parseInt(req.query.root as string) : undefined;
        
        // Log the request parameters
        console.log(`Visualization type: ${visualizationType}, Root member ID: ${rootMemberId || 'none'}`);
        
        // Get the hierarchical structure
        const hierarchicalStructure = await storage.getHierarchicalFamilyStructure();
        
        // Apply filters based on visualization type
        let filteredStructure = hierarchicalStructure;
        
        if (visualizationType === 'ancestor' && rootMemberId) {
          console.log(`Filtering for ancestors of member ${rootMemberId}`);
          filteredStructure = filterForAncestors(hierarchicalStructure, rootMemberId);
        } 
        else if (visualizationType === 'descendant' && rootMemberId) {
          console.log(`Filtering for descendants of member ${rootMemberId}`);
          filteredStructure = filterForDescendants(hierarchicalStructure, rootMemberId);
        }
        else if (visualizationType === 'sociogram') {
          console.log('Preparing sociogram visualization data');
          filteredStructure = prepareForSociogram(hierarchicalStructure);
        }
        
        res.json(filteredStructure);
      }
    } catch (error) {
      console.error("Error fetching relationships:", error);
      res.status(500).json({ message: "Failed to fetch relationships" });
    }
  });
  
  // Dedicated endpoints for hierarchical family structure
  app.get("/api/family/hierarchical", async (req: Request, res: Response) => {
    try {
      console.log("Fetching hierarchical family structure from dedicated endpoint");
      
      // Get visualization type from query parameters (default to full hierarchical)
      const visualizationType = req.query.type as string || 'hierarchical';
      const rootMemberId = req.query.root ? parseInt(req.query.root as string) : undefined;
      
      // Log the request parameters
      console.log(`Visualization type: ${visualizationType}, Root member ID: ${rootMemberId || 'none'}`);
      
      // Get the hierarchical structure
      const hierarchicalStructure = await storage.getHierarchicalFamilyStructure();
      
      // If we have a filter for specific visualization type, apply it
      let filteredStructure = hierarchicalStructure;
      
      if (visualizationType === 'ancestor' && rootMemberId) {
        // For ancestor chart, filter to include only the ancestors of the specified member
        console.log(`Filtering for ancestors of member ${rootMemberId}`);
        filteredStructure = filterForAncestors(hierarchicalStructure, rootMemberId);
      } 
      else if (visualizationType === 'descendant' && rootMemberId) {
        // For descendant chart, filter to include only the descendants of the specified member
        console.log(`Filtering for descendants of member ${rootMemberId}`);
        filteredStructure = filterForDescendants(hierarchicalStructure, rootMemberId);
      }
      else if (visualizationType === 'sociogram') {
        // For sociogram, keep all relationships but reorganize for network visualization
        console.log('Preparing sociogram visualization data');
        filteredStructure = prepareForSociogram(hierarchicalStructure);
      }
      
      // Return the appropriate data structure based on visualization type
      res.json(filteredStructure);
      
    } catch (error) {
      console.error("Error fetching hierarchical family structure:", error);
      res.status(500).json({ message: "Failed to fetch hierarchical family structure" });
    }
  });
  
  // Helper function to filter structure for ancestor chart
  function filterForAncestors(members: any[], rootId: number): any[] {
    // Find the root member
    const rootMember = members.find(m => m.id === rootId);
    if (!rootMember) return members;
    
    // Get all parent IDs
    const ancestorIds = new Set<number>();
    
    // Recursively collect all ancestors
    function collectAncestors(member: any) {
      if (!member || !member.parents) return;
      
      member.parents.forEach((parent: any) => {
        ancestorIds.add(parent.id);
        const parentMember = members.find(m => m.id === parent.id);
        if (parentMember) {
          collectAncestors(parentMember);
        }
      });
    }
    
    // Start collection from the root member
    collectAncestors(rootMember);
    
    // Add the root member to the set
    ancestorIds.add(rootId);
    
    // Filter the members to include only ancestors and the root
    return members.filter(member => ancestorIds.has(member.id));
  }
  
  // Helper function to filter structure for descendant chart
  function filterForDescendants(members: any[], rootId: number): any[] {
    // Find the root member
    const rootMember = members.find(m => m.id === rootId);
    if (!rootMember) return members;
    
    // Get all descendant IDs
    const descendantIds = new Set<number>();
    
    // Recursively collect all descendants
    function collectDescendants(member: any) {
      if (!member || !member.children) return;
      
      member.children.forEach((child: any) => {
        descendantIds.add(child.id);
        const childMember = members.find(m => m.id === child.id);
        if (childMember) {
          collectDescendants(childMember);
        }
      });
    }
    
    // Start collection from the root member
    collectDescendants(rootMember);
    
    // Add the root member to the set
    descendantIds.add(rootId);
    
    // Filter the members to include only descendants and the root
    return members.filter(member => descendantIds.has(member.id));
  }
  
  // Helper function to prepare data for sociogram visualization
  function prepareForSociogram(members: any[]): any {
    // Extract nodes and links for a network diagram
    const nodes = members.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      avatarUrl: member.avatarUrl,
      childrenCount: member.childrenCount || 0,
      siblingsCount: member.siblingsCount || 0,
      extendedCount: member.extendedCount || 0,
      generation: member.generation || 0
    }));
    
    // Create links from all relationships
    const links: Array<{source: number, target: number, type: string, category: string}> = [];
    
    members.forEach(member => {
      // Add spouse links
      member.spouses?.forEach((spouse: any) => {
        links.push({
          source: member.id,
          target: spouse.id,
          type: 'spouse',
          category: spouse.relation_category || 'immediate'
        });
      });
      
      // Add parent-child links
      member.children?.forEach((child: any) => {
        links.push({
          source: member.id,
          target: child.id,
          type: child.relationship_type,
          category: child.relation_category || 'immediate'
        });
      });
      
      // Add sibling links
      member.siblings?.forEach((sibling: any) => {
        // Only add if source id < target id to avoid duplicates
        if (member.id < sibling.id) {
          links.push({
            source: member.id,
            target: sibling.id,
            type: sibling.relationship_type,
            category: sibling.relation_category || 'immediate'
          });
        }
      });
    });
    
    return { nodes, links };
  }

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

  // AI Analysis APIs
  
  // Analyze family relationships for insights
  app.get("/api/analyze/relationships", async (req: Request, res: Response) => {
    try {
      // Check if we have an OpenAI API key
      const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
      
      // If the key is not available, inform the client
      if (!hasOpenAIKey) {
        return res.status(400).json({ 
          message: "OpenAI API key is missing or invalid. Please set up a valid OpenAI API key in the environment variables.",
          error: true,
          missing_api_key: true
        });
      }
      
      const familyMembers = await storage.getAllFamilyMembers();
      const relationships = await storage.getAllRelationships();
      
      // Call our aiService to analyze relationships
      const analysis = await aiService.analyzeRelationships(familyMembers, relationships);
      
      // Check if there was an error in the analysis
      if (analysis.error) {
        return res.status(500).json({ 
          message: analysis.analysis,
          error: true 
        });
      }
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing relationships:", error);
      res.status(500).json({
        message: error.message || "An error occurred while analyzing the family relationships.",
        error: true
      });
    }
  });
  
  // Generate narrative for a specific family member
  app.get("/api/family-members/:id/narrative", async (req: Request, res: Response) => {
    try {
      // Check if we have an OpenAI API key
      const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
      
      // If the key is not available, inform the client
      if (!hasOpenAIKey) {
        return res.status(400).json({ 
          message: "OpenAI API key is missing or invalid. Please set up a valid OpenAI API key in the environment variables.",
          error: true,
          missing_api_key: true
        });
      }
      
      const memberId = parseInt(req.params.id);
      const member = await storage.getFamilyMember(memberId);
      
      if (!member) {
        return res.status(404).json({ error: "Family member not found" });
      }
      
      // Get all relationships and family members for context
      const relationships = await storage.getAllRelationships();
      const allMembers = await storage.getAllFamilyMembers();
      
      // Generate the narrative using our AI service
      const narrativeResult = await aiService.generateMemberNarrative(member, allMembers, relationships);
      
      // Check if there was an error in the narrative generation
      if (narrativeResult.error) {
        return res.status(500).json({ 
          message: narrativeResult.narrative,
          error: true 
        });
      }
      
      res.json(narrativeResult);
    } catch (error: any) {
      console.error("Error generating family member narrative:", error);
      res.status(500).json({
        message: error.message || "Unable to generate narrative at this time.",
        error: true
      });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
