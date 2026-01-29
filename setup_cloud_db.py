"""
Database setup script for Reminder App
Creates the database and tables on AWS RDS MySQL instance
"""

import mysql.connector
from pathlib import Path

# Database configuration
DB_CONFIG = {
    "host": "reminderdb.cnq24awgwbum.us-west-1.rds.amazonaws.com",
    "user": "aaronAdmin",
    "password": "reminderdb123$",
    "database": "mysql",  # Connect to default DB first
    "connect_timeout": 10
}

DB_NAME = "reminderdb"


def execute_schema_file(cursor, schema_path):
    """
    Reads and executes SQL statements from schema file.
    
    Args:
        cursor: MySQL cursor object
        schema_path: Path to schema.sql file
    """
    print("📝 Executing schema.sql...")
    
    with open(schema_path, "r") as f:
        sql = f.read()
    
    # Execute each SQL statement separately
    for statement in sql.split(";"):
        stmt = statement.strip()
        if stmt:  # Skip empty statements
            cursor.execute(stmt)
    
    print("✅ Schema executed successfully")


def setup_database():
    """
    Main function to set up the database and tables.
    """
    conn = None
    cursor = None
    
    try:
        print(f"🔌 Connecting to RDS Endpoint: {DB_CONFIG['host']}...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print(f"🛠️ Creating database '{DB_NAME}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cursor.execute(f"USE {DB_NAME}")
        
        # Get path to schema file
        schema_path = Path(__file__).parent / "schema.sql"
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        # Execute schema
        execute_schema_file(cursor, schema_path)
        
        # Commit all changes
        conn.commit()
        
        print("✅ SUCCESS! Database and tables created.")
        
    except mysql.connector.Error as e:
        print(f"❌ MySQL Error: {e}")
        if conn:
            conn.rollback()
        raise
        
    except FileNotFoundError as e:
        print(f"❌ File Error: {e}")
        raise
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        if conn:
            conn.rollback()
        raise
        
    finally:
        # Clean up connections
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("🔌 Database connection closed")


if __name__ == "__main__":
    setup_database()
