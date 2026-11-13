import math
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
import schemas
import auth
from database import get_db

router = APIRouter(prefix="/api", tags=["Doctors"])

def haversine(lat1, lon1, lat2, lon2):
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def format_doctor(doc, user_dict):
    doc['id'] = str(doc['_id'])
    doc['user_id'] = str(doc.get('user_id', user_dict.get('_id', '')))
    user_dict['id'] = str(user_dict['_id'])
    doc['user'] = user_dict
    return doc

@router.get("/doctors", response_model=List[schemas.DoctorResponse])
def get_doctors(db = Depends(get_db)):
    docs = list(db.doctors.find({"is_verified": True}))
    results = []
    for doc in docs:
        user = db.users.find_one({"_id": ObjectId(doc['user_id'])})
        if user:
            results.append(format_doctor(doc, user))
    return results

@router.get("/doctors/{doctor_id}", response_model=schemas.DoctorResponse)
def get_doctor(doctor_id: str, db = Depends(get_db)):
    doc = db.doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    user = db.users.find_one({"_id": ObjectId(doc['user_id'])})
    return format_doctor(doc, user)

@router.get("/doctor/me", response_model=schemas.DoctorResponse)
def get_doctor_me(
    current_user = Depends(auth.get_current_doctor),
    db = Depends(get_db)
):
    doc = db.doctors.find_one({"user_id": current_user['id']})
    if not doc:
        default_doc = {
            "user_id": current_user['id'],
            "specialization": "General Physician",
            "qualification": "MBBS",
            "experience_years": 1,
            "hospital": "City Healthcare",
            "clinic_address": "",
            "consultation_fee": 500.0,
            "rating": 5.0,
            "latitude": None,
            "longitude": None,
            "is_verified": True,
            "online_consultation": True,
            "offline_consultation": True,
            "about": "Certified practitioner providing compassionate care and expert clinical diagnosis."
        }
        res = db.doctors.insert_one(default_doc)
        doc = db.doctors.find_one({"_id": res.inserted_id})
    return format_doctor(doc, current_user)

@router.put("/doctors/profile", response_model=schemas.DoctorResponse)
def update_doctor_profile(
    profile: schemas.DoctorProfileUpdate, 
    current_user = Depends(auth.get_current_doctor),
    db = Depends(get_db)
):
    update_data = profile.dict(exclude_unset=True)
    name = update_data.pop("name", None)
    if name and name.strip():
        db.users.update_one({"_id": ObjectId(current_user['id'])}, {"$set": {"name": name.strip()}})
        current_user['name'] = name.strip()

    db.doctors.update_one(
        {"user_id": current_user['id']},
        {"$set": update_data},
        upsert=True
    )
    doc = db.doctors.find_one({"user_id": current_user['id']})
    return format_doctor(doc, current_user)

@router.put("/doctors/{doctor_id}", response_model=schemas.DoctorResponse)
def update_doctor_by_id(
    doctor_id: str,
    profile: schemas.DoctorProfileUpdate,
    current_user = Depends(auth.get_current_user),
    db = Depends(get_db)
):
    doc = db.doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # Check permissions: either admin or the doctor themselves
    if current_user.get('role') != 'ADMIN' and str(doc.get('user_id')) != str(current_user.get('id')):
        raise HTTPException(status_code=403, detail="Not authorized to edit this doctor's profile")
        
    update_data = profile.dict(exclude_unset=True)
    name = update_data.pop("name", None)
    
    user = db.users.find_one({"_id": ObjectId(doc['user_id'])})
    if name and name.strip() and user:
        db.users.update_one({"_id": ObjectId(doc['user_id'])}, {"$set": {"name": name.strip()}})
        user['name'] = name.strip()

    if update_data:
        db.doctors.update_one(
            {"_id": ObjectId(doctor_id)},
            {"$set": update_data}
        )
        doc = db.doctors.find_one({"_id": ObjectId(doctor_id)})
        
    return format_doctor(doc, user or current_user)

@router.post("/doctors/{doctor_id}/reviews", response_model=schemas.ReviewResponse)
def add_doctor_review(
    doctor_id: str,
    review: schemas.ReviewCreate,
    current_user = Depends(auth.get_current_active_user),
    db = Depends(get_db)
):
    doc = db.doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    rating_val = max(1.0, min(5.0, float(review.rating)))
    comment_val = review.comment.strip()
    if not comment_val:
        raise HTTPException(status_code=400, detail="Review comment cannot be empty")
        
    review_doc = {
        "doctor_id": doctor_id,
        "user_id": current_user['id'],
        "user_name": current_user.get('name', 'Patient'),
        "rating": rating_val,
        "comment": comment_val,
        "created_at": datetime.utcnow()
    }
    res = db.reviews.insert_one(review_doc)
    review_doc['id'] = str(res.inserted_id)
    
    # Recalculate average doctor rating
    all_reviews = list(db.reviews.find({"doctor_id": doctor_id}))
    if all_reviews:
        avg_rating = round(sum(r.get('rating', 5.0) for r in all_reviews) / len(all_reviews), 1)
        db.doctors.update_one({"_id": ObjectId(doctor_id)}, {"$set": {"rating": avg_rating}})
        
    return review_doc

@router.get("/doctors/{doctor_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_doctor_reviews(
    doctor_id: str,
    db = Depends(get_db)
):
    reviews = list(db.reviews.find({"doctor_id": doctor_id}).sort("created_at", -1))
    results = []
    for r in reviews:
        r['id'] = str(r['_id'])
        results.append(r)
    return results

def assign_specialty_fallback(disease_name: str) -> str:
    name = disease_name.lower()
    if any(k in name for k in ['brain', 'neuro', 'stroke', 'paralysis', 'migraine', 'headache']):
        return "Neurologist"
    if any(k in name for k in ['heart', 'cardio', 'myocardial', 'angina']):
        return "Cardiologist"
    if any(k in name for k in ['skin', 'acne', 'rash', 'psoriasis', 'fungal', 'melanoma', 'eczema']):
        return "Dermatologist"
    if any(k in name for k in ['eye', 'vision', 'cataract', 'glaucoma']):
        return "Ophthalmologist"
    if any(k in name for k in ['bone', 'joint', 'arthritis', 'osteo', 'fracture', 'spine']):
        return "Orthopedic"
    if any(k in name for k in ['lung', 'asthma', 'bronchitis', 'respiratory', 'pneumonia', 'tb', 'tuberculosis']):
        return "Pulmonologist"
    if any(k in name for k in ['stomach', 'gastric', 'ulcer', 'bowel', 'liver', 'hepatitis', 'jaundice', 'digestive', 'gerd']):
        return "Gastroenterologist"
    if any(k in name for k in ['kidney', 'renal', 'urinary']):
        return "Nephrologist"
    if any(k in name for k in ['sugar', 'diabetes', 'thyroid', 'hormone', 'endocrine']):
        return "Endocrinologist"
    if any(k in name for k in ['woman', 'pregnancy', 'cervical', 'ovarian', 'uterus', 'gyno', 'pcos']):
        return "Gynecologist"
    if any(k in name for k in ['child', 'pediatric']):
        return "Pediatrician"
    if any(k in name for k in ['mental', 'depression', 'anxiety', 'schizophrenia', 'bipolar']):
        return "Psychiatrist"
    if any(k in name for k in ['tooth', 'dental', 'gum']):
        return "Dentist"
    if any(k in name for k in ['cancer', 'tumor', 'leukemia']):
        return "Oncologist"
    if any(k in name for k in ['blood', 'anemia']):
        return "Hematologist"
    if any(k in name for k in ['ear', 'nose', 'throat', 'sinus']):
        return "ENT Specialist"
    if any(k in name for k in ['allergy', 'allergic']):
        return "Allergist"
    
    return "General Physician"

@router.get("/recommendations/doctors", response_model=List[schemas.DoctorResponse])
def recommend_doctors(
    disease: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db = Depends(get_db)
):
    if disease and disease.strip():
        # Lookup the specialization for the disease from our new mapped collection
        mapping = db.disease_specialty_mapping.find_one({"disease_name": {"$regex": disease, "$options": "i"}})
        
        # If no mapping is found in DB, run our keyword fallback on the query string
        specialization_name = mapping['specialization_name'] if mapping else assign_specialty_fallback(disease)

        # Fetch doctors that match EITHER the exact specialization OR are a General Physician
        query = {
            "is_verified": True,
            "$or": [
                {"specialization": {"$regex": specialization_name, "$options": "i"}},
                {"specialization": {"$regex": "General Physician", "$options": "i"}}
            ]
        }
        doctors = list(db.doctors.find(query))
        if not doctors:
            doctors = list(db.doctors.find({"is_verified": True}))
    else:
        specialization_name = None
        doctors = list(db.doctors.find({"is_verified": True}))
        # Fallback to all doctors if none are marked verified
        if not doctors:
            doctors = list(db.doctors.find())

    max_radius_km = 50.0
    max_experience = 30.0
    max_fee = 2000.0

    scored_doctors = []
    for doc in doctors:
        user = db.users.find_one({"_id": ObjectId(doc['user_id'])})
        if not user:
            continue
            
        formatted_doc = format_doctor(doc, user)
        score = 0.0
        
        # 1. Specialty Match Boost (Prioritize exact specialist over general physician)
        if specialization_name:
            doc_spec = doc.get('specialization', '').lower()
            target_spec = specialization_name.lower()
            if target_spec in doc_spec or doc_spec in target_spec:
                score += 100.0  # Exact match gets huge boost
            elif "general physician" in doc_spec:
                score += 50.0   # General physicians are decent fallbacks
            
        # 2. Distance Score
        distance_km = float('inf')
        if lat is not None and lon is not None and doc.get('latitude') is not None and doc.get('longitude') is not None:
            distance_km = haversine(lat, lon, doc['latitude'], doc['longitude'])
            dist_score = max(0, 1.0 - (distance_km / max_radius_km))
            score += dist_score * 10.0
        else:
            score += 2.0
            
        # 3. Rating Score
        rating_score = (doc.get('rating') or 0.0) / 5.0
        score += rating_score * 5.0

        # 4. Experience Score
        exp_score = min(1.0, (doc.get('experience_years') or 0) / max_experience)
        score += exp_score * 3.0

        # 5. Fee Score (Lower is better)
        fee = doc.get('consultation_fee') or 500.0
        fee_score = max(0, 1.0 - (fee / max_fee))
        score += fee_score * 2.0

        scored_doctors.append((score, formatted_doc))

    # Sort by score descending
    scored_doctors.sort(key=lambda x: x[0], reverse=True)
    return [doc for _, doc in scored_doctors]
