from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import get_db
import auth

router = APIRouter(prefix="/api/admin", tags=["Admin"])

def require_admin(current_user = Depends(auth.get_current_active_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized as Admin")
    return current_user

@router.get("/unverified-doctors")
def get_unverified_doctors(db = Depends(get_db), admin = Depends(require_admin)):
    # Fetch all doctors where is_verified is False
    doctors_cursor = db.doctors.find({"is_verified": False})
    unverified = []
    
    for doc in doctors_cursor:
        # Fetch associated user details
        user = db.users.find_one({"_id": ObjectId(doc["user_id"])})
        if user:
            user["id"] = str(user["_id"])
            del user["_id"]
            del user["password_hash"]
            
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            doc["user"] = user
            unverified.append(doc)
            
    return unverified

@router.put("/verify-doctor/{doctor_id}")
def verify_doctor(doctor_id: str, db = Depends(get_db), admin = Depends(require_admin)):
    result = db.doctors.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {"is_verified": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found or already verified")
    return {"status": "success", "message": "Doctor verified successfully"}
