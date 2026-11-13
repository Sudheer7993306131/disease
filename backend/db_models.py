from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    USER = "USER"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"

class ConsultationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class ConsultationType(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default=RoleEnum.USER)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    predictions = relationship("Prediction", back_populates="user")
    consultations_as_user = relationship("Consultation", foreign_keys="Consultation.user_id", back_populates="user")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    specialization = Column(String, nullable=False, index=True)
    qualification = Column(String)
    experience_years = Column(Integer)
    hospital = Column(String)
    clinic_address = Column(Text)
    consultation_fee = Column(Float)
    rating = Column(Float, default=0.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False)
    online_consultation = Column(Boolean, default=True)
    offline_consultation = Column(Boolean, default=True)

    user = relationship("User", back_populates="doctor_profile")
    consultations = relationship("Consultation", foreign_keys="Consultation.doctor_id", back_populates="doctor")
    reviews = relationship("Review", back_populates="doctor")

class Specialization(Base):
    __tablename__ = "specializations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class DiseaseSpecialtyMapping(Base):
    __tablename__ = "disease_specialty_mapping"
    id = Column(Integer, primary_key=True, index=True)
    disease_name = Column(String, index=True, nullable=False)
    specialization_name = Column(String, nullable=False)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    predicted_disease = Column(String, nullable=False)
    confidence = Column(Float)
    symptoms_json = Column(Text)  # Store as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
    consultation = relationship("Consultation", back_populates="prediction", uselist=False)

class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)
    status = Column(String, default=ConsultationStatus.PENDING)
    type = Column(String, default=ConsultationType.ONLINE)
    scheduled_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="consultations_as_user")
    doctor = relationship("Doctor", foreign_keys=[doctor_id], back_populates="consultations")
    prediction = relationship("Prediction", back_populates="consultation")
    messages = relationship("Message", back_populates="consultation")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    consultation = relationship("Consultation", back_populates="messages")
    sender = relationship("User")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    rating = Column(Float, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="reviews")
    user = relationship("User")
