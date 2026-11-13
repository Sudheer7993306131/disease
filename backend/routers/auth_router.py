from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId

from database import get_db
import schemas
import auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db = Depends(get_db)):
    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    
    new_user_dict = {
        "name": user.name,
        "email": user.email,
        "password_hash": hashed_password,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    result = db.users.insert_one(new_user_dict)
    new_user_dict["id"] = str(result.inserted_id)
    
    if user.role == "DOCTOR":
        # Create a blank doctor profile linked to user_id
        new_doctor_dict = {
            "user_id": str(result.inserted_id),
            "specialization": user.specialization if user.specialization else "General Physician",
            "qualification": "",
            "experience_years": 0,
            "hospital": "",
            "consultation_fee": 500,
            "rating": 0.0,
            "latitude": None,
            "longitude": None,
            "is_verified": False, # Requires Admin approval
            "online_consultation": True,
            "offline_consultation": True
        }
        db.doctors.insert_one(new_doctor_dict)

    return new_user_dict

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = db.users.find_one({"email": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user["email"], "role": user.get("role"), "user_id": str(user["_id"])},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user = Depends(auth.get_current_active_user)):
    return current_user
