from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import Dict, List
from bson import ObjectId
from datetime import datetime
import schemas
from database import get_db, db
import jwt
from auth import SECRET_KEY, ALGORITHM
import auth

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

def get_user_from_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email:
            user = db.users.find_one({"email": email})
            if user:
                user['id'] = str(user['_id'])
                return user
    except Exception:
        pass
    return None

@router.websocket("/ws/{consultation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    consultation_id: str,
    token: str = Query(...)
):
    user = get_user_from_token(token)
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return
        
    consultation = db.consultations.find_one({"_id": ObjectId(consultation_id)})
    if not consultation:
        await websocket.close(code=1008, reason="Consultation not found")
        return
        
    doctor = db.doctors.find_one({"_id": ObjectId(consultation['doctor_id'])})
    doc_user_id = doctor['user_id'] if doctor else None
    
    # Check authorization
    if user['id'] != consultation['user_id'] and user['id'] != doc_user_id and user['role'] != 'ADMIN':
        await websocket.close(code=1008, reason="Forbidden")
        return

    recipient_id = doc_user_id if user['id'] == consultation['user_id'] else consultation['user_id']

    await manager.connect(websocket, user['id'])

    try:
        while True:
            data = await websocket.receive_text()
            
            # Save message to DB
            new_msg = {
                "consultation_id": consultation_id,
                "sender_id": user['id'],
                "text": data,
                "timestamp": datetime.utcnow()
            }
            db.messages.insert_one(new_msg)
            
            msg_payload = f"{user['name']}: {data}"
            await manager.send_personal_message(msg_payload, recipient_id)
            
    except WebSocketDisconnect:
        manager.disconnect(user['id'])

@router.get("/history/{consultation_id}", response_model=List[schemas.MessageResponse])
def get_chat_history(
    consultation_id: str,
    db_conn = Depends(get_db)
):
    messages = list(db_conn.messages.find({"consultation_id": consultation_id}).sort("timestamp", 1))
    for m in messages:
        m['id'] = str(m['_id'])
    return messages

@router.websocket("/ws/direct/{recipient_id}")
async def direct_websocket_endpoint(
    websocket: WebSocket,
    recipient_id: str,
    token: str = Query(...)
):
    user = get_user_from_token(token)
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return

    recipient = db.users.find_one({"_id": ObjectId(recipient_id)})
    if not recipient:
        await websocket.close(code=1008, reason="Recipient not found")
        return

    await manager.connect(websocket, user['id'])

    try:
        while True:
            data = await websocket.receive_text()
            
            # Check if either user has blocked the other
            is_blocked = db.blocked_users.find_one({
                "$or": [
                    {"user_id": user['id'], "blocked_user_id": recipient_id},
                    {"user_id": recipient_id, "blocked_user_id": user['id']}
                ]
            })
            if is_blocked:
                await manager.send_personal_message("System: You cannot send messages in a blocked conversation.", user['id'])
                continue

            new_msg = {
                "sender_id": user['id'],
                "recipient_id": recipient_id,
                "text": data,
                "is_read": False,
                "timestamp": datetime.utcnow()
            }
            db.direct_messages.insert_one(new_msg)
            
            # Send notification for recipient
            db.notifications.insert_one({
                "user_id": recipient_id,
                "title": f"New message from {user.get('name', 'User')}",
                "message": data if len(data) <= 80 else data[:77] + "...",
                "type": "NEW_MESSAGE",
                "sender_id": user['id'],
                "sender_name": user.get('name', 'User'),
                "reference_id": user['id'],
                "status": "NONE",
                "created_at": datetime.utcnow(),
                "read": False
            })

            msg_payload = f"{user['name']}: {data}"
            await manager.send_personal_message(msg_payload, recipient_id)
            
    except WebSocketDisconnect:
        manager.disconnect(user['id'])

@router.get("/direct-history/{recipient_id}")
def get_direct_history(
    recipient_id: str,
    db_conn = Depends(get_db),
    current_user = Depends(auth.get_current_active_user)
):
    user_id = current_user['id']
    messages = list(db_conn.direct_messages.find({
        "$or": [
            {"sender_id": user_id, "recipient_id": recipient_id},
            {"sender_id": recipient_id, "recipient_id": user_id}
        ]
    }).sort("timestamp", 1))
    
    for m in messages:
        m['id'] = str(m['_id'])
        del m['_id']
    return messages

@router.get("/recent-contacts")
def get_recent_contacts(
    current_user = Depends(auth.get_current_active_user),
    db_conn = Depends(get_db)
):
    """Returns only users who current_user has actively exchanged messages with."""
    user_id = current_user['id']
    
    # 1. Distinct user IDs from direct messages
    sent_to = db_conn.direct_messages.distinct("recipient_id", {"sender_id": user_id})
    received_from = db_conn.direct_messages.distinct("sender_id", {"recipient_id": user_id})
    contact_ids = list(set(sent_to + received_from))
    
    # 2. Blocked users
    blocked_by_me = [b["blocked_user_id"] for b in db_conn.blocked_users.find({"user_id": user_id})]
    blocked_me = [b["user_id"] for b in db_conn.blocked_users.find({"blocked_user_id": user_id})]
    
    results = []
    for cid in contact_ids:
        try:
            u = db_conn.users.find_one({"_id": ObjectId(cid)})
            if not u:
                continue
            
            # Find latest message
            last_msg = list(db_conn.direct_messages.find({
                "$or": [
                    {"sender_id": user_id, "recipient_id": cid},
                    {"sender_id": cid, "recipient_id": user_id}
                ]
            }).sort("timestamp", -1).limit(1))
            
            last_text = last_msg[0]["text"] if last_msg else ""
            last_time = last_msg[0]["timestamp"].isoformat() if last_msg else None
            
            results.append({
                "id": str(u["_id"]),
                "name": u.get("name", "User"),
                "email": u.get("email"),
                "role": u.get("role", "USER"),
                "last_message": last_text,
                "timestamp": last_time,
                "is_blocked": str(u["_id"]) in blocked_by_me,
                "has_blocked_me": str(u["_id"]) in blocked_me
            })
        except Exception:
            continue
            
    # Sort contacts by latest message timestamp descending
    results.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    return results

@router.delete("/direct-history/{recipient_id}")
def delete_direct_history(
    recipient_id: str,
    current_user = Depends(auth.get_current_active_user),
    db_conn = Depends(get_db)
):
    user_id = current_user['id']
    res = db_conn.direct_messages.delete_many({
        "$or": [
            {"sender_id": user_id, "recipient_id": recipient_id},
            {"sender_id": recipient_id, "recipient_id": user_id}
        ]
    })
    return {"message": "Chat history deleted successfully", "deleted_count": res.deleted_count}

@router.delete("/history/{consultation_id}")
def delete_consultation_history(
    consultation_id: str,
    current_user = Depends(auth.get_current_active_user),
    db_conn = Depends(get_db)
):
    res = db_conn.messages.delete_many({"consultation_id": consultation_id})
    return {"message": "Consultation messages deleted", "deleted_count": res.deleted_count}

@router.post("/block/{target_user_id}")
def block_user(
    target_user_id: str,
    current_user = Depends(auth.get_current_active_user),
    db_conn = Depends(get_db)
):
    user_id = current_user['id']
    db_conn.blocked_users.update_one(
        {"user_id": user_id, "blocked_user_id": target_user_id},
        {"$set": {"created_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "User blocked successfully"}

@router.delete("/block/{target_user_id}")
def unblock_user(
    target_user_id: str,
    current_user = Depends(auth.get_current_active_user),
    db_conn = Depends(get_db)
):
    user_id = current_user['id']
    db_conn.blocked_users.delete_one({"user_id": user_id, "blocked_user_id": target_user_id})
    return {"message": "User unblocked successfully"}

@router.get("/blocked")
def get_blocked_users(
    current_user = Depends(auth.get_current_active_user),
    db_conn = Depends(get_db)
):
    user_id = current_user['id']
    blocked = list(db_conn.blocked_users.find({"user_id": user_id}))
    return [b["blocked_user_id"] for b in blocked]
