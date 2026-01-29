import os
import mysql.connector
from flask import Flask, render_template, request, redirect, url_for, session, flash
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "secret_key_for_testing")

# --- DATABASE CONFIGURATION ---
# Set ENV=production on your AWS server, leave unset for local development
if os.environ.get('ENV') == 'production':
    DB_CONFIG = {
        "host": "reminderdb.cnq24awgwbum.us-west-1.rds.amazonaws.com",
        "database": "reminderdb",
        "user": "aaronAdmin",
        "password": "reminderdb123$"
    }
else:
    # Local development configuration
    DB_CONFIG = {
        "host": "localhost",
        "database": "reminderdb",
        "user": "root",
        "password": "Funny123$"
    }


def get_db_connection():
    """Establishes and returns a database connection."""
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except mysql.connector.Error as e:
        print(f"❌ Database Error: {e}")
        return None


def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Helper function to execute database queries.
    
    Args:
        query: SQL query string
        params: Query parameters (tuple or list)
        fetch_one: Return single row as dict
        fetch_all: Return all rows as list of dicts
        commit: Commit the transaction
    
    Returns:
        Query result or None
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(query, params or ())
        
        result = None
        if fetch_one:
            result = cur.fetchone()
        elif fetch_all:
            result = cur.fetchall()
        
        if commit:
            conn.commit()
        
        return result
    except mysql.connector.Error as e:
        print(f"❌ Query Error: {e}")
        return None
    finally:
        cur.close()
        conn.close()


def get_user_preferences(user_id):
    """Retrieves user frequency and default email preferences."""
    query = "SELECT reminder_frequency, default_email FROM users WHERE id = %s"
    user_row = execute_query(query, (user_id,), fetch_one=True)
    
    if user_row:
        return user_row.get('reminder_frequency', 'Standard'), user_row.get('default_email', '')
    return 'Standard', ''


def get_all_reminders(user_id):
    """Retrieves all reminders for a user, sorted by scheduled time."""
    query = "SELECT * FROM reminders WHERE user_id = %s ORDER BY scheduled_at ASC"
    reminders = execute_query(query, (user_id,), fetch_all=True)
    return reminders if reminders else []


def get_upcoming_reminders(all_reminders, limit=5):
    """Filters and returns upcoming reminders (future tasks within 1 hour window)."""
    now = datetime.now()
    one_hour_ago = now - timedelta(hours=1)
    upcoming = [r for r in all_reminders if r['scheduled_at'] > one_hour_ago]
    return upcoming[:limit]


# --- AUTHENTICATION ROUTES ---

@app.route('/')
def home():
    """Landing page - redirects to dashboard if logged in."""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """User registration."""
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        
        query = "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)"
        result = execute_query(query, (name, email, password), commit=True)
        
        if result is not None:
            flash("Account created! Please login.")
            return redirect(url_for('home'))
        else:
            flash("Error creating account. Email may already be in use.")
    
    return render_template('signup.html')


@app.route('/login', methods=['POST'])
def login():
    """User login."""
    email = request.form['email']
    password = request.form['password']
    
    query = "SELECT * FROM users WHERE email = %s AND password = %s"
    user = execute_query(query, (email, password), fetch_one=True)
    
    if user:
        session['user_id'] = user['id']
        session['name'] = user['name']
        session['reminder_frequency'] = user.get('reminder_frequency', 'Standard')
        session['default_email'] = user.get('default_email', '')
        return redirect(url_for('dashboard'))
    
    flash("Invalid email or password")
    return redirect(url_for('home'))


@app.route('/logout')
def logout():
    """User logout."""
    session.clear()
    return redirect(url_for('home'))


# --- DASHBOARD AND REMINDER ROUTES ---

@app.route('/dashboard')
def dashboard():
    """Main dashboard view."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    user_id = session['user_id']
    all_reminders = get_all_reminders(user_id)
    upcoming_reminders = get_upcoming_reminders(all_reminders)
    user_frequency, user_email = get_user_preferences(user_id)
    
    return render_template(
        'dashboard.html',
        reminders=all_reminders,
        upcoming_reminders=upcoming_reminders,
        name=session['name'],
        user_frequency=user_frequency,
        user_email=user_email
    )


@app.route('/set_frequency', methods=['POST'])
def set_frequency():
    """Updates user's reminder frequency preference."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    frequency = request.form['reminder_frequency']
    query = "UPDATE users SET reminder_frequency=%s WHERE id=%s"
    execute_query(query, (frequency, session['user_id']), commit=True)
    
    session['reminder_frequency'] = frequency
    flash("Frequency preference updated!")
    return redirect(url_for('dashboard'))


@app.route('/set_default_email', methods=['POST'])
def set_default_email():
    """Updates user's default email preference."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    email = request.form['default_email']
    query = "UPDATE users SET default_email=%s WHERE id=%s"
    execute_query(query, (email, session['user_id']), commit=True)
    
    session['default_email'] = email
    flash("Default email updated!")
    return redirect(url_for('dashboard'))


@app.route('/create_reminder', methods=['POST'])
def create_reminder():
    """Creates a new reminder."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    title = request.form['title']
    date = request.form['date']
    note = request.form['note']
    channel = request.form['channel']
    target = request.form['target']
    frequency = request.form.get('frequency', session.get('reminder_frequency', 'Standard'))
    
    query = """
        INSERT INTO reminders 
        (user_id, title, note, scheduled_at, channel, target_contact, frequency) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    execute_query(query, (session['user_id'], title, note, date, channel, target, frequency), commit=True)
    
    flash("Reminder set!")
    return redirect(url_for('dashboard'))


@app.route('/update_reminder', methods=['POST'])
def update_reminder():
    """Updates an existing reminder."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    reminder_id = request.form['reminder_id']
    title = request.form['title']
    date = request.form['date']
    note = request.form['note']
    channel = request.form['channel']
    target = request.form['target']
    frequency = request.form.get('frequency', session.get('reminder_frequency', 'Standard'))
    
    query = """
        UPDATE reminders 
        SET title=%s, note=%s, scheduled_at=%s, channel=%s, target_contact=%s, frequency=%s 
        WHERE id=%s AND user_id=%s
    """
    execute_query(
        query,
        (title, note, date, channel, target, frequency, reminder_id, session['user_id']),
        commit=True
    )
    
    flash("Reminder updated!")
    return redirect(url_for('dashboard'))


@app.route('/delete_reminder/<int:reminder_id>', methods=['POST'])
def delete_reminder(reminder_id):
    """Deletes a reminder."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    query = "DELETE FROM reminders WHERE id = %s AND user_id = %s"
    execute_query(query, (reminder_id, session['user_id']), commit=True)
    
    flash("Reminder deleted.")
    return redirect(url_for('dashboard'))


if __name__ == '__main__':
    app.run(debug=True, port=5001)
