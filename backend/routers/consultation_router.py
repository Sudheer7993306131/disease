import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/api/consultations", tags=["Consultations"])

def format_consultation(c):
    c['id'] = str(c['_id'])
    if 'consultation_code' not in c:
        c['consultation_code'] = None
    if 'location' not in c:
        c['location'] = None
    if 'instructions' not in c:
        c['instructions'] = None
    if 'rejection_reason' not in c:
        c['rejection_reason'] = None
    if 'has_prescription' not in c:
        c['has_prescription'] = False
    if 'prescription_id' not in c:
        c['prescription_id'] = None
    return c

@router.post("", response_model=schemas.ConsultationResponse)
def book_consultation(
    consultation: schemas.ConsultationCreate,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    doctor = db.doctors.find_one({"_id": ObjectId(consultation.doctor_id)})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    new_consultation = {
        "user_id": current_user['id'],
        "doctor_id": consultation.doctor_id,
        "prediction_id": consultation.prediction_id,
        "status": "PENDING",
        "type": consultation.type,
        "scheduled_time": consultation.scheduled_time,
        "created_at": datetime.utcnow()
    }
    result = db.consultations.insert_one(new_consultation)
    new_consultation['id'] = str(result.inserted_id)

    # CREATE NOTIFICATION FOR DOCTOR
    db.notifications.insert_one({
        "user_id": doctor['user_id'],
        "title": "New Consultation Request",
        "message": f"{current_user.get('name', 'A patient')} requested a {consultation.type} consultation.",
        "type": "CONSULTATION_REQUEST",
        "sender_id": current_user['id'],
        "sender_name": current_user.get('name', 'Patient'),
        "reference_id": str(result.inserted_id),
        "status": "PENDING",
        "created_at": datetime.utcnow(),
        "read": False
    })

    return new_consultation

@router.get("", response_model=List[schemas.ConsultationResponse])
def get_consultations(
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    is_doctor = current_user.get('role') == 'DOCTOR'
    if is_doctor:
        # Find doctor profile
        doc = db.doctors.find_one({"user_id": current_user['id']})
        if not doc:
            return []
        consultations = list(db.consultations.find({"doctor_id": str(doc['_id'])}))
    else:
        consultations = list(db.consultations.find({"user_id": current_user['id']}))
        
    results = []
    for c in consultations:
        formatted_c = format_consultation(c)
        if is_doctor:
            patient = db.users.find_one({"_id": ObjectId(c['user_id'])})
            formatted_c['other_party_name'] = patient['name'] if patient else "Patient"
        else:
            doctor_profile = db.doctors.find_one({"_id": ObjectId(c['doctor_id'])})
            if doctor_profile:
                doc_user = db.users.find_one({"_id": ObjectId(doctor_profile['user_id'])})
                formatted_c['other_party_name'] = "Dr. " + doc_user['name'] if doc_user else "Doctor"
            else:
                formatted_c['other_party_name'] = "Doctor"
        results.append(formatted_c)
        
    return results

@router.put("/{consultation_id}/status", response_model=schemas.ConsultationResponse)
def update_consultation_status(
    consultation_id: str,
    payload: Optional[schemas.ConsultationStatusUpdate] = None,
    status: Optional[str] = Query(None),
    consultation_code: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    instructions: Optional[str] = Query(None),
    rejection_reason: Optional[str] = Query(None),
    current_user = Depends(auth.get_current_doctor),
    db = Depends(get_db)
):
    doc = db.doctors.find_one({"user_id": current_user['id']})
    if not doc:
        raise HTTPException(status_code=403, detail="Doctor profile not found")
        
    consultation = db.consultations.find_one({
        "_id": ObjectId(consultation_id),
        "doctor_id": str(doc['_id'])
    })
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found or not yours")
        
    new_status = payload.status if payload and payload.status else status
    if not new_status or new_status not in ["PENDING", "ACCEPTED", "COMPLETED", "REJECTED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    new_code = payload.consultation_code if payload and payload.consultation_code else consultation_code
    new_location = payload.location if payload and payload.location else location
    new_instructions = payload.instructions if payload and payload.instructions else instructions
    new_rejection_reason = payload.rejection_reason if payload and payload.rejection_reason else rejection_reason

    update_fields = {"status": new_status}
    doctor_name = current_user.get('name', 'Doctor')

    if new_status == "ACCEPTED":
        if new_code:
            update_fields["consultation_code"] = new_code
        elif not consultation.get("consultation_code"):
            update_fields["consultation_code"] = f"MED-{random.randint(1000, 9999)}"
            
        if new_location:
            update_fields["location"] = new_location
        elif not consultation.get("location"):
            update_fields["location"] = doc.get("hospital") or doc.get("clinic_address") or "Hospital Consultation Room 1"

        if new_instructions:
            update_fields["instructions"] = new_instructions

        db.consultations.update_one({"_id": ObjectId(consultation_id)}, {"$set": update_fields})
        updated_consultation = db.consultations.find_one({"_id": ObjectId(consultation_id)})

        # Notify patient
        code = update_fields.get("consultation_code", "")
        loc = update_fields.get("location", "")
        msg = f"Dr. {doctor_name} accepted your consultation request! Access Code: {code}. Location: {loc}."
        if new_instructions:
            msg += f" Note: {new_instructions}"
        db.notifications.insert_one({
            "user_id": consultation['user_id'],
            "title": "Consultation Confirmed!",
            "message": msg,
            "type": "CONSULTATION_UPDATE",
            "sender_id": current_user['id'],
            "sender_name": f"Dr. {doctor_name}",
            "reference_id": str(consultation_id),
            "created_at": datetime.utcnow(),
            "read": False
        })
        return format_consultation(updated_consultation)

    elif new_status == "REJECTED":
        reason = new_rejection_reason or "Doctor is currently unavailable for this consultation slot."
        update_fields["rejection_reason"] = reason

        db.consultations.update_one({"_id": ObjectId(consultation_id)}, {"$set": update_fields})
        updated_consultation = db.consultations.find_one({"_id": ObjectId(consultation_id)})

        # Notify patient with the reason
        db.notifications.insert_one({
            "user_id": consultation['user_id'],
            "title": "Consultation Request Declined",
            "message": f"Dr. {doctor_name} was unable to accept your consultation request. Reason: {reason}",
            "type": "CONSULTATION_UPDATE",
            "sender_id": current_user['id'],
            "sender_name": f"Dr. {doctor_name}",
            "reference_id": str(consultation_id),
            "created_at": datetime.utcnow(),
            "read": False
        })
        return format_consultation(updated_consultation)

    else:
        db.consultations.update_one({"_id": ObjectId(consultation_id)}, {"$set": update_fields})
        updated_consultation = db.consultations.find_one({"_id": ObjectId(consultation_id)})
        return format_consultation(updated_consultation)

@router.delete("/{consultation_id}")
def cancel_consultation(
    consultation_id: str,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    # Verify the consultation belongs to the user
    consultation = db.consultations.find_one({
        "_id": ObjectId(consultation_id),
        "user_id": current_user['id']
    })
    
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found or not yours to delete")
        
    db.consultations.delete_one({"_id": ObjectId(consultation_id)})
    return {"message": "Consultation cancelled successfully"}
