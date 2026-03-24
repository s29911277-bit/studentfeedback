document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const msg = document.getElementById('message');
  const submitButton = document.getElementById('submitButton');
  const buttonZone = document.getElementById('buttonZone');
  const buttonHint = document.getElementById('buttonHint');
  const progressBar = document.getElementById('progressBar');
  const popupBackdrop = document.getElementById('popupBackdrop');
  const popupText = document.getElementById('popupText');
  const popupOkButton = document.getElementById('popupOkButton');
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
  let isReady = false;

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

  function teacherSelectionIsValid() {
    const teacherList = getTeacherList();
    if (teacherList.length === 0) {
      return true;
    }
    return getSelectedTeachers().length > 0;
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

  function fieldIsFilled(field) {
    if (field.type === 'checkbox') {
      return field.checked;
    }
    return field.value.trim() !== '';
  }

  function getRequiredFields() {
    return Array.from(form.querySelectorAll('[required]'));
  }

  function getCompletion() {
    const requiredFields = getRequiredFields();
    let total = requiredFields.length;
    let filled = requiredFields.filter(fieldIsFilled).length;

    if (getTeacherList().length > 0) {
      total += 1;
      if (teacherSelectionIsValid()) {
        filled += 1;
      }
    }

    return total === 0 ? 0 : filled / total;
  }

  function moveButton() {
    if (isReady) {
      return;
    }

    const zoneRect = buttonZone.getBoundingClientRect();
    const buttonRect = submitButton.getBoundingClientRect();
    const maxX = Math.max(zoneRect.width - buttonRect.width - 10, 10);
    const maxY = Math.max(zoneRect.height - buttonRect.height - 10, 10);
    const nextLeft = Math.random() * maxX;
    const nextTop = Math.random() * maxY;

    submitButton.style.left = `${nextLeft}px`;
    submitButton.style.top = `${nextTop}px`;
  }

  function renderTeacherComments() {
    const selectedTeachers = getSelectedTeachers();
    teacherComments.innerHTML = '';

    selectedTeachers.forEach((teacher) => {
      const teacherId = slugify(teacher);
      const card = document.createElement('div');
      card.className = 'teacher-comment-card';
      card.innerHTML = `
        <label class="field">
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
      updateReadyState();
      return;
    }

    teachers.forEach((teacher, index) => {
      const teacherId = `teacher-${slugify(teacher)}-${index}`;
      const option = document.createElement('label');
      option.className = 'teacher-option';
      option.innerHTML = `
        <input type="checkbox" name="teachers" value="${teacher}" />
        <span>
          <span class="teacher-option-title">${teacher}</span>
          <span class="teacher-option-subtitle">${courseField.value}</span>
        </span>
      `;
      const checkbox = option.querySelector('input');
      checkbox.addEventListener('change', () => {
        renderTeacherComments();
        updateReadyState();
      });
      checkbox.id = teacherId;
      teacherOptions.appendChild(option);
    });

    renderTeacherComments();
    updateReadyState();
  }

  function updateReadyState() {
    const progress = getCompletion();
    isReady = progress === 1;
    progressBar.style.width = `${progress * 100}%`;
    submitButton.classList.toggle('ready', isReady);

    if (isReady) {
      submitButton.style.left = '';
      submitButton.style.top = '';
      buttonHint.textContent = 'Everything required is filled in. You can submit now.';
    } else if (getTeacherList().length > 0 && !teacherSelectionIsValid()) {
      buttonHint.textContent = 'Pick at least one teacher for the selected course to unlock submit.';
      moveButton();
    } else {
      buttonHint.textContent = 'Complete all required fields to calm the submit button down.';
      moveButton();
    }
  }

  form.addEventListener('input', updateReadyState);
  form.addEventListener('change', updateReadyState);
  courseField.addEventListener('change', renderTeacherOptions);

  submitButton.addEventListener('mouseenter', moveButton);
  submitButton.addEventListener('click', () => {
    shouldShowPopup = true;
  });
  popupOkButton.addEventListener('click', hidePopup);
  popupBackdrop.addEventListener('click', (event) => {
    if (event.target === popupBackdrop) {
      hidePopup();
    }
  });
  buttonZone.addEventListener('mousemove', (event) => {
    if (isReady) {
      return;
    }

    const buttonRect = submitButton.getBoundingClientRect();
    const dx = Math.abs(event.clientX - (buttonRect.left + buttonRect.width / 2));
    const dy = Math.abs(event.clientY - (buttonRect.top + buttonRect.height / 2));

    if (dx < 120 && dy < 60) {
      moveButton();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.classList.remove('error');

    if (!isReady) {
      msg.textContent = 'Please complete the required fields first.';
      msg.classList.add('error');
      showPopup(msg.textContent);
      moveButton();
      return;
    }

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

    if (!data.consent) {
      msg.textContent = 'You must agree to have your feedback stored.';
      msg.classList.add('error');
      showPopup(msg.textContent);
      return;
    }

    if (!teacherSelectionIsValid()) {
      msg.textContent = 'Please choose at least one teacher for the selected course.';
      msg.classList.add('error');
      showPopup(msg.textContent);
      return;
    }

    const localMatches = countMatchingSubmissions(getLocalSubmissions(), data.name, data.email);
    if (localMatches >= MAX_SUBMISSIONS_PER_PERSON) {
      msg.textContent = 'This name and email can only submit feedback twice.';
      msg.classList.add('error');
      showPopup(msg.textContent);
      return;
    }

    const payload = { ...data, receivedAt: new Date().toISOString() };

    try {
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error || 'Server error');
      }

      msg.textContent = 'Thanks, your feedback was submitted successfully.';
      showPopup(msg.textContent);
      form.reset();
      renderTeacherOptions();
      updateReadyState();
    } catch (err) {
      if (err.message === 'This name and email can only submit feedback twice.') {
        msg.textContent = err.message;
        msg.classList.add('error');
        showPopup(msg.textContent);
        return;
      }

      console.warn('Server not available, saving locally', err);
      const ok = saveLocally({ ...payload, offline: true });

      if (ok) {
        msg.textContent = 'No server detected, so your feedback was saved locally in this browser.';
        showPopup(msg.textContent);
        form.reset();
        renderTeacherOptions();
        updateReadyState();
      } else {
        msg.textContent = 'Failed to save feedback. Please try again later.';
        msg.classList.add('error');
        showPopup(msg.textContent);
      }
    }
  });

  renderTeacherOptions();
  updateReadyState();
});
