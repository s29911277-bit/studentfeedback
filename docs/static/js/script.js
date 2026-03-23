document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedbackForm');
  const msg = document.getElementById('message');

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.consent = data.consent === 'yes' || data.consent === 'on' || data.consent === 'true';

    if (!data.consent) {
      msg.textContent = 'You must agree to have your feedback stored.';
      return;
    }

    const payload = { ...data, receivedAt: new Date().toISOString() };

    // No backend on static host — save to localStorage
    const ok = saveLocally({ ...payload, offline: true });
    if (ok) {
      msg.textContent = 'This demo saves feedback locally in your browser.';
      form.reset();
    } else {
      msg.textContent = 'Failed to save feedback locally.';
    }
  });
});
