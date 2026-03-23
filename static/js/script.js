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

    try {
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server error');
      msg.textContent = 'Thanks — your feedback was submitted.';
      form.reset();
    } catch (err) {
      console.warn('Server not available, saving locally', err);
      const ok = saveLocally({ ...payload, offline: true });
      if (ok) {
        msg.textContent = 'No server detected — your feedback was saved locally in your browser.';
        form.reset();
      } else {
        msg.textContent = 'Failed to save feedback. Please try again later.';
      }
    }
  });
});
