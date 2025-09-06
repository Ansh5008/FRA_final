import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertFraClaimSchema } from "@shared/schema";
import { fraValidationService, mlAnomalyDetectionService, type ClaimValidationData, generateFRAId, generateQRCode } from "./validation";
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
      
      // Clean the data for storage and include fraId and qrCode
      const validatedData = {
        ...parsedData,
        fraId,
        qrCode,
        uploadedFiles: parsedData.uploadedFiles?.filter(Boolean) || [],
        aiFlags: parsedData.aiFlags?.filter(Boolean) || [],
        documents: parsedData.documents?.filter(Boolean) || []
      };
      
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

  // ML-based duplicate application detection
  app.post("/api/detect-duplicates", async (req, res) => {
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

      const duplicateAnalysis = await mlAnomalyDetectionService.detectDuplicateApplications(claimData);
      
      res.json({
        success: true,
        data: duplicateAnalysis
      });
    } catch (error) {
      console.error('Duplicate detection error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to detect duplicates",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Document similarity detection
  app.post("/api/detect-document-similarity", async (req, res) => {
    try {
      const { documents } = req.body;
      
      if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({
          success: false,
          message: "Documents array is required"
        });
      }

      const similarityAnalysis = await mlAnomalyDetectionService.detectDocumentSimilarity(documents);
      
      res.json({
        success: true,
        data: similarityAnalysis
      });
    } catch (error) {
      console.error('Document similarity error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to detect document similarity",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get claims data for map visualization
  app.get("/api/claims-map-data", async (req, res) => {
    try {
      const claimsData = mlAnomalyDetectionService.getClaimsForMap();
      
      res.json({
        success: true,
        data: claimsData,
        total: claimsData.length
      });
    } catch (error) {
      console.error('Claims map data error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get claims map data"
      });
    }
  });

  // Enhanced claim validation with ML anomaly detection
  app.post("/api/validate-claim-advanced", async (req, res) => {
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

      // Run both standard validation and ML anomaly detection
      const [validationResult, duplicateAnalysis, documentAnalysis] = await Promise.all([
        fraValidationService.validateClaim(claimData),
        mlAnomalyDetectionService.detectDuplicateApplications(claimData),
        mlAnomalyDetectionService.detectDocumentSimilarity(req.body.documents || [])
      ]);
      
      res.json({
        success: true,
        data: {
          validation: validationResult,
          duplicateDetection: duplicateAnalysis,
          documentAnalysis: documentAnalysis,
          overallRiskScore: Math.max(
            duplicateAnalysis.mlScore, 
            documentAnalysis.similarityScore,
            validationResult.matchedRecord?.fraud_risk_score || 0
          ),
          recommendation: duplicateAnalysis.isDuplicate || documentAnalysis.hasSimilarDocuments
            ? "REQUIRES MANUAL REVIEW - Potential anomalies detected"
            : validationResult.isValid
            ? "APPROVED - No anomalies detected"
            : "REVIEW REQUIRED - Standard validation issues"
        }
      });
    } catch (error) {
      console.error('Advanced validation error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to perform advanced validation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
