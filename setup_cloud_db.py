import mysql.connector
from pathlib import Path

DB_HOST = "reminderdb.cnq24awgwbum.us-west-1.rds.amazonaws.com"
DB_USER = "aaronAdmin"
DB_PASS = "reminderdb123$"
INITIAL_DB = "mysql"
DB_NAME = "reminderdb"

try:
    print(f"🔌 Connecting to RDS Endpoint: {DB_HOST}...")
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=INITIAL_DB,
        connect_timeout=10
    )
    cursor = conn.cursor()

    print(f"🛠️ Creating database '{DB_NAME}'...")
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    cursor.execute(f"USE {DB_NAME}")

    print("📝 Executing schema.sql...")

    schema_path = Path(__file__).parent / "schema.sql"
    with open(schema_path, "r") as f:
        sql = f.read()

    for statement in sql.split(";"):
        stmt = statement.strip()
        if stmt:
            cursor.execute(stmt)

    conn.commit()
    cursor.close()
    conn.close()

    print("✅ SUCCESS! Database and tables created.")

except mysql.connector.Error as e:
    print(f"❌ MySQL Error: {e}")

