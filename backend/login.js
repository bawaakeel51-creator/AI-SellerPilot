'use strict';
(async () => {
  const status = document.getElementById('status');
  try {
    const response = await fetch('/auth/config', { credentials: 'same-origin', cache: 'no-store' });
    const config = await response.json();
    if (!response.ok) throw Error(config.message || 'Sign-in is temporarily unavailable.');
    if (!window.google?.accounts?.id) throw Error('Google sign-in could not load. Check your connection and reload.');
    google.accounts.id.initialize({ client_id: config.clientId, nonce: config.nonce, auto_select: false, callback: async result => {
      status.textContent = 'Verifying your account…';
      try {
        const res = await fetch('/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-csrf-token': config.nonce }, body: JSON.stringify({ credential: result.credential }), signal: AbortSignal.timeout(10000) });
        const body = await res.json();
        if (!res.ok) throw Error(body.message || 'Sign-in could not be verified. Reload and try again.');
        window.location.replace('/studio/');
      } catch (error) { status.textContent = error.message; }
    }});
    google.accounts.id.renderButton(document.getElementById('signin'), { theme: 'outline', size: 'large', text: 'signin_with', width: 280 });
    status.textContent = 'Choose your approved Google account to continue.';
  } catch (error) { status.textContent = error.message; }
})();
