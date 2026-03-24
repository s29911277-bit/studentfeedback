document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const msg = document.getElementById('message');
  const popupBackdrop = document.getElementById('popupBackdrop');
  const popupText = document.getElementById('popupText');
  const popupOkButton = document.getElementById('popupOkButton');
  const submitButton = form.querySelector('button[type="submit"]');
  const teacherOptions = document.getElementById('teacherOptions');
  const teacherComments = document.getElementById('teacherComments');
  const courseField = form.querySelector('[name="course"]');
  const MAX_SUBMISSIONS_PER_PERSON = 2;
  const teachersByCourse = {
    'Artificial Intelligence & Machine Learning': [
      'Dr. Aarav Sharma',
      'Prof. Neeraj Gupta',
      'Dr. Kavya Raghavan',
      'Prof. Rohit Deshmukh',
      'Dr. Ishita Banerjee'
    ],
    Cybersecurity: [
      'Dr. Arjun Mehta',
      'Dr. Rahul Verma',
      'Prof. Aman Chatterjee',
      'Dr. Sameer Khan',
      'Dr. Nikhil Arora'
    ],
    'Cloud Computing': [
      'Prof. Neha Kulkarni',
      'Prof. Sneha Nair',
      'Dr. Kavita Reddy',
      'Prof. Pooja Patil',
      'Prof. Aishwarya Pillai'
    ],
    'Digital Marketing': [
      'Ms. Riya Sharma',
      'Mr. Aditya Kapoor',
      'Ms. Tanya Gupta',
      'Mr. Harsh Jain',
      'Ms. Simran Kaur'
    ],
    'Blockchain Technology': [
      'Dr. Karan Malhotra',
      'Dr. Mehul Shah',
      'Prof. Nishant Bansal',
      'Dr. Devansh Agrawal',
      'Dr. Ritesh Soni'
    ],
    'Robotics & Automation': [
      'Prof. Siddharth Iyer',
      'Prof. Vikram Shetty',
      'Dr. Rohit Menon',
      'Prof. Abhishek Rao',
      'Prof. Kartik Subramanian'
    ],
    Biotechnology: [
      'Dr. Ananya Bose',
      'Dr. Priyanka Das',
      'Prof. Isha Mukherjee',
      'Dr. Shreya Banerjee',
      'Dr. Pooja Sen'
    ]
  };
  let shouldShowPopup = false;

  function normalizeIdentity(value) {
    return (value || '').trim().toLowerCase();
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getTeacherList() {
    return teachersByCourse[courseField.value] || [];
  }

  function getSelectedTeachers() {
    return Array.from(form.querySelectorAll('input[name="teachers"]:checked')).map((field) => field.value);
  }

  function countMatchingSubmissions(submissions, name, email) {
    const normalizedName = normalizeIdentity(name);
    const normalizedEmail = normalizeIdentity(email);

    return submissions.filter((submission) => (
      normalizeIdentity(submission.name) === normalizedName &&
      normalizeIdentity(submission.email) === normalizedEmail
    )).length;
  }

  function getLocalSubmissions() {
    try {
      return JSON.parse(localStorage.getItem('local_submissions') || '[]');
    } catch (err) {
      console.error('localStorage read error', err);
      return [];
    }
  }

  function saveLocally(submission) {
    try {
      const arr = getLocalSubmissions();
      arr.push(submission);
      localStorage.setItem('local_submissions', JSON.stringify(arr));
      return true;
    } catch (err) {
      console.error('localStorage error', err);
      return false;
    }
  }

  function showPopup(message) {
    if (!shouldShowPopup) {
      return;
    }

    popupText.textContent = message;
    popupBackdrop.hidden = false;
    popupOkButton.focus();
    shouldShowPopup = false;
  }

  function hidePopup() {
    popupBackdrop.hidden = true;
  }

  function renderTeacherComments() {
    const selectedTeachers = getSelectedTeachers();
    teacherComments.innerHTML = '';

    selectedTeachers.forEach((teacher) => {
      const teacherId = slugify(teacher);
      const card = document.createElement('div');
      card.className = 'teacher-comment-card';
      card.innerHTML = `
        <label>
          <span>What do you want to say about ${teacher}?</span>
          <textarea name="teacher_comment_${teacherId}" rows="3" placeholder="Share your feedback about ${teacher}"></textarea>
        </label>
      `;
      teacherComments.appendChild(card);
    });
  }

  function renderTeacherOptions() {
    const teachers = getTeacherList();
    teacherOptions.innerHTML = '';
    teacherComments.innerHTML = '';

    if (teachers.length === 0) {
      teacherOptions.innerHTML = '<p class="teacher-empty">Choose a course to see teacher options.</p>';
      return;
    }

    teachers.forEach((teacher) => {
      const option = document.createElement('label');
      option.className = 'teacher-option';
      option.innerHTML = `
        <input type="checkbox" name="teachers" value="${teacher}" />
        <span>
          <span class="teacher-option-title">${teacher}</span>
          <span class="teacher-option-subtitle">${courseField.value}</span>
        </span>
      `;
      option.querySelector('input').addEventListener('change', renderTeacherComments);
      teacherOptions.appendChild(option);
    });

    renderTeacherComments();
  }

  popupOkButton.addEventListener('click', hidePopup);
  submitButton.addEventListener('click', () => {
    shouldShowPopup = true;
  });
  popupBackdrop.addEventListener('click', (event) => {
    if (event.target === popupBackdrop) {
      hidePopup();
    }
  });
  courseField.addEventListener('change', renderTeacherOptions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const teachers = getSelectedTeachers();
    const teacherCommentsData = {};

    teachers.forEach((teacher) => {
      teacherCommentsData[teacher] = fd.get(`teacher_comment_${slugify(teacher)}`) || '';
    });

    data.teachers = teachers;
    data.teacherComments = teacherCommentsData;
    data.consent = data.consent === 'yes' || data.consent === 'on' || data.consent === 'true';

    if (getTeacherList().length > 0 && teachers.length === 0) {
      msg.textContent = 'Please choose at least one teacher for the selected course.';
      showPopup(msg.textContent);
      return;
    }

    if (!data.consent) {
      msg.textContent = 'You must agree to have your feedback stored.';
      showPopup(msg.textContent);
      return;
    }

    const localMatches = countMatchingSubmissions(getLocalSubmissions(), data.name, data.email);
    if (localMatches >= MAX_SUBMISSIONS_PER_PERSON) {
      msg.textContent = 'This name and email can only submit feedback twice.';
      showPopup(msg.textContent);
      return;
    }

    const payload = { ...data, receivedAt: new Date().toISOString() };
    const ok = saveLocally({ ...payload, offline: true });

    if (ok) {
      msg.textContent = 'This demo saves feedback locally in your browser.';
      showPopup(msg.textContent);
      form.reset();
      renderTeacherOptions();
    } else {
      msg.textContent = 'Failed to save feedback locally.';
      showPopup(msg.textContent);
    }
  });

  renderTeacherOptions();
});
