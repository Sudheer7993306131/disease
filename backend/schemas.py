from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "USER" # USER or DOCTOR or ADMIN
    specialization: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: Optional[datetime] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    hospital: Optional[str] = None
    clinic_address: Optional[str] = None
    consultation_fee: Optional[float] = None
    rating: Optional[float] = None
    doctor_id: Optional[str] = None
    about: Optional[str] = None
    is_verified: Optional[bool] = None
    class Config:
        from_attributes = True

class DoctorProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    hospital: Optional[str] = None
    clinic_address: Optional[str] = None
    consultation_fee: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    online_consultation: Optional[bool] = True
    offline_consultation: Optional[bool] = True
    about: Optional[str] = None

class DoctorResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    hospital: Optional[str] = None
    clinic_address: Optional[str] = None
    consultation_fee: Optional[float] = None
    rating: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_verified: bool
    online_consultation: bool
    offline_consultation: bool
    about: Optional[str] = None
    user: UserResponse
    class Config:
        from_attributes = True

class ConsultationCreate(BaseModel):
    doctor_id: str
    prediction_id: Optional[str] = None
    type: str = "ONLINE" # ONLINE or OFFLINE
    scheduled_time: Optional[datetime] = None

class ConsultationStatusUpdate(BaseModel):
    status: str
    consultation_code: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None
    rejection_reason: Optional[str] = None

class ConsultationResponse(BaseModel):
    id: str
    user_id: str
    doctor_id: str
    prediction_id: Optional[str] = None
    status: str
    type: str
    scheduled_time: Optional[datetime] = None
    created_at: datetime
    other_party_name: Optional[str] = None
    consultation_code: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None
    rejection_reason: Optional[str] = None
    has_prescription: Optional[bool] = False
    prescription_id: Optional[str] = None
    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    rating: float
    comment: str

class ReviewResponse(BaseModel):
    id: str
    doctor_id: str
    user_id: str
    user_name: str
    rating: float
    comment: str
    created_at: datetime
    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    id: str
    consultation_id: str
    sender_id: str
    text: str
    is_read: bool
    timestamp: datetime
    class Config:
        from_attributes = True

class MedicationItem(BaseModel):
    name: str
    dosage: str # e.g. "500 mg"
    frequency: str # e.g. "1-0-1 (Morning & Night)"
    duration: str # e.g. "5 days"
    instructions: Optional[str] = "After food"

class PrescriptionCreate(BaseModel):
    consultation_id: Optional[str] = None
    patient_id: str
    patient_name: str
    diagnosis: str
    medications: List[MedicationItem]
    lab_tests: Optional[List[str]] = []
    diet_advice: Optional[str] = None
    general_notes: Optional[str] = None
    follow_up_date: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    consultation_id: Optional[str] = None
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    doctor_specialization: Optional[str] = "Specialist Physician"
    doctor_hospital: Optional[str] = None
    doctor_clinic: Optional[str] = None
    diagnosis: str
    medications: List[MedicationItem]
    lab_tests: Optional[List[str]] = []
    diet_advice: Optional[str] = None
    general_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class DiagnosticRecord(BaseModel):
    id: str
    user_id: str
    symptoms: List[str]
    predicted_disease: str
    confidence: float
    severity: Optional[str] = "Moderate"
    model_name: Optional[str] = "Random Forest"
    created_at: datetime

class DiagnosticHistoryCreate(BaseModel):
    symptoms: List[str]
    predicted_disease: str
    confidence: float
    severity: Optional[str] = "Moderate"
    model_name: Optional[str] = "Random Forest"

class EmergencyProfile(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    notes: Optional[str] = None

