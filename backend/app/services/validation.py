from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, TypedDict
import csv


class FRADatasetRecord(TypedDict, total=False):
    application_id: str
    family_id: str
    aadhaar_id: str
    applicant_name: str
    age: int
    gender: str
    state: str
    district: str
    village: str
    tribe: str
    community_category: str
    is_scheduled_tribe: bool
    family_size: int
    dependents: int
    land_area_requested_acres: float
    land_type: str
    has_previous_claim: bool
    has_aadhaar: bool
    has_community_proof: bool
    has_tribal_proof: bool
    has_medical_certificate: bool
    document_completeness: str
    years_in_forest_area: int
    occupation: str
    annual_income: int
    application_date: str
    application_status: str
    document_authenticity_score: float
    eligibility_confidence_score: float
    fraud_risk_score: float
    gram_sabha_date: Optional[str]
    frc_recommendation: Optional[str]
    latitude: float
    longitude: float
    created_timestamp: str
    last_updated: str


class ValidationResult(TypedDict, total=False):
    isValid: bool
    userFound: bool
    eligibilityChecks: Dict[str, bool]
    matchedRecord: Optional[FRADatasetRecord]
    errors: List[str]
    warnings: List[str]


class ClaimValidationData(TypedDict, total=False):
    aadhaarId: Optional[str]
    beneficiaryName: str
    age: Optional[int]
    landArea: str
    state: str
    district: str
    village: str


class FRAValidationService:
    def __init__(self) -> None:
        self._dataset: List[FRADatasetRecord] = []
        self._is_loaded: bool = False
        self._load_dataset()

    def _load_dataset(self) -> None:
        csv_path = (
            Path.cwd()
            / "attached_assets"
            / "fra_land_claim_dataset_500_users_1757137800126.csv"
        )
        if not csv_path.exists():
            # no dataset, keep empty but mark loaded
            self._dataset = []
            self._is_loaded = True
            return

        records: List[FRADatasetRecord] = []
        with csv_path.open("r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rec: FRADatasetRecord = {
                    "application_id": row.get("application_id", ""),
                    "family_id": row.get("family_id", ""),
                    "aadhaar_id": row.get("aadhaar_id", ""),
                    "applicant_name": row.get("applicant_name", ""),
                    "age": int(row.get("age", 0) or 0),
                    "gender": row.get("gender", ""),
                    "state": row.get("state", ""),
                    "district": row.get("district", ""),
                    "village": row.get("village", ""),
                    "tribe": row.get("tribe", ""),
                    "community_category": row.get("community_category", ""),
                    "is_scheduled_tribe": str(row.get("is_scheduled_tribe", "")).lower()
                    == "true",
                    "family_size": int(row.get("family_size", 0) or 0),
                    "dependents": int(row.get("dependents", 0) or 0),
                    "land_area_requested_acres": float(
                        row.get("land_area_requested_acres", 0) or 0
                    ),
                    "land_type": row.get("land_type", ""),
                    "has_previous_claim": str(row.get("has_previous_claim", "")).lower()
                    == "true",
                    "has_aadhaar": str(row.get("has_aadhaar", "")).lower() == "true",
                    "has_community_proof": str(row.get("has_community_proof", "")).lower()
                    == "true",
                    "has_tribal_proof": str(row.get("has_tribal_proof", "")).lower()
                    == "true",
                    "has_medical_certificate": str(
                        row.get("has_medical_certificate", "")
                    ).lower()
                    == "true",
                    "document_completeness": row.get("document_completeness", ""),
                    "years_in_forest_area": int(row.get("years_in_forest_area", 0) or 0),
                    "occupation": row.get("occupation", ""),
                    "annual_income": int(row.get("annual_income", 0) or 0),
                    "application_date": row.get("application_date", ""),
                    "application_status": row.get("application_status", ""),
                    "document_authenticity_score": float(
                        row.get("document_authenticity_score", 0) or 0
                    ),
                    "eligibility_confidence_score": float(
                        row.get("eligibility_confidence_score", 0) or 0
                    ),
                    "fraud_risk_score": float(row.get("fraud_risk_score", 0) or 0),
                    "gram_sabha_date": row.get("gram_sabha_date") or None,
                    "frc_recommendation": row.get("frc_recommendation") or None,
                    "latitude": float(row.get("latitude", 0) or 0),
                    "longitude": float(row.get("longitude", 0) or 0),
                    "created_timestamp": row.get("created_timestamp", ""),
                    "last_updated": row.get("last_updated", ""),
                }
                records.append(rec)

        self._dataset = records
        self._is_loaded = True

    async def validate_claim(self, claim: ClaimValidationData) -> ValidationResult:
        result: ValidationResult = {
            "isValid": False,
            "userFound": False,
            "eligibilityChecks": {
                "ageEligible": False,
                "landAreaEligible": False,
                "generationEligible": False,
            },
            "errors": [],
            "warnings": [],
        }

        matched: Optional[FRADatasetRecord] = None

        aadhaar = claim.get("aadhaarId")
        if aadhaar:
            matched = next(
                (r for r in self._dataset if r.get("aadhaar_id") == aadhaar), None
            )

        if not matched:
            bn = claim.get("beneficiaryName", "").lower()
            st = claim.get("state", "").lower()
            dt = claim.get("district", "").lower()
            vg = claim.get("village", "").lower()
            matched = next(
                (
                    r
                    for r in self._dataset
                    if r.get("applicant_name", "").lower() == bn
                    and r.get("state", "").lower() == st
                    and r.get("district", "").lower() == dt
                    and r.get("village", "").lower() == vg
                ),
                None,
            )

        if matched:
            result["userFound"] = True
            result["matchedRecord"] = matched
            dataset_age = matched.get("age", 0) or 0
            dataset_land = matched.get("land_area_requested_acres", 0.0) or 0.0
            years = matched.get("years_in_forest_area", 0) or 0

            result["eligibilityChecks"]["ageEligible"] = dataset_age >= 18
            if not result["eligibilityChecks"]["ageEligible"]:
                result["errors"].append(
                    f"Age requirement not met: {dataset_age} years (minimum 18 required)"
                )

            result["eligibilityChecks"]["landAreaEligible"] = dataset_land < 4
            if not result["eligibilityChecks"]["landAreaEligible"]:
                result["errors"].append(
                    f"Land area exceeds limit: {dataset_land} acres (maximum 4 acres allowed)"
                )

            result["eligibilityChecks"]["generationEligible"] = years >= 75
            if not result["eligibilityChecks"]["generationEligible"]:
                result["errors"].append(
                    f"Generational requirement not met: {years} years (minimum 75 years required)"
                )

            if matched.get("has_previous_claim"):
                result["warnings"].append("Applicant has previous claims in the system")
            if str(matched.get("application_status", "")).lower().startswith("rejected"):
                result["warnings"].append(
                    f"Previous application was rejected: {matched.get('application_status')}"
                )
            if float(matched.get("fraud_risk_score", 0) or 0) > 0.5:
                result["warnings"].append(
                    f"High fraud risk score: {round(float(matched.get('fraud_risk_score')) * 100)}%"
                )

            result["isValid"] = all(result["eligibilityChecks"].values())
        else:
            result["userFound"] = False
            result["errors"].append(
                "User not found in the FRA database. Please verify the details."
            )

        return result

    async def find_similar_records(self, claim: ClaimValidationData) -> List[FRADatasetRecord]:
        similar: List[FRADatasetRecord] = []
        name = claim.get("beneficiaryName", "").lower()
        st = claim.get("state", "").lower()
        dt = claim.get("district", "").lower()
        vg = claim.get("village", "").lower()

        for r in self._dataset:
            score = 0
            rname = str(r.get("applicant_name", "")).lower()
            if name in rname or rname in name:
                score += 3
            if str(r.get("state", "")).lower() == st:
                score += 2
            if str(r.get("district", "")).lower() == dt:
                score += 2
            if str(r.get("village", "")).lower() == vg:
                score += 1
            if score >= 3:
                similar.append(r)

        return similar[:5]

    def get_dataset_stats(self) -> Dict:
        if not self._is_loaded:
            return {"total": 0, "eligibleCount": 0, "byState": {}}

        by_state: Dict[str, int] = {}
        eligible = 0
        for r in self._dataset:
            st = str(r.get("state", ""))
            by_state[st] = by_state.get(st, 0) + 1
            if (
                int(r.get("age", 0) or 0) >= 18
                and float(r.get("land_area_requested_acres", 0) or 0) < 4
                and int(r.get("years_in_forest_area", 0) or 0) >= 75
            ):
                eligible += 1
        return {"total": len(self._dataset), "eligibleCount": eligible, "byState": by_state}


fra_validation_service = FRAValidationService()

