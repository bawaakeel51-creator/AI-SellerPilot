'use strict';
(async () => {
  const status = document.getElementById('account-status');
  const logout = document.getElementById('signout');
  try {
    const response = await fetch('/auth/session', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) { window.location.replace('/login.html'); return; }
    const session = await response.json();
    status.textContent = session.aiEnabled ? 'Signed in · AI available' : 'Signed in · AI generation is disabled';
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        const result = await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrf }, body: '{}' });
        if (!result.ok) throw Error('Sign-out failed. Try again.');
        window.location.replace('/login.html');
      } catch (error) { status.textContent = error.message; logout.disabled = false; }
    });
  } catch { status.textContent = 'Session check failed. Reload before continuing.'; }
})();
