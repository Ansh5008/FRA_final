import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

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

class FRAValidationService {
  private dataset: FRADatasetRecord[] = [];
  private isLoaded = false;

  constructor() {
    this.loadDataset();
  }

  private async loadDataset(): Promise<void> {
    return new Promise((resolve, reject) => {
      const csvPath = path.resolve(process.cwd(), 'attached_assets', 'fra_land_claim_dataset_500_users_1757137800126.csv');
      
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

// Create singleton instance
export const fraValidationService = new FRAValidationService();