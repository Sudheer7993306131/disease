from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/api", tags=["Prescriptions & Health Records"])

# ==================== PRESCRIPTIONS ====================

@router.post("/prescriptions", response_model=schemas.PrescriptionResponse)
def create_prescription(
    prescription: schemas.PrescriptionCreate,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    if current_user.get("role") != "DOCTOR" and current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Only doctors can issue medical prescriptions.")

    # Fetch doctor profile info for prescription header
    doctor = db.doctors.find_one({"$or": [{"user_id": current_user["id"]}, {"user_id": ObjectId(current_user["id"])}]})
    
    spec = doctor.get("specialization", "Specialist Physician") if doctor else "Specialist Physician"
    hosp = doctor.get("hospital", "MediCURE Clinical Network") if doctor else "MediCURE Clinical Network"
    clinic = doctor.get("clinic_address", "") if doctor else ""

    presc_doc = {
        "consultation_id": prescription.consultation_id,
        "patient_id": prescription.patient_id,
        "patient_name": prescription.patient_name,
        "doctor_id": current_user["id"],
        "doctor_name": current_user.get("name", "Doctor"),
        "doctor_specialization": spec,
        "doctor_hospital": hosp,
        "doctor_clinic": clinic,
        "diagnosis": prescription.diagnosis,
        "medications": [m.dict() for m in prescription.medications],
        "lab_tests": prescription.lab_tests or [],
        "diet_advice": prescription.diet_advice or "",
        "general_notes": prescription.general_notes or "",
        "follow_up_date": prescription.follow_up_date or "",
        "created_at": datetime.utcnow()
    }

    res = db.prescriptions.insert_one(presc_doc)
    presc_doc["id"] = str(res.inserted_id)

    # If linked to a consultation, update consultation status or note
    if prescription.consultation_id:
        try:
            db.consultations.update_one(
                {"_id": ObjectId(prescription.consultation_id)},
                {"$set": {"has_prescription": True, "prescription_id": presc_doc["id"]}}
            )
        except Exception:
            pass

    # Send notification to patient
    db.notifications.insert_one({
        "user_id": prescription.patient_id,
        "title": "New Digital Prescription (Rx) Issued",
        "message": f"Dr. {current_user.get('name')} has issued an official Digital Prescription for {prescription.diagnosis}.",
        "type": "PRESCRIPTION_ISSUED",
        "sender_id": current_user["id"],
        "sender_name": current_user.get("name", "Doctor"),
        "reference_id": presc_doc["id"],
        "status": "ISSUED",
        "created_at": datetime.utcnow(),
        "read": False
    })

    return presc_doc


@router.get("/prescriptions/my", response_model=List[schemas.PrescriptionResponse])
def get_my_prescriptions(
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    uid = current_user["id"]
    if current_user.get("role") == "DOCTOR":
        query = {"doctor_id": uid}
    else:
        query = {"patient_id": uid}

    prescs = list(db.prescriptions.find(query).sort("created_at", -1))
    for p in prescs:
        p["id"] = str(p["_id"])
    return prescs


@router.get("/prescriptions/{prescription_id}", response_model=schemas.PrescriptionResponse)
def get_prescription(
    prescription_id: str,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    p = db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    # Check authorization
    uid = current_user["id"]
    if p["patient_id"] != uid and p["doctor_id"] != uid and current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized to view this prescription")

    p["id"] = str(p["_id"])
    return p


# ==================== DIAGNOSTIC HISTORY ====================

@router.post("/diagnostics/history", response_model=schemas.DiagnosticRecord)
def save_diagnostic_record(
    record: schemas.DiagnosticHistoryCreate,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    doc = {
        "user_id": current_user["id"],
        "symptoms": record.symptoms,
        "predicted_disease": record.predicted_disease,
        "confidence": record.confidence,
        "severity": record.severity,
        "model_name": record.model_name,
        "created_at": datetime.utcnow()
    }
    res = db.predictions.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc


@router.get("/diagnostics/history", response_model=List[schemas.DiagnosticRecord])
def get_diagnostic_history(
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    records = list(db.predictions.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(50))
    for r in records:
        r["id"] = str(r["_id"])
    return records


@router.delete("/diagnostics/history/{record_id}")
def delete_diagnostic_record(
    record_id: str,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    res = db.predictions.delete_one({"_id": ObjectId(record_id), "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Diagnostic record deleted"}


# ==================== EMERGENCY HEALTH PROFILE ====================

@router.get("/user/emergency-profile", response_model=schemas.EmergencyProfile)
def get_emergency_profile(
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    prof = db.emergency_profiles.find_one({"user_id": current_user["id"]})
    if not prof:
        return schemas.EmergencyProfile(
            blood_group="Not specified",
            allergies="None reported",
            chronic_conditions="None reported",
            emergency_contact_name="",
            emergency_contact_phone=""
        )
    return prof


@router.put("/user/emergency-profile", response_model=schemas.EmergencyProfile)
def update_emergency_profile(
    profile: schemas.EmergencyProfile,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    update_data = profile.dict()
    update_data["updated_at"] = datetime.utcnow()

    db.emergency_profiles.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_data},
        upsert=True
    )
    return profile
