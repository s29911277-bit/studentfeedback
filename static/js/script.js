document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const msg = document.getElementById('message');
  const submitButton = document.getElementById('submitButton');
  const buttonZone = document.getElementById('buttonZone');
  const buttonHint = document.getElementById('buttonHint');
  const progressBar = document.getElementById('progressBar');
  const requiredFields = Array.from(form.querySelectorAll('[required]'));
  let isReady = false;

  function saveLocally(submission) {
    try {
      const raw = localStorage.getItem('local_submissions') || '[]';
      const arr = JSON.parse(raw);
      arr.push(submission);
      localStorage.setItem('local_submissions', JSON.stringify(arr));
      return true;
    } catch (err) {
      console.error('localStorage error', err);
      return false;
    }
  }

  function fieldIsFilled(field) {
    if (field.type === 'checkbox') {
      return field.checked;
    }
    return field.value.trim() !== '';
  }

  function getCompletion() {
    const filled = requiredFields.filter(fieldIsFilled).length;
    return filled / requiredFields.length;
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

  function updateReadyState() {
    const progress = getCompletion();
    isReady = progress === 1;
    progressBar.style.width = `${progress * 100}%`;
    submitButton.classList.toggle('ready', isReady);

    if (isReady) {
      submitButton.style.left = '';
      submitButton.style.top = '';
      buttonHint.textContent = 'Everything required is filled in. You can submit now.';
    } else {
      buttonHint.textContent = 'Complete all required fields to calm the submit button down.';
      moveButton();
    }
  }

  requiredFields.forEach((field) => {
    field.addEventListener('input', updateReadyState);
    field.addEventListener('change', updateReadyState);
  });

  submitButton.addEventListener('mouseenter', moveButton);
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
      moveButton();
      return;
    }

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.consent = data.consent === 'yes' || data.consent === 'on' || data.consent === 'true';

    if (!data.consent) {
      msg.textContent = 'You must agree to have your feedback stored.';
      msg.classList.add('error');
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
        throw new Error('Server error');
      }

      msg.textContent = 'Thanks, your feedback was submitted successfully.';
      form.reset();
      updateReadyState();
    } catch (err) {
      console.warn('Server not available, saving locally', err);
      const ok = saveLocally({ ...payload, offline: true });

      if (ok) {
        msg.textContent = 'No server detected, so your feedback was saved locally in this browser.';
        form.reset();
        updateReadyState();
      } else {
        msg.textContent = 'Failed to save feedback. Please try again later.';
        msg.classList.add('error');
      }
    }
  });

  updateReadyState();
});
