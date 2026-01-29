import mysql.connector
from flask import Flask, render_template, request, redirect, url_for, session, flash
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = "secret_key_for_testing"

# --- MYSQL CONFIGURATION ---
DB_CONFIG = {
    "host": "reminderdb.cnq24awgwbum.us-west-1.rds.amazonaws.com",
    "database": "reminderdb",
    "user": "aaronAdmin",
    "password": "reminderdb123$"
}


def get_db_connection():
    """Establishes and returns a MySQL database connection."""
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


# --- AUTH ROUTES ---

@app.route('/')
def home():
    """Home page - redirects to dashboard if logged in, otherwise shows login."""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """Handle user registration."""
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
    """Handle user login."""
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
    """Handle user logout."""
    session.clear()
    return redirect(url_for('home'))


# --- DASHBOARD & REMINDER ROUTES ---

@app.route('/dashboard')
def dashboard():
    """Main dashboard view with all reminders."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    # Fetch all reminders for the user
    query = "SELECT * FROM reminders WHERE user_id = %s ORDER BY scheduled_at ASC"
    all_reminders = execute_query(query, (session['user_id'],), fetch_all=True)
    
    if all_reminders is None:
        return "Database Error"
    
    # Filter upcoming tasks (exclude tasks older than 1 hour)
    now = datetime.now()
    one_hour_ago = now - timedelta(hours=1)
    upcoming_reminders = [
        r for r in all_reminders 
        if r['scheduled_at'] > one_hour_ago
    ][:5]
    
    # Get user preferences
    query = "SELECT reminder_frequency, default_email FROM users WHERE id = %s"
    user_data = execute_query(query, (session['user_id'],), fetch_one=True)
    
    user_frequency = user_data['reminder_frequency'] if user_data else 'Standard'
    user_email = user_data['default_email'] if user_data else ''
    
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
    """Update user's reminder frequency preference."""
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
    """Update user's default email preference."""
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
    """Create a new reminder."""
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
    execute_query(
        query,
        (session['user_id'], title, note, date, channel, target, frequency),
        commit=True
    )
    
    flash("Reminder set!")
    return redirect(url_for('dashboard'))


@app.route('/update_reminder', methods=['POST'])
def update_reminder():
    """Update an existing reminder."""
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
    """Delete a reminder."""
    if 'user_id' not in session:
        return redirect(url_for('home'))
    
    query = "DELETE FROM reminders WHERE id = %s AND user_id = %s"
    execute_query(query, (reminder_id, session['user_id']), commit=True)
    
    flash("Reminder deleted.")
    return redirect(url_for('dashboard'))


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)
