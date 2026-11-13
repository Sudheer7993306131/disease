from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from bson import ObjectId
from database import get_db
import schemas
import auth

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[schemas.UserResponse])
def get_all_users(db = Depends(get_db)):
    users_cursor = list(db.users.find())
    results = []
    
    # Pre-fetch all doctors for rapid joining
    doctors = list(db.doctors.find())
    doc_map = {}
    for d in doctors:
        uid = str(d.get("user_id", ""))
        doc_map[uid] = d

    for u in users_cursor:
        u_id_str = str(u["_id"])
        u["id"] = u_id_str
        
        # If doctor, enrich with clinical profile details
        if u.get("role") == "DOCTOR":
            doc = doc_map.get(u_id_str)
            if doc:
                u["doctor_id"] = str(doc.get("_id"))
                u["specialization"] = doc.get("specialization") or "General Practitioner"
                u["qualification"] = doc.get("qualification")
                u["experience_years"] = doc.get("experience_years")
                u["hospital"] = doc.get("hospital")
                u["clinic_address"] = doc.get("clinic_address")
                u["consultation_fee"] = doc.get("consultation_fee")
                u["rating"] = doc.get("rating")
                u["about"] = doc.get("about")
                u["is_verified"] = doc.get("is_verified", True)

        results.append(u)
    return results
