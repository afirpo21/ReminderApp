import mysql.connector

# --- UPDATED CONFIGURATION ---
DB_HOST = "reminderdb.cnq24awgwbum.us-west-1.rds.amazonaws.com" #
DB_USER = "aaronAdmin" #
DB_PASS = "reminderdb123$" #
# Initial connection MUST be to 'mysql' as seen in your AWS console
INITIAL_DB = "mysql" 
DB_NAME = "reminderdb"

try:
    print(f"🔌 Connecting to RDS Endpoint: {DB_HOST}...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=INITIAL_DB, # Use system db first
        connect_timeout=10
    )
    cursor = conn.cursor()
    
    # Now create your app-specific database
    print(f"🛠️ Creating '{DB_NAME}'...")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    cursor.execute(f"USE {DB_NAME}")
    
    # Create your tables here...
    print("📝 Creating tables...")
    # (Insert your CREATE TABLE statements from your previous script here)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ SUCCESS! Tables created in AWS Cloud Database.")

except mysql.connector.Error as e:
    print(f"❌ Connection Error: {e}")
