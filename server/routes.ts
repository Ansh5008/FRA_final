import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertFraClaimSchema } from "@shared/schema";
import { fraValidationService, type ClaimValidationData, generateFRAId, generateQRCode } from "./validation";
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
      const parsedData = insertFraClaimSchema.parse(req.body);
      
      // Generate unique FRA ID
      const fraId = generateFRAId();
      
      // Generate QR code for the FRA ID
      const qrCode = await generateQRCode(fraId);
      
      // Clean the data for storage
      const validatedData = {
        ...parsedData,
        uploadedFiles: parsedData.uploadedFiles?.filter(Boolean) || [],
        aiFlags: parsedData.aiFlags?.filter(Boolean) || []
      };
      
      const claim = await storage.createFraClaim(validatedData);
      
      // Add FRA ID and QR code to response
      const claimWithFRAData = {
        ...claim,
        fraId,
        qrCode
      };
      
      res.json({ 
        success: true, 
        message: "FRA claim submitted successfully",
        data: claimWithFRAData
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

  // Validation endpoints
  app.post("/api/validate-claim", async (req, res) => {
    try {
      const claimData: ClaimValidationData = {
        aadhaarId: req.body.aadhaarId,
        beneficiaryName: req.body.beneficiaryName,
        age: req.body.age ? parseInt(req.body.age) : undefined,
        landArea: req.body.landArea,
        state: req.body.state,
        district: req.body.district,
        village: req.body.village,
      };

      const validationResult = await fraValidationService.validateClaim(claimData);
      
      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to validate claim",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get similar records for a claim
  app.post("/api/find-similar", async (req, res) => {
    try {
      const claimData: ClaimValidationData = {
        aadhaarId: req.body.aadhaarId,
        beneficiaryName: req.body.beneficiaryName,
        age: req.body.age ? parseInt(req.body.age) : undefined,
        landArea: req.body.landArea,
        state: req.body.state,
        district: req.body.district,
        village: req.body.village,
      };

      const similarRecords = await fraValidationService.findSimilarRecords(claimData);
      
      res.json({
        success: true,
        data: similarRecords
      });
    } catch (error) {
      console.error('Similar records error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to find similar records"
      });
    }
  });

  // Get dataset statistics
  app.get("/api/dataset-stats", async (req, res) => {
    try {
      const stats = fraValidationService.getDatasetStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Dataset stats error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get dataset statistics"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
