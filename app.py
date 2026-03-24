from flask import Flask, render_template, request, jsonify
import os
import json
import smtplib
from datetime import datetime
from email.message import EmailMessage

try:
    from openpyxl import Workbook, load_workbook
    EXCEL_EXPORT_AVAILABLE = True
except ImportError:
    Workbook = None
    load_workbook = None
    EXCEL_EXPORT_AVAILABLE = False

APP_DIR = os.path.dirname(__file__)
SUB_FILE = os.path.join(APP_DIR, 'submissions.json')
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'Desktop')
EXCEL_FILE = os.path.join(DESKTOP_DIR, 'feedback_submissions.xlsx')
EXCEL_HEADERS = ['name', 'email', 'course', 'rating', 'comments', 'consent', 'receivedAt']
MAX_SUBMISSIONS_PER_PERSON = 2
FEEDBACK_RECIPIENT = 's29911277@gmail.com'
SMTP_HOST = 'smtp.gmail.com'
SMTP_PORT = 587


def normalize_identity(value):
    return (value or '').strip().lower()


def count_matching_submissions(entries, name, email):
    normalized_name = normalize_identity(name)
    normalized_email = normalize_identity(email)
    return sum(
        1
        for entry in entries
        if normalize_identity(entry.get('name')) == normalized_name
        and normalize_identity(entry.get('email')) == normalized_email
    )

def ensure_submissions_file():
    if not os.path.exists(SUB_FILE):
        with open(SUB_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)


def ensure_excel_file():
    if not EXCEL_EXPORT_AVAILABLE:
        return

    os.makedirs(DESKTOP_DIR, exist_ok=True)
    if os.path.exists(EXCEL_FILE):
        return

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = 'Feedback'
    sheet.append(EXCEL_HEADERS)
    if os.path.exists(SUB_FILE):
        try:
            with open(SUB_FILE, 'r', encoding='utf-8') as f:
                existing_entries = json.load(f)
        except Exception:
            existing_entries = []
        for entry in existing_entries:
            sheet.append([entry.get(header, '') for header in EXCEL_HEADERS])
    workbook.save(EXCEL_FILE)


def append_submission_to_excel(entry):
    if not EXCEL_EXPORT_AVAILABLE:
        return

    ensure_excel_file()
    workbook = load_workbook(EXCEL_FILE)
    sheet = workbook.active
    sheet.append([entry.get(header, '') for header in EXCEL_HEADERS])
    workbook.save(EXCEL_FILE)


def format_feedback_email(entry):
    teachers = entry.get('teachers') or []
    teacher_comments = entry.get('teacherComments') or {}
    teacher_lines = []

    if teachers:
        for teacher in teachers:
            comment = (teacher_comments.get(teacher) or '').strip()
            teacher_lines.append(f'- {teacher}')
            if comment:
                teacher_lines.append(f'  Comment: {comment}')
    else:
        teacher_lines.append('- None selected')

    return '\n'.join([
        'A new feedback submission was received.',
        '',
        f"Name: {entry.get('name', '')}",
        f"Email: {entry.get('email', '')}",
        f"Course: {entry.get('course', '')}",
        f"Rating: {entry.get('rating', '')}",
        f"General comments: {entry.get('comments', '')}",
        f"Consent given: {entry.get('consent', '')}",
        f"Received at: {entry.get('receivedAt', '')}",
        '',
        'Selected teachers:',
        *teacher_lines
    ])


def send_feedback_email(entry):
    smtp_email = os.environ.get('FEEDBACK_SMTP_EMAIL', FEEDBACK_RECIPIENT)
    smtp_password = os.environ.get('FEEDBACK_SMTP_APP_PASSWORD', '')

    if not smtp_email or not smtp_password:
        raise RuntimeError('Email sending is not configured. Set FEEDBACK_SMTP_EMAIL and FEEDBACK_SMTP_APP_PASSWORD.')

    message = EmailMessage()
    message['Subject'] = f"New feedback from {entry.get('name', 'Student')}"
    message['From'] = smtp_email
    message['To'] = FEEDBACK_RECIPIENT
    message.set_content(format_feedback_email(entry))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(smtp_email, smtp_password)
        smtp.send_message(message)


app = Flask(__name__, static_folder='static', template_folder='templates')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json() or {}
    # basic validation
    if not data.get('name') or not data.get('course') or not data.get('rating'):
        return jsonify({'error': 'name, course and rating are required'}), 400

    ensure_submissions_file()
    try:
        with open(SUB_FILE, 'r', encoding='utf-8') as f:
            arr = json.load(f)
    except Exception:
        arr = []

    if count_matching_submissions(arr, data.get('name'), data.get('email')) >= MAX_SUBMISSIONS_PER_PERSON:
        return jsonify({'error': 'This name and email can only submit feedback twice.'}), 400

    entry = dict(data)
    entry['receivedAt'] = datetime.utcnow().isoformat() + 'Z'
    arr.append(entry)
    with open(SUB_FILE, 'w', encoding='utf-8') as f:
        json.dump(arr, f, indent=2, ensure_ascii=False)
    append_submission_to_excel(entry)
    send_feedback_email(entry)

    return jsonify({'ok': True})


@app.route('/submissions', methods=['GET'])
def submissions():
    ensure_submissions_file()
    with open(SUB_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)


if __name__ == '__main__':
    ensure_submissions_file()
    ensure_excel_file()
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False)
