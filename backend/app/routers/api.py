from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
from ..services.validation import fra_validation_service
from ..storage.memory import storage


router = APIRouter()


class ContactMessageIn(BaseModel):
    name: str
    email: str
    message: str


class ContactMessageOut(ContactMessageIn):
    id: str
    createdAt: str


ClaimType = Literal["Individual Forest Right", "Community Forest Right"]
ClaimStatus = Literal["pending", "approved", "rejected"]


class FraClaimIn(BaseModel):
    beneficiaryName: str
    village: str
    district: str
    state: str
    claimType: ClaimType
    landArea: str
    documents: List[str]
    coordinates: Optional[str] = None
    aiScore: Optional[float] = None
    aiFlags: Optional[List[str]] = None


class FraClaimOut(FraClaimIn):
    id: str
    claimId: str
    status: ClaimStatus
    createdAt: str
    updatedAt: str


@router.post("/contact")
async def create_contact(message: ContactMessageIn):
    contact = await storage.create_contact_message(message.model_dump())
    return {"success": True, "message": "Contact message received successfully", "id": contact["id"]}


@router.get("/contact")
async def list_contacts():
    messages = await storage.get_contact_messages()
    return {"success": True, "data": messages}


@router.post("/claims")
async def create_claim(data: FraClaimIn):
    claim = await storage.create_fra_claim(data.model_dump())
    return {"success": True, "message": "FRA claim submitted successfully", "data": claim}


@router.get("/claims")
async def list_claims():
    claims = await storage.get_fra_claims()
    return {"success": True, "data": claims}


@router.get("/claims/{id}")
async def get_claim(id: str):
    claim = await storage.get_fra_claim_by_id(id)
    if not claim:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Claim not found"})
    return {"success": True, "data": claim}


class UpdateStatusIn(BaseModel):
    status: ClaimStatus


@router.patch("/claims/{id}/status")
async def update_claim_status(id: str, payload: UpdateStatusIn):
    claim = await storage.update_fra_claim_status(id, payload.status)
    if not claim:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Claim not found"})
    return {"success": True, "data": claim}


class ClaimValidationIn(BaseModel):
    aadhaarId: Optional[str] = None
    beneficiaryName: str
    age: Optional[int] = None
    landArea: str
    state: str
    district: str
    village: str


@router.post("/validate-claim")
async def validate_claim(payload: ClaimValidationIn):
    result = await fra_validation_service.validate_claim(payload.model_dump())
    return {"success": True, "data": result}


@router.post("/find-similar")
async def find_similar(payload: ClaimValidationIn):
    result = await fra_validation_service.find_similar_records(payload.model_dump())
    return {"success": True, "data": result}


@router.get("/dataset-stats")
async def dataset_stats():
    stats = fra_validation_service.get_dataset_stats()
    return {"success": True, "data": stats}

