import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET", "paytrack-dev-secret")
DEV_USER_ID = os.getenv("DEV_USER_ID", "ae6fe46a-7e41-4d4c-813f-0250c2a0dea9")
