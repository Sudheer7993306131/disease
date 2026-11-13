from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
import auth
from database import get_db

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: Optional[str] = "GENERAL"  # MESSAGE_REQUEST, NEW_MESSAGE, CONSULTATION_REQUEST, REQUEST_ACCEPTED, REQUEST_REJECTED
    sender_id: Optional[str] = None
    sender_name: Optional[str] = None
    reference_id: Optional[str] = None

class NotificationAction(BaseModel):
    action: str  # ACCEPT or REJECT

@router.get("")
def get_notifications(current_user = Depends(auth.get_current_active_user), db = Depends(get_db)):
    notifications = list(db.notifications.find({"user_id": current_user['id']}).sort("created_at", -1))
    for n in notifications:
        n['id'] = str(n['_id'])
        del n['_id']
    return notifications

@router.post("")
def create_notification(notif: NotificationCreate, current_user = Depends(auth.get_current_active_user), db = Depends(get_db)):
    # Check if a pending message request already exists from this user to recipient
    if notif.type == "MESSAGE_REQUEST":
        existing = db.notifications.find_one({
            "user_id": notif.user_id,
            "sender_id": current_user['id'],
            "type": "MESSAGE_REQUEST",
            "status": "PENDING"
        })
        if existing:
            existing['id'] = str(existing['_id'])
            del existing['_id']
            return existing

    new_notif = {
        "user_id": notif.user_id,
        "title": notif.title,
        "message": notif.message,
        "type": notif.type or "GENERAL",
        "sender_id": notif.sender_id or current_user['id'],
        "sender_name": notif.sender_name or current_user.get('name', 'User'),
        "reference_id": notif.reference_id,
        "status": "PENDING" if notif.type == "MESSAGE_REQUEST" else "NONE",
        "created_at": datetime.utcnow(),
        "read": False
    }
    res = db.notifications.insert_one(new_notif)
    new_notif['id'] = str(res.inserted_id)
    del new_notif['_id']
    return new_notif

@router.post("/{notif_id}/action")
def handle_notification_action(
    notif_id: str, 
    action_data: NotificationAction, 
    current_user = Depends(auth.get_current_active_user), 
    db = Depends(get_db)
):
    notif = db.notifications.find_one({"_id": ObjectId(notif_id), "user_id": current_user['id']})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    action = action_data.action.upper()
    if action not in ["ACCEPT", "REJECT"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    new_status = "ACCEPTED" if action == "ACCEPT" else "REJECTED"
    db.notifications.update_one({"_id": ObjectId(notif_id)}, {"$set": {"status": new_status, "read": True}})
    
    sender_id = notif.get("sender_id")
    if sender_id:
        doctor_name = current_user.get('name', 'Doctor')
        if action == "ACCEPT":
            # Record direct message permission in message_permissions collection
            db.message_permissions.update_one(
                {"user_id": sender_id, "doctor_id": current_user['id']},
                {"$set": {"status": "ACCEPTED", "updated_at": datetime.utcnow()}},
                upsert=True
            )
            # Create acceptance notification for the requester
            db.notifications.insert_one({
                "user_id": sender_id,
                "title": "Message Request Accepted",
                "message": f"Dr. {doctor_name} accepted your message request! You can now chat directly.",
                "type": "REQUEST_ACCEPTED",
                "sender_id": current_user['id'],
                "sender_name": doctor_name,
                "reference_id": current_user['id'],
                "status": "ACCEPTED",
                "created_at": datetime.utcnow(),
                "read": False
            })
        elif action == "REJECT":
            db.message_permissions.update_one(
                {"user_id": sender_id, "doctor_id": current_user['id']},
                {"$set": {"status": "REJECTED", "updated_at": datetime.utcnow()}},
                upsert=True
            )
            db.notifications.insert_one({
                "user_id": sender_id,
                "title": "Message Request Declined",
                "message": f"Dr. {doctor_name} was unable to accept your message request at this time.",
                "type": "REQUEST_REJECTED",
                "sender_id": current_user['id'],
                "sender_name": doctor_name,
                "reference_id": current_user['id'],
                "status": "REJECTED",
                "created_at": datetime.utcnow(),
                "read": False
            })
            
    return {"message": f"Request {new_status.lower()} successfully", "status": new_status}

@router.get("/permissions")
def get_user_permissions(current_user = Depends(auth.get_current_active_user), db = Depends(get_db)):
    """Returns list of doctor IDs that this user is allowed to message or has pending requests with."""
    user_id = current_user['id']
    if current_user.get('role') in ['DOCTOR', 'ADMIN']:
        return {"all_allowed": True, "accepted_doctors": [], "pending_doctors": []}
        
    permissions = list(db.message_permissions.find({"user_id": user_id}))
    accepted = [p['doctor_id'] for p in permissions if p.get('status') == 'ACCEPTED']
    
    # Also find pending message request notifications
    pending_notifs = list(db.notifications.find({
        "sender_id": user_id,
        "type": "MESSAGE_REQUEST",
        "status": "PENDING"
    }))
    pending = [p['user_id'] for p in pending_notifs]
    
    return {
        "all_allowed": False,
        "accepted_doctors": accepted,
        "pending_doctors": pending
    }

@router.delete("/{notif_id}")
def delete_notification(notif_id: str, current_user = Depends(auth.get_current_active_user), db = Depends(get_db)):
    res = db.notifications.delete_one({"_id": ObjectId(notif_id), "user_id": current_user['id']})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Deleted"}
