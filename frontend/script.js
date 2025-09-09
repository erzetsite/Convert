const API_URL = 'https://api.convert.rzsite.my.id/convert';

/* ---------- theme ---------- */
const html = document.documentElement;
const toggle = document.getElementById('theme-toggle');

function applyTheme(){
  const dark = localStorage.theme === 'dark' || (!('theme' in localStorage) && matchMedia('(prefers-color-scheme: dark)').matches);
  html.className = dark ? 'rp-dark' : 'rp-light';
}
toggle.addEventListener('click', () => {
  localStorage.theme = html.classList.contains('rp-dark') ? 'light' : 'dark';
  applyTheme();
});
applyTheme();

/* ---------- ui helpers ---------- */
const $ = id => document.getElementById(id);
const contentInput = $('content-input');
const fileUpload   = $('file-upload');
const formatSelect = $('format-select');
const submitBtn    = $('submit-btn');
const btnText      = $('btn-text');
const spinner      = $('spinner');
const status       = $('status');
const helpBox      = $('help-box');

/* show/hide help per format */
formatSelect.addEventListener('change', () => {
  helpBox.querySelectorAll('[data-for]').forEach(el => el.style.display = el.dataset.for === formatSelect.value ? 'block' : 'none');
});
helpBox.querySelectorAll('[data-for]').forEach(el => el.style.display = el.dataset.for === formatSelect.value ? 'block' : 'none');

/* file upload */
fileUpload.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => { contentInput.value = r.result; status.textContent = `Loaded: ${f.name}`; };
  r.onerror = () => { status.textContent = 'Failed to read file'; };
  r.readAsText(f);
});

/* convert */
$('converter-form').addEventListener('submit', async ev => {
  ev.preventDefault();
  const content = contentInput.value.trim();
  if (!content) { status.textContent = 'Content required'; return; }

  submitBtn.disabled = true;
  btnText.textContent = 'Converting…';
  spinner.classList.remove('hidden');
  status.textContent = '';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: formatSelect.value, content })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || res.statusText);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cd = res.headers.get('content-disposition');
    a.download = cd?.match(/filename="?(.+)"?/)?.[1] || 'download';
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = 'Download started';
  } catch (e) {
    status.textContent = `Error: ${e.message}`;
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Convert & Download';
    spinner.classList.add('hidden');
  }
});
