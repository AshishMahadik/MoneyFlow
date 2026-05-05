import os
import pg8000.native
import ssl
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

# Basic parsing for pg8000.native
# URL format: postgresql://user:pass@host:port/dbname
try:
    # Strip protocol and query params
    clean_url = db_url.split("://")[1].split("?")[0]
    user_pass, host_db = clean_url.split("@")
    user, password = user_pass.split(":")
    host_port, dbname = host_db.split("/")
    if ":" in host_port:
        host, port = host_port.split(":")
        port = int(port)
    else:
        host = host_port
        port = 5432
except Exception as e:
    print(f"❌ Failed to parse URL: {e}")
    exit(1)

print(f"Testing pg8000 connection to: {host}:{port}/{dbname}")

try:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    conn = pg8000.native.Connection(
        user=user,
        password=password,
        host=host,
        port=port,
        database=dbname,
        ssl_context=ssl_context,
        timeout=10
    )
    
    print("✅ Successfully connected to Neon via pg8000!")
    res = conn.run("SELECT version();")
    print(f"Server version: {res[0][0]}")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
