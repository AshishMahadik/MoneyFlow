import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

dsn = os.getenv("DATABASE_URL")
print(f"Testing connection to: {dsn.split('@')[1] if dsn and '@' in dsn else 'Unknown'}")

try:
    conn = psycopg2.connect(dsn, connect_timeout=10)
    print("✅ Successfully connected to Neon!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(f"Server version: {cur.fetchone()}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Connection failed!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
