import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertFraClaimSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const contactMessage = await storage.createContactMessage(validatedData);
      
      res.json({ 
        success: true, 
        message: "Contact message received successfully",
        id: contactMessage.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid form data",
          errors: error.errors
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error"
        });
      }
    }
  });

  // Get all contact messages (for admin purposes)
  app.get("/api/contact", async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve contact messages"
      });
    }
  });

  // FRA Claims endpoints
  app.post("/api/claims", async (req, res) => {
    try {
      const validatedData = insertFraClaimSchema.parse(req.body);
      const claim = await storage.createFraClaim(validatedData);
      
      res.json({ 
        success: true, 
        message: "FRA claim submitted successfully",
        data: claim
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid claim data",
          errors: error.errors
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error"
        });
      }
    }
  });

  app.get("/api/claims", async (req, res) => {
    try {
      const claims = await storage.getFraClaims();
      res.json({ success: true, data: claims });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve claims"
      });
    }
  });

  app.get("/api/claims/:id", async (req, res) => {
    try {
      const claim = await storage.getFraClaimById(req.params.id);
      if (!claim) {
        return res.status(404).json({ 
          success: false, 
          message: "Claim not found"
        });
      }
      res.json({ success: true, data: claim });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve claim"
      });
    }
  });

  app.patch("/api/claims/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const claim = await storage.updateFraClaimStatus(req.params.id, status);
      if (!claim) {
        return res.status(404).json({ 
          success: false, 
          message: "Claim not found"
        });
      }
      res.json({ success: true, data: claim });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to update claim status"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
