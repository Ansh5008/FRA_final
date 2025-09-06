import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type FraClaim, type InsertFraClaim } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  createFraClaim(claim: InsertFraClaim): Promise<FraClaim>;
  getFraClaims(): Promise<FraClaim[]>;
  getFraClaimById(id: string): Promise<FraClaim | undefined>;
  updateFraClaimStatus(id: string, status: string): Promise<FraClaim | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private contactMessages: Map<string, ContactMessage>;
  private fraClaims: Map<string, FraClaim>;

  constructor() {
    this.users = new Map();
    this.contactMessages = new Map();
    this.fraClaims = new Map();
    this.seedSampleData();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || 'user', 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = { 
      ...insertMessage, 
      id,
      createdAt: new Date()
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createFraClaim(insertClaim: InsertFraClaim): Promise<FraClaim> {
    const id = randomUUID();
    const claimId = `FRA${Math.floor(Math.random() * 90000) + 10000}`;
    const claim: FraClaim = {
      ...insertClaim,
      id,
      claimId,
      status: "pending",
      coordinates: insertClaim.coordinates || null,
      fraId: insertClaim.fraId,
      qrCode: insertClaim.qrCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fraClaims.set(id, claim);
    return claim;
  }

  async getFraClaims(): Promise<FraClaim[]> {
    return Array.from(this.fraClaims.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getFraClaimById(id: string): Promise<FraClaim | undefined> {
    return this.fraClaims.get(id);
  }

  async updateFraClaimStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<FraClaim | undefined> {
    const claim = this.fraClaims.get(id);
    if (claim) {
      claim.status = status as "pending" | "approved" | "rejected";
      claim.updatedAt = new Date();
      this.fraClaims.set(id, claim);
      return claim;
    }
    return undefined;
  }

  private seedSampleData() {
    this.loadDataFromCSV();
  }

  private loadDataFromCSV() {
    try {
      const csvPath = path.resolve(process.cwd(), "attached_assets", "fra_dataset_selectedstates_randomvillages_1757146040426.csv");
      
      if (!fs.existsSync(csvPath)) {
        console.log("CSV file not found, using default sample data");
        this.loadDefaultSampleData();
        return;
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      
      // Load a reasonable number of records (first 50 for performance)
      for (let i = 1; i < Math.min(lines.length, 51); i++) {
        const values = lines[i].split(',');
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });

        // Map the application status to our schema
        let status: "pending" | "approved" | "rejected" = "pending";
        if (record.application_status?.toLowerCase().includes("approved")) {
          status = "approved";
        } else if (record.application_status?.toLowerCase().includes("rejected")) {
          status = "rejected";
        }

        // Generate some sample coordinates for visualization
        const baseCoords = this.getBaseCoordinatesForState(record.state);
        const coordinates = `${baseCoords.lat + (Math.random() - 0.5) * 2},${baseCoords.lng + (Math.random() - 0.5) * 2}`;

        const id = randomUUID();
        const fraClaim: FraClaim = {
          id,
          claimId: record.application_id || `FRA${Math.floor(Math.random() * 90000) + 10000}`,
          beneficiaryName: record.applicant_name || "Unknown",
          village: record.village || "Unknown",
          district: record.district || "Unknown",
          state: record.state || "Unknown",
          claimType: record.claim_type === "Community Forest Right" ? "Community Forest Right" : "Individual Forest Right",
          landArea: `${record.land_area_requested_acres} acres`,
          landType: record.land_type || "Agricultural", // New field for land type
          documents: [record.caste_certificate === "True" ? "Caste Certificate" : "", "Aadhaar ID", "Application Form"].filter(Boolean),
          coordinates,
          status,
          createdAt: new Date(record.application_date || Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          aiScore: parseFloat(record.eligibility_confidence_score) || 0,
          aiFlags: []
        };
        
        this.fraClaims.set(id, fraClaim);
      }
      
      console.log(`FRA Dataset loaded: ${this.fraClaims.size} records`);
    } catch (error) {
      console.error("Error loading CSV data:", error);
      this.loadDefaultSampleData();
    }
  }

  private getBaseCoordinatesForState(state: string): { lat: number; lng: number } {
    const stateCoords: Record<string, { lat: number; lng: number }> = {
      "Madhya Pradesh": { lat: 23.4734, lng: 77.9471 },
      "Tripura": { lat: 23.9408, lng: 91.9882 },
      "Odisha": { lat: 20.9517, lng: 85.0985 },
      "Telangana": { lat: 18.1124, lng: 79.0193 },
      "Jharkhand": { lat: 23.6102, lng: 85.2799 }
    };
    return stateCoords[state] || { lat: 23.0, lng: 85.0 };
  }

  private loadDefaultSampleData() {
    const sampleClaims = [
      {
        beneficiaryName: "Ramesh Oraon",
        village: "Bansjore",
        district: "Ranchi",
        state: "Jharkhand",
        claimType: "Individual Forest Right" as const,
        landArea: "2 acres",
        landType: "Agricultural",
        documents: ["Aadhaar card", "land sketch", "Gram Sabha resolution"],
        coordinates: "23.3441,85.3096",
        status: "approved" as const
      },
      {
        beneficiaryName: "Sita Munda",
        village: "Khunti",
        district: "Khunti",
        state: "Jharkhand",
        claimType: "Community Forest Right" as const,
        landArea: "15 acres",
        landType: "Community Forest Resource",
        documents: ["Community certificate", "village map", "Gram Sabha resolution"],
        coordinates: "23.0722,85.2789",
        status: "pending" as const
      },
      {
        beneficiaryName: "Kiran Tirkey",
        village: "Gumla",
        district: "Gumla",
        state: "Jharkhand",
        claimType: "Individual Forest Right" as const,
        landArea: "1.5 acres",
        landType: "Water Bodies",
        documents: ["Aadhaar card", "village certificate"],
        coordinates: "23.0441,84.5391",
        status: "rejected" as const
      }
    ];

    sampleClaims.forEach(claim => {
      const id = randomUUID();
      const claimId = `FRA${Math.floor(Math.random() * 90000) + 10000}`;
      const fraClaim: FraClaim = {
        ...claim,
        id,
        claimId,
        coordinates: claim.coordinates || null,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      };
      this.fraClaims.set(id, fraClaim);
    });
  }
}

export const storage = new MemStorage();
