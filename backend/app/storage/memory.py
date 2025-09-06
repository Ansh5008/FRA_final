from __future__ import annotations

from typing import Dict, List, Optional, TypedDict, Literal
from uuid import uuid4
from datetime import datetime


ClaimType = Literal["Individual Forest Right", "Community Forest Right"]
ClaimStatus = Literal["pending", "approved", "rejected"]


class ContactMessage(TypedDict):
    id: str
    name: str
    email: str
    message: str
    createdAt: str


class FraClaim(TypedDict, total=False):
    id: str
    claimId: str
    beneficiaryName: str
    village: str
    district: str
    state: str
    claimType: ClaimType
    landArea: str
    documents: List[str]
    status: ClaimStatus
    coordinates: Optional[str]
    createdAt: str
    updatedAt: str
    aiScore: float
    aiFlags: List[str]


class Storage:
    def __init__(self) -> None:
        self._contact_messages: Dict[str, ContactMessage] = {}
        self._fra_claims: Dict[str, FraClaim] = {}
        self._seed_sample_data()

    async def create_contact_message(self, data: Dict) -> ContactMessage:
        now = datetime.utcnow().isoformat()
        message: ContactMessage = {
            "id": str(uuid4()),
            "name": data["name"],
            "email": data["email"],
            "message": data["message"],
            "createdAt": now,
        }
        self._contact_messages[message["id"]] = message
        return message

    async def get_contact_messages(self) -> List[ContactMessage]:
        return sorted(self._contact_messages.values(), key=lambda m: m["createdAt"], reverse=True)

    async def create_fra_claim(self, data: Dict) -> FraClaim:
        now = datetime.utcnow().isoformat()
        claim_id = f"FRA{str(uuid4())[:8].upper()}"
        claim: FraClaim = {
            **data,
            "id": str(uuid4()),
            "claimId": claim_id,
            "status": "pending",
            "coordinates": data.get("coordinates"),
            "createdAt": now,
            "updatedAt": now,
        }
        self._fra_claims[claim["id"]] = claim
        return claim

    async def get_fra_claims(self) -> List[FraClaim]:
        return sorted(self._fra_claims.values(), key=lambda c: c["createdAt"], reverse=True)

    async def get_fra_claim_by_id(self, id: str) -> Optional[FraClaim]:
        return self._fra_claims.get(id)

    async def update_fra_claim_status(self, id: str, status: ClaimStatus) -> Optional[FraClaim]:
        claim = self._fra_claims.get(id)
        if not claim:
            return None
        claim["status"] = status
        claim["updatedAt"] = datetime.utcnow().isoformat()
        self._fra_claims[id] = claim
        return claim

    def _seed_sample_data(self) -> None:
        samples: List[FraClaim] = [
            {
                "beneficiaryName": "Ramesh Oraon",
                "village": "Bansjore",
                "district": "Ranchi",
                "state": "Jharkhand",
                "claimType": "Individual Forest Right",
                "landArea": "2 acres",
                "documents": ["Aadhaar card", "land sketch", "Gram Sabha resolution"],
                "coordinates": "23.3441,85.3096",
                "status": "approved",
            },
            {
                "beneficiaryName": "Sita Munda",
                "village": "Khunti",
                "district": "Khunti",
                "state": "Jharkhand",
                "claimType": "Community Forest Right",
                "landArea": "15 acres",
                "documents": ["Community certificate", "village map", "Gram Sabha resolution"],
                "coordinates": "23.0722,85.2789",
                "status": "pending",
            },
            {
                "beneficiaryName": "Kiran Tirkey",
                "village": "Gumla",
                "district": "Gumla",
                "state": "Jharkhand",
                "claimType": "Individual Forest Right",
                "landArea": "1.5 acres",
                "documents": ["Aadhaar card", "village certificate"],
                "coordinates": "23.0441,84.5391",
                "status": "rejected",
            },
        ]

        for s in samples:
            # emulate create to set ids/timestamps
            _ = self._safe_create(s)

    def _safe_create(self, data: Dict) -> FraClaim:
        now = datetime.utcnow().isoformat()
        claim_id = f"FRA{str(uuid4())[:8].upper()}"
        claim: FraClaim = {
            **data,
            "id": str(uuid4()),
            "claimId": claim_id,
            "createdAt": now,
            "updatedAt": now,
        }
        self._fra_claims[claim["id"]] = claim
        return claim


storage = Storage()

