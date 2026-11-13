import os
import sys
from bson import ObjectId

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db
import auth

if __name__ == "__main__":
    print("MediCURE Admin Setup Tool")
    email = input("Enter the email of an existing user to upgrade to ADMIN: ").strip()
    
    user = db.users.find_one({"email": email})
    if not user:
        print(f"Error: No user found with email '{email}'. Please register them via the frontend first.")
        sys.exit(1)
        
    db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "ADMIN"}})
    print(f"Success! {email} has been upgraded to ADMIN role.")
