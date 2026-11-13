from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
import os

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

PRIMARY_URL = os.getenv("MONGODB_URL", "")
FALLBACK_URL = os.getenv("MONGODB_FALLBACK_URL", "")
DB_NAME = os.getenv("MONGODB_DB_NAME", "medicure_db")

_client = None
_db = None

def get_mongo_client():
    global _client, _db
    if _client is not None:
        try:
            _client.admin.command('ping')
            return _client
        except Exception:
            _client = None

    if not PRIMARY_URL:
        raise RuntimeError("MONGODB_URL is not set. Configure it in backend/.env.")

    # Try SRV connection first
    try:
        c = MongoClient(PRIMARY_URL, serverSelectionTimeoutMS=10000, tlsCAFile=certifi.where())
        c.admin.command('ping')
        print("Connected to MongoDB Atlas via SRV!")
        _client = c
        _db = _client[DB_NAME]
        return _client
    except Exception as e1:
        print(f"SRV connection failed ({e1}), trying direct replica set...")
        if not FALLBACK_URL:
            raise e1

    # Try direct connection string fallback
    try:
        c = MongoClient(FALLBACK_URL, serverSelectionTimeoutMS=10000, tlsCAFile=certifi.where())
        c.admin.command('ping')
        print("Connected to MongoDB Atlas via direct replica set fallback!")
        _client = c
        _db = _client[DB_NAME]
        return _client
    except Exception as e2:
        print(f"Direct connection fallback failed ({e2})")
        raise e2

class DatabaseProxy:
    """Dynamic proxy to ensure MongoDB is connected on demand and never bricked."""
    def _get_target(self):
        global _db
        if _db is None:
            get_mongo_client()
        return _db

    def __getattr__(self, name):
        target = self._get_target()
        return getattr(target, name)

    def __getitem__(self, name):
        target = self._get_target()
        return target[name]

# Initialize on import
try:
    get_mongo_client()
except Exception as e:
    print(f"Warning: Initial MongoDB connection could not be established: {e}")

db = DatabaseProxy()

def get_db():
    global _db
    if _db is None:
        get_mongo_client()
    yield db
