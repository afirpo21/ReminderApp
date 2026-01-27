#import setup_cloud_db
import mysql.connector
from flask import Flask, render_template, request, redirect, url_for, session, flash

app = Flask(__name__)
app.secret_key = "secret_key_for_testing"

# --- MYSQL CONFIGURATION ---
# DB_CONFIG = {
#     "host": setup_cloud_db.DB_HOST, #localhost
#     "database": setup_cloud_db.DB_NAME, #reminderdb
#     "user": setup_cloud_db.DB_USER, #root
#     "password": setup_cloud_db.DB_PASS #Funny123$
# }
DB_CONFIG = {
    "host": "localhost",
    "database": "reminderdb",
    "user": "root",
    "password": "Funny123$"
}

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as e:
        print(f"❌ Database Error: {e}")
        return None

# --- AUTH ROUTES ---

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name, email, password = request.form['name'], request.form['email'], request.form['password']
        conn = get_db_connection()
        if conn:
            cur = conn.cursor()
            try:
                cur.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)", (name, email, password))
                conn.commit()
                flash("Account created! Please login.")
                return redirect(url_for('home'))
            except mysql.connector.Error as e:
                flash(f"Error: {e}")
            finally:
                cur.close(); conn.close()
    return render_template('signup.html')

@app.route('/login', methods=['POST'])
def login():
    email, password = request.form['email'], request.form['password']
    conn = get_db_connection()
    if conn:
        cur = conn.cursor(dictionary=True) 
        cur.execute("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
        user = cur.fetchone()
        cur.close(); conn.close()
        if user:
            session['user_id'], session['name'] = user['id'], user['name']
            session['reminder_frequency'] = user.get('reminder_frequency', 'Standard')
            session['default_email'] = user.get('default_email', '')
            return redirect(url_for('dashboard'))
    flash("Invalid email or password")
    return redirect(url_for('home'))

# --- REMINDER LOGIC ---

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('home'))
    conn = get_db_connection()
    if conn:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM reminders WHERE user_id = %s ORDER BY scheduled_at ASC", (session['user_id'],))
        all_reminders = cur.fetchall()
        
        # Filter upcoming tasks (future tasks only)
        from datetime import datetime, timedelta
        now = datetime.now()
        one_hour_ago = now - timedelta(hours=1)
        upcoming_reminders = [r for r in all_reminders if r['scheduled_at'] > one_hour_ago][:5]
        
        # Get user frequency and default email
        cur.execute("SELECT reminder_frequency, default_email FROM users WHERE id = %s", (session['user_id'],))
        user_row = cur.fetchone()
        user_frequency = user_row['reminder_frequency'] if user_row else 'Standard'
        user_email = user_row['default_email'] if user_row else ''
        cur.close(); conn.close()
        return render_template('dashboard.html', 
                             reminders=all_reminders, 
                             upcoming_reminders=upcoming_reminders,
                             name=session['name'], 
                             user_frequency=user_frequency, 
                             user_email=user_email)
    return "Database Error"

@app.route('/set_frequency', methods=['POST'])
def set_frequency():
    if 'user_id' not in session: return redirect(url_for('home'))
    freq = request.form['reminder_frequency']
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("UPDATE users SET reminder_frequency=%s WHERE id=%s", (freq, session['user_id']))
        conn.commit()
        cur.close(); conn.close()
        session['reminder_frequency'] = freq
        flash("Frequency preference updated!")
    return redirect(url_for('dashboard'))

@app.route('/set_default_email', methods=['POST'])
def set_default_email():
    if 'user_id' not in session: return redirect(url_for('home'))
    email = request.form['default_email']
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("UPDATE users SET default_email=%s WHERE id=%s", (email, session['user_id']))
        conn.commit()
        cur.close(); conn.close()
        session['default_email'] = email
        flash("Default email updated!")
    return redirect(url_for('dashboard'))

@app.route('/create_reminder', methods=['POST'])
def create_reminder():
    if 'user_id' not in session: return redirect(url_for('home'))
    title, date, note, channel, target = request.form['title'], request.form['date'], request.form['note'], request.form['channel'], request.form['target']
    frequency = request.form.get('frequency', session.get('reminder_frequency', 'Standard'))
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("INSERT INTO reminders (user_id, title, note, scheduled_at, channel, target_contact, frequency) VALUES (%s, %s, %s, %s, %s, %s, %s)", 
                    (session['user_id'], title, note, date, channel, target, frequency))
        conn.commit()
        cur.close(); conn.close()
        flash("Reminder set!")
    return redirect(url_for('dashboard'))

@app.route('/update_reminder', methods=['POST'])
def update_reminder():
    if 'user_id' not in session: return redirect(url_for('home'))
    rid, title, date, note, channel, target = request.form['reminder_id'], request.form['title'], request.form['date'], request.form['note'], request.form['channel'], request.form['target']
    frequency = request.form.get('frequency', session.get('reminder_frequency', 'Standard'))
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("UPDATE reminders SET title=%s, note=%s, scheduled_at=%s, channel=%s, target_contact=%s, frequency=%s WHERE id=%s AND user_id=%s", 
                    (title, note, date, channel, target, frequency, rid, session['user_id']))
        conn.commit()
        cur.close(); conn.close()
        flash("Reminder updated!")
    return redirect(url_for('dashboard'))

@app.route('/delete_reminder/<int:reminder_id>', methods=['POST'])
def delete_reminder(reminder_id):
    if 'user_id' not in session: return redirect(url_for('home'))
    conn = get_db_connection()
    if conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM reminders WHERE id = %s AND user_id = %s", (reminder_id, session['user_id']))
        conn.commit()
        cur.close(); conn.close()
        flash("Reminder deleted.")
    return redirect(url_for('dashboard'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True, port=5001)