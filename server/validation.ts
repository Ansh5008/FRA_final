import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import * as QRCode from 'qrcode';

export interface FRADatasetRecord {
  application_id: string;
  family_id: string;
  aadhaar_id: string;
  applicant_name: string;
  age: number;
  gender: string;
  state: string;
  district: string;
  village: string;
  tribe: string;
  community_category: string;
  is_scheduled_tribe: boolean;
  family_size: number;
  dependents: number;
  land_area_requested_acres: number;
  land_type: string;
  has_previous_claim: boolean;
  has_aadhaar: boolean;
  has_community_proof: boolean;
  has_tribal_proof: boolean;
  has_medical_certificate: boolean;
  document_completeness: string;
  years_in_forest_area: number;
  occupation: string;
  annual_income: number;
  application_date: string;
  application_status: string;
  document_authenticity_score: number;
  eligibility_confidence_score: number;
  fraud_risk_score: number;
  gram_sabha_date?: string;
  frc_recommendation?: string;
  latitude: number;
  longitude: number;
  created_timestamp: string;
  last_updated: string;
}

export interface ValidationResult {
  isValid: boolean;
  userFound: boolean;
  eligibilityChecks: {
    ageEligible: boolean;
    landAreaEligible: boolean;
    generationEligible: boolean;
  };
  matchedRecord?: FRADatasetRecord;
  errors: string[];
  warnings: string[];
}

export interface ClaimValidationData {
  aadhaarId?: string;
  beneficiaryName: string;
  age?: number;
  landArea: string; // Will need to parse this
  state: string;
  district: string;
  village: string;
}

// FRA ID Generation utilities
export function generateFRAId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FRA-2025-${timestamp.toString().slice(-6)}-${random}`;
}

export async function generateQRCode(fraId: string): Promise<string> {
  try {
    const qrCodeData = {
      fraId,
      generatedAt: new Date().toISOString(),
      type: 'FRA_CLAIM',
      version: '1.0'
    };
    
    // Generate QR code as base64 data URL
    const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrCodeData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#2D5016', // Forest green
        light: '#F5F5DC'  // Beige background
      }
    });
    
    return qrCodeString;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

class FRAValidationService {
  private dataset: FRADatasetRecord[] = [];
  private isLoaded = false;

  constructor() {
    this.loadDataset();
  }

  private async loadDataset(): Promise<void> {
    return new Promise((resolve, reject) => {
      const csvPath = path.resolve(process.cwd(), 'attached_assets', 'fra_dataset_full_500_1757140774915.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.error('FRA dataset CSV not found at:', csvPath);
        reject(new Error('Dataset file not found'));
        return;
      }

      const results: FRADatasetRecord[] = [];
      
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          // Parse and clean the data
          const record: FRADatasetRecord = {
            application_id: data.application_id,
            family_id: data.family_id,
            aadhaar_id: data.aadhaar_id || '',
            applicant_name: data.applicant_name,
            age: parseInt(data.age) || 0,
            gender: data.gender,
            state: data.state,
            district: data.district,
            village: data.village,
            tribe: data.tribe,
            community_category: data.community_category,
            is_scheduled_tribe: data.is_scheduled_tribe === 'True',
            family_size: parseInt(data.family_size) || 0,
            dependents: parseInt(data.dependents) || 0,
            land_area_requested_acres: parseFloat(data.land_area_requested_acres) || 0,
            land_type: data.land_type,
            has_previous_claim: data.has_previous_claim === 'True',
            has_aadhaar: data.has_aadhaar === 'True',
            has_community_proof: data.has_community_proof === 'True',
            has_tribal_proof: data.has_tribal_proof === 'True',
            has_medical_certificate: data.has_medical_certificate === 'True',
            document_completeness: data.document_completeness,
            years_in_forest_area: parseInt(data.years_in_forest_area) || 0,
            occupation: data.occupation,
            annual_income: parseInt(data.annual_income) || 0,
            application_date: data.application_date,
            application_status: data.application_status,
            document_authenticity_score: parseFloat(data.document_authenticity_score) || 0,
            eligibility_confidence_score: parseFloat(data.eligibility_confidence_score) || 0,
            fraud_risk_score: parseFloat(data.fraud_risk_score) || 0,
            gram_sabha_date: data.gram_sabha_date || undefined,
            frc_recommendation: data.frc_recommendation || undefined,
            latitude: parseFloat(data.latitude) || 0,
            longitude: parseFloat(data.longitude) || 0,
            created_timestamp: data.created_timestamp,
            last_updated: data.last_updated
          };
          results.push(record);
        })
        .on('end', () => {
          this.dataset = results;
          this.isLoaded = true;
          console.log(`FRA Dataset loaded: ${results.length} records`);
          resolve();
        })
        .on('error', (error) => {
          console.error('Error loading FRA dataset:', error);
          reject(error);
        });
    });
  }

  private waitForLoad(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (this.isLoaded) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  private parseLandArea(landAreaString: string): number {
    // Extract numeric value from strings like "2.5 acres", "1.75 hectares", etc.
    const matches = landAreaString.match(/[\d.]+/);
    if (!matches) return 0;
    
    const value = parseFloat(matches[0]);
    
    // Convert hectares to acres if needed (1 hectare = 2.471 acres)
    if (landAreaString.toLowerCase().includes('hectare')) {
      return value * 2.471;
    }
    
    return value;
  }

  public async validateClaim(claimData: ClaimValidationData): Promise<ValidationResult> {
    await this.waitForLoad();

    const result: ValidationResult = {
      isValid: false,
      userFound: false,
      eligibilityChecks: {
        ageEligible: false,
        landAreaEligible: false,
        generationEligible: false,
      },
      errors: [],
      warnings: []
    };

    // Find matching record in dataset
    let matchedRecord: FRADatasetRecord | undefined;

    // Try to match by Aadhaar ID first (most reliable)
    if (claimData.aadhaarId) {
      matchedRecord = this.dataset.find(record => 
        record.aadhaar_id && record.aadhaar_id === claimData.aadhaarId
      );
    }

    // If no Aadhaar match, try matching by name and location
    if (!matchedRecord) {
      matchedRecord = this.dataset.find(record => 
        record.applicant_name.toLowerCase() === claimData.beneficiaryName.toLowerCase() &&
        record.state.toLowerCase() === claimData.state.toLowerCase() &&
        record.district.toLowerCase() === claimData.district.toLowerCase() &&
        record.village.toLowerCase() === claimData.village.toLowerCase()
      );
    }

    // Check if user found in database
    if (matchedRecord) {
      result.userFound = true;
      result.matchedRecord = matchedRecord;

      // Check eligibility criteria using dataset values
      const datasetAge = matchedRecord.age;
      const datasetLandArea = matchedRecord.land_area_requested_acres;
      const datasetYearsInForest = matchedRecord.years_in_forest_area;

      // Age eligibility (>= 18)
      if (datasetAge >= 18) {
        result.eligibilityChecks.ageEligible = true;
      } else {
        result.errors.push(`Age requirement not met: ${datasetAge} years (minimum 18 required)`);
      }

      // Land area eligibility (< 4 hectares/acres)
      if (datasetLandArea < 4) {
        result.eligibilityChecks.landAreaEligible = true;
      } else {
        result.errors.push(`Land area exceeds limit: ${datasetLandArea} acres (maximum 4 acres allowed)`);
      }

      // Generation eligibility (>= 75 years in forest area)
      if (datasetYearsInForest >= 75) {
        result.eligibilityChecks.generationEligible = true;
      } else {
        result.errors.push(`Generational requirement not met: ${datasetYearsInForest} years (minimum 75 years required)`);
      }

      // Check for previous claims
      if (matchedRecord.has_previous_claim) {
        result.warnings.push('Applicant has previous claims in the system');
      }

      // Check application status
      if (matchedRecord.application_status.includes('Rejected')) {
        result.warnings.push(`Previous application was rejected: ${matchedRecord.application_status}`);
      }

      // Check fraud risk
      if (matchedRecord.fraud_risk_score > 0.5) {
        result.warnings.push(`High fraud risk score: ${Math.round(matchedRecord.fraud_risk_score * 100)}%`);
      }

      // Overall validity
      result.isValid = result.eligibilityChecks.ageEligible && 
                      result.eligibilityChecks.landAreaEligible && 
                      result.eligibilityChecks.generationEligible;

    } else {
      result.userFound = false;
      result.errors.push('User not found in the FRA database. Please verify the details.');
    }

    return result;
  }

  public async findSimilarRecords(claimData: ClaimValidationData): Promise<FRADatasetRecord[]> {
    await this.waitForLoad();

    const similar: FRADatasetRecord[] = [];

    // Find records with similar name or location
    this.dataset.forEach(record => {
      let score = 0;

      // Name similarity (fuzzy matching)
      if (record.applicant_name.toLowerCase().includes(claimData.beneficiaryName.toLowerCase()) ||
          claimData.beneficiaryName.toLowerCase().includes(record.applicant_name.toLowerCase())) {
        score += 3;
      }

      // Location matching
      if (record.state.toLowerCase() === claimData.state.toLowerCase()) score += 2;
      if (record.district.toLowerCase() === claimData.district.toLowerCase()) score += 2;
      if (record.village.toLowerCase() === claimData.village.toLowerCase()) score += 1;

      if (score >= 3) {
        similar.push(record);
      }
    });

    return similar.slice(0, 5); // Return top 5 matches
  }

  public getDatasetStats(): { total: number; eligibleCount: number; byState: Record<string, number> } {
    if (!this.isLoaded) {
      return { total: 0, eligibleCount: 0, byState: {} };
    }

    const byState: Record<string, number> = {};
    let eligibleCount = 0;

    this.dataset.forEach(record => {
      // Count by state
      byState[record.state] = (byState[record.state] || 0) + 1;

      // Check eligibility
      if (record.age >= 18 && record.land_area_requested_acres < 4 && record.years_in_forest_area >= 75) {
        eligibleCount++;
      }
    });

    return {
      total: this.dataset.length,
      eligibleCount,
      byState
    };
  }
}

// Advanced ML-based Anomaly Detection Service
class MLAnomalyDetectionService {
  private dataset: FRADatasetRecord[] = [];
  private isLoaded = false;

  constructor(validationService: FRAValidationService) {
    this.dataset = (validationService as any).dataset;
    this.isLoaded = (validationService as any).isLoaded;
  }

  // Levenshtein Distance for string similarity
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Calculate string similarity (0-1, where 1 is identical)
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (!str1 || !str2) return 0.0;
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    return (maxLength - distance) / maxLength;
  }

  // Jaccard similarity for document sets
  private jaccardSimilarity(set1: string[], set2: string[]): number {
    if (!set1.length && !set2.length) return 1.0;
    if (!set1.length || !set2.length) return 0.0;
    
    const intersection = set1.filter(x => set2.includes(x)).length;
    const union = [...new Set([...set1, ...set2])].length;
    return intersection / union;
  }

  // Geographic distance calculation (Haversine formula)
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Advanced ML-based duplicate detection
  public async detectDuplicateApplications(claimData: ClaimValidationData): Promise<{
    isDuplicate: boolean;
    duplicates: Array<{
      record: FRADatasetRecord;
      similarity: number;
      reasons: string[];
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    }>;
    mlScore: number;
    analysis: {
      nameMatches: number;
      locationMatches: number;
      documentSimilarity: number;
      geographicProximity: number;
      temporalProximity: number;
    };
  }> {
    if (!this.isLoaded) {
      throw new Error('ML service not initialized');
    }

    const duplicates: Array<{
      record: FRADatasetRecord;
      similarity: number;
      reasons: string[];
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    let nameMatches = 0;
    let locationMatches = 0;
    let documentSimilarity = 0;
    let geographicProximity = 0;
    let temporalProximity = 0;
    let totalRecordsAnalyzed = 0;

    // Parse claim land area for comparison
    const claimLandArea = this.parseLandArea(claimData.landArea);

    for (const record of this.dataset) {
      totalRecordsAnalyzed++;
      const reasons: string[] = [];
      let similarity = 0;
      let weights = 0;

      // 1. Name similarity (weight: 25%)
      const nameSim = this.stringSimilarity(claimData.beneficiaryName, record.applicant_name);
      similarity += nameSim * 0.25;
      weights += 0.25;
      if (nameSim > 0.8) {
        nameMatches++;
        reasons.push(`Name similarity: ${Math.round(nameSim * 100)}%`);
      }

      // 2. Location similarity (weight: 20%)
      let locationSim = 0;
      if (record.state.toLowerCase() === claimData.state.toLowerCase()) locationSim += 0.4;
      if (record.district.toLowerCase() === claimData.district.toLowerCase()) locationSim += 0.4;
      if (record.village.toLowerCase() === claimData.village.toLowerCase()) locationSim += 0.2;
      
      similarity += locationSim * 0.20;
      weights += 0.20;
      if (locationSim > 0.6) {
        locationMatches++;
        reasons.push(`Location match: ${record.state}/${record.district}/${record.village}`);
      }

      // 3. Aadhaar ID match (weight: 30%)
      if (claimData.aadhaarId && record.aadhaar_id && claimData.aadhaarId === record.aadhaar_id) {
        similarity += 0.30;
        weights += 0.30;
        reasons.push('Exact Aadhaar ID match');
      }

      // 4. Land area similarity (weight: 10%)
      const landAreaDiff = Math.abs(claimLandArea - record.land_area_requested_acres);
      const landAreaSim = Math.max(0, 1 - (landAreaDiff / Math.max(claimLandArea, record.land_area_requested_acres)));
      if (landAreaSim > 0.9 && landAreaDiff < 0.5) {
        similarity += 0.10;
        weights += 0.10;
        reasons.push(`Similar land area: ${record.land_area_requested_acres} acres`);
      }

      // 5. Age similarity (weight: 5%)
      if (claimData.age && Math.abs(claimData.age - record.age) <= 2) {
        similarity += 0.05;
        weights += 0.05;
        reasons.push(`Similar age: ${record.age} years`);
      }

      // 6. Geographic proximity (weight: 10%)
      // Note: This would require coordinates from claim data, using approximate logic
      const geoProximity = locationSim > 0.8 ? 0.8 : 0; // Simplified for demo
      similarity += geoProximity * 0.10;
      weights += 0.10;
      geographicProximity += geoProximity;

      // Normalize similarity score
      if (weights > 0) {
        similarity = similarity / weights;
      }

      // Determine risk level and add to duplicates if significant
      if (similarity > 0.3) {
        let riskLevel: 'low' | 'medium' | 'high' | 'critical';
        
        if (similarity >= 0.9) {
          riskLevel = 'critical';
        } else if (similarity >= 0.7) {
          riskLevel = 'high';
        } else if (similarity >= 0.5) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'low';
        }

        duplicates.push({
          record,
          similarity,
          reasons,
          riskLevel
        });
      }
    }

    // Calculate overall ML score
    const mlScore = duplicates.length > 0 ? Math.max(...duplicates.map(d => d.similarity)) : 0;
    
    // Sort duplicates by similarity (highest first)
    duplicates.sort((a, b) => b.similarity - a.similarity);

    return {
      isDuplicate: duplicates.some(d => d.similarity > 0.7),
      duplicates: duplicates.slice(0, 10), // Top 10 matches
      mlScore,
      analysis: {
        nameMatches,
        locationMatches,
        documentSimilarity: documentSimilarity / totalRecordsAnalyzed,
        geographicProximity: geographicProximity / totalRecordsAnalyzed,
        temporalProximity: temporalProximity / totalRecordsAnalyzed
      }
    };
  }

  // Document similarity detection using text analysis
  public async detectDocumentSimilarity(documents: string[]): Promise<{
    hasSimilarDocuments: boolean;
    similarityScore: number;
    suspiciousPatterns: string[];
    recommendation: string;
  }> {
    const suspiciousPatterns: string[] = [];
    let maxSimilarity = 0;

    // Check for common document fraud patterns
    const fraudPatterns = [
      'copy', 'duplicate', 'xerox', 'photocopy',
      'same document', 'identical',
      'template', 'form', 'generated'
    ];

    const documentText = documents.join(' ').toLowerCase();
    
    // Pattern detection
    fraudPatterns.forEach(pattern => {
      if (documentText.includes(pattern)) {
        suspiciousPatterns.push(`Suspicious pattern detected: '${pattern}'`);
        maxSimilarity = Math.max(maxSimilarity, 0.6);
      }
    });

    // Check for repeated file names or paths
    const documentNames = documents.filter(doc => doc.length > 0);
    const uniqueNames = [...new Set(documentNames)];
    
    if (documentNames.length > uniqueNames.length) {
      suspiciousPatterns.push('Duplicate document names detected');
      maxSimilarity = Math.max(maxSimilarity, 0.8);
    }

    // Document count analysis
    if (documents.length < 3) {
      suspiciousPatterns.push('Insufficient documents provided');
    }

    // Generate recommendation
    let recommendation = '';
    if (maxSimilarity >= 0.8) {
      recommendation = 'HIGH RISK: Manual verification required. Potential document fraud detected.';
    } else if (maxSimilarity >= 0.6) {
      recommendation = 'MEDIUM RISK: Additional document verification recommended.';
    } else if (maxSimilarity >= 0.4) {
      recommendation = 'LOW RISK: Standard verification procedures sufficient.';
    } else {
      recommendation = 'Documents appear unique. Proceed with normal processing.';
    }

    return {
      hasSimilarDocuments: maxSimilarity > 0.6,
      similarityScore: maxSimilarity,
      suspiciousPatterns,
      recommendation
    };
  }

  private parseLandArea(landAreaString: string): number {
    const matches = landAreaString.match(/[\d.]+/);
    if (!matches) return 0;
    
    const value = parseFloat(matches[0]);
    if (landAreaString.toLowerCase().includes('hectare')) {
      return value * 2.471;
    }
    return value;
  }

  // Get claims data for map visualization
  public getClaimsForMap(): Array<{
    id: string;
    latitude: number;
    longitude: number;
    applicantName: string;
    state: string;
    district: string;
    village: string;
    status: string;
    landArea: number;
    fraudRisk: number;
    eligibilityScore: number;
  }> {
    if (!this.isLoaded) return [];

    return this.dataset
      .filter(record => record.latitude && record.longitude && record.latitude !== 0 && record.longitude !== 0)
      .map(record => ({
        id: record.application_id,
        latitude: record.latitude,
        longitude: record.longitude,
        applicantName: record.applicant_name,
        state: record.state,
        district: record.district,
        village: record.village,
        status: record.application_status,
        landArea: record.land_area_requested_acres,
        fraudRisk: record.fraud_risk_score,
        eligibilityScore: record.eligibility_confidence_score
      }));
  }
}

// Create singleton instances
export const fraValidationService = new FRAValidationService();
export const mlAnomalyDetectionService = new MLAnomalyDetectionService(fraValidationService);