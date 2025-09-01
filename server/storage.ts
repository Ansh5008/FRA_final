import { type User, type InsertUser, type ContactMessage, type InsertContactMessage, type FraClaim, type InsertFraClaim } from "@shared/schema";
import { randomUUID } from "crypto";

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
    const user: User = { ...insertUser, id };
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

  async updateFraClaimStatus(id: string, status: string): Promise<FraClaim | undefined> {
    const claim = this.fraClaims.get(id);
    if (claim) {
      claim.status = status;
      claim.updatedAt = new Date();
      this.fraClaims.set(id, claim);
      return claim;
    }
    return undefined;
  }

  private seedSampleData() {
    // Sample FRA claims for demonstration
    const sampleClaims = [
      {
        beneficiaryName: "Ramesh Oraon",
        village: "Bansjore",
        district: "Ranchi",
        state: "Jharkhand",
        claimType: "Individual Forest Right",
        landArea: "2 acres",
        documents: ["Aadhaar card", "land sketch", "Gram Sabha resolution"],
        coordinates: "23.3441,85.3096",
        status: "approved"
      },
      {
        beneficiaryName: "Sita Munda",
        village: "Khunti",
        district: "Khunti",
        state: "Jharkhand",
        claimType: "Community Forest Right",
        landArea: "15 acres",
        documents: ["Community certificate", "village map", "Gram Sabha resolution"],
        coordinates: "23.0722,85.2789",
        status: "pending"
      },
      {
        beneficiaryName: "Kiran Tirkey",
        village: "Gumla",
        district: "Gumla",
        state: "Jharkhand",
        claimType: "Individual Forest Right",
        landArea: "1.5 acres",
        documents: ["Aadhaar card", "village certificate"],
        coordinates: "23.0441,84.5391",
        status: "rejected"
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
