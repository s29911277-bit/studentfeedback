from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime
from openpyxl import Workbook, load_workbook

APP_DIR = os.path.dirname(__file__)
SUB_FILE = os.path.join(APP_DIR, 'submissions.json')
DESKTOP_DIR = os.path.join(os.path.expanduser('~'), 'Desktop')
EXCEL_FILE = os.path.join(DESKTOP_DIR, 'feedback_submissions.xlsx')
EXCEL_HEADERS = ['name', 'email', 'course', 'rating', 'comments', 'consent', 'receivedAt']

def ensure_submissions_file():
    if not os.path.exists(SUB_FILE):
        with open(SUB_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)


def ensure_excel_file():
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
    ensure_excel_file()
    workbook = load_workbook(EXCEL_FILE)
    sheet = workbook.active
    sheet.append([entry.get(header, '') for header in EXCEL_HEADERS])
    workbook.save(EXCEL_FILE)


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

    entry = dict(data)
    entry['receivedAt'] = datetime.utcnow().isoformat() + 'Z'
    arr.append(entry)
    with open(SUB_FILE, 'w', encoding='utf-8') as f:
        json.dump(arr, f, indent=2, ensure_ascii=False)
    append_submission_to_excel(entry)

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
    app.run(host='127.0.0.1', port=5000, debug=True)
