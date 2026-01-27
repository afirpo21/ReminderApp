import mysql.connector

# --- ⚠️ PASTE YOUR AWS DETAILS HERE ⚠️ ---
DB_HOST = "reminderdb.cnq24awgwbum.us-west-1.rds.amazonaws.com"
DB_USER = "aaronAdmin"
DB_PASS = "reminderdb123$"
DB_NAME = "reminderdb"

try:
    print("🔌 Connecting to AWS Database...")
    conn = mysql.connector.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME
    )
    cursor = conn.cursor()

    print("🛠️ Creating Users Table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    print("🛠️ Creating Reminders Table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255) NOT NULL,
        note TEXT,
        scheduled_at DATETIME NOT NULL,
        channel VARCHAR(10),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    print("✅ SUCCESS! Tables created in AWS Cloud Database.")
    cursor.close()
    conn.close()

except mysql.connector.Error as e:
    print(f"❌ Error: {e}")