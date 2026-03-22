/**
 * Postly — Frontend
 * Vanilla JS, no dependencies.
 */

// ── Config ────────────────────────────────────────────────────────────────────
//const API_URL = 'http://localhost:8000';
const API_URL = 'https://mi-backend-767444481459.europe-west1.run.app';

// ── State ─────────────────────────────────────────────────────────────────────
let originalText       = '';
let selectedVariation = null; // { version, text }
let selectedTheme     = 'light';
let rateLimitStatus   = null;

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = {
  launch:       'After [X months] of work, today we launch [product name]. [Brief description of what it does]. I am [emotion] to share this with everyone.',
  milestone:    '🎯 Milestone achieved: [number/achievement]. [Time] ago we started with [initial situation]. Today we celebrate [specific achievement]. Thanks to [who/what helped].',
  lesson:       '💡 Lesson I learned [where/when]: [main lesson]. Before I thought [old belief]. Now I understand that [new perspective]. [Actionable advice].',
  announcement: '📢 Important announcement: [what you are announcing]. Starting from [when], [what changes]. This means [benefit for the audience]. [Call to action].',
  question:     'Question for the community: [specific question]? In my experience [your context]. How do you do it? [Relevant emoji]',
};

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = [
  { id: 'light',    label: '☀️ Light'    },
  { id: 'dark',     label: '🌙 Dark'   },
  { id: 'gradient', label: '🎨 Gradient' },
  { id: 'sunset',   label: '🌅 Sunset'   },
  { id: 'ocean',    label: '🌊 Ocean'    },
  { id: 'forest',   label: '🌲 Forest'   },
  { id: 'fire',     label: '🔥 Fire'     },
  { id: 'midnight', label: '🌃 Midnight' },
];

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function showToast(msg, duration = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function openModal(id) {
  $(id).classList.add('open');
}

function closeModal(id) {
  $(id).classList.remove('open');
}

// Close modals on backdrop click
document.addEventListener('click', (e) => {
  ['upgradeModal', 'feedbackModal', 'shareModal'].forEach((id) => {
    if (e.target === $(id)) closeModal(id);
  });
});

// Close modals on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    ['upgradeModal', 'feedbackModal', 'shareModal'].forEach(closeModal);
  }
});

// ── Usage chip ────────────────────────────────────────────────────────────────
function updateUsageChip() {
  if (!rateLimitStatus) return;
  const chip = $('usageChip');
  chip.style.display = 'block';
  chip.textContent = `${rateLimitStatus.remaining}/${rateLimitStatus.limit} gratis hoy`;
  chip.classList.remove('warn', 'limit');
  if (!rateLimitStatus.allowed)           chip.classList.add('limit');
  else if (rateLimitStatus.remaining <= 2) chip.classList.add('warn');
}

// ── Character counter ─────────────────────────────────────────────────────────
function updateCharCount() {
  const len  = $('textInput').value.length;
  const el   = $('charCount');
  el.textContent = `${len} / 500`;
  el.classList.remove('warn', 'over');
  if (len > 500)      el.classList.add('over');
  else if (len > 400) el.classList.add('warn');
}

// ── Templates ─────────────────────────────────────────────────────────────────
function useTemplate(type) {
  $('textInput').value = TEMPLATES[type] || '';
  updateCharCount();
  $('textInput').focus();
}

// ── Theme pills ───────────────────────────────────────────────────────────────
function buildThemePills() {
  const row = $('themesRow');
  THEMES.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className  = 'theme-pill' + (id === selectedTheme ? ' active' : '');
    btn.textContent = label;
    btn.dataset.theme = id;
    btn.addEventListener('click', () => {
      selectedTheme = id;
      row.querySelectorAll('.theme-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    row.appendChild(btn);
  });
}

// ── Variation cards ───────────────────────────────────────────────────────────
function renderVariations(data) {
  $('originalPreview').textContent = data.original;
  originalText = data.original;

  data.variations.forEach(({ version, text }) => {
    const textEl = $(`${version}Text`);
    const metaEl = $(`${version}Meta`);
    if (!textEl) return;

    textEl.textContent = text;

    const diff   = text.length - data.original.length;
    const emojis = (text.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu) || []).length;
    const parts  = [];
    if (diff > 0)    parts.push(`+${diff} chars`);
    if (diff < 0)    parts.push(`${diff} chars`);
    if (emojis > 0)  parts.push(`${emojis} emojis`);
    metaEl.textContent = parts.join(' · ') || 'improved';
  });
}

async function selectVariation(version, cardEl) {
  const text = $(`${version}Text`).textContent;
  selectedVariation = { version, text };

  saveGeneration(text, version);

  // Update card selection styles
  document.querySelectorAll('.variation-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');

  // Show image section
  $('imageSection').classList.add('visible');

  // Reset generate button and hide previous image
  $('generateBtn').disabled = false;
  $('generateBtn').innerHTML = '<span>🎨</span> Generate Image';
  $('imagePreview').classList.remove('visible');
}

async function saveGeneration(selectedText, style) {
  try {
    const res = await fetch(`${API_URL}/save-generation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_text: originalText, selected_text: selectedText, style }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err.detail || `Error ${res.status}`);
    }
  } catch {
    // Non-critical — silently ignore errors here
  }
}

async function copyVariation(event, version) {
  event.stopPropagation(); // Don't also trigger selectVariation
  const text = $(`${version}Text`).textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast('✓ Copied to clipboard');
  } catch {
    showToast('Error copying — try copying manually');
  }
}

// ── Improve ───────────────────────────────────────────────────────────────────
async function improve() {
  const text = $('textInput').value.trim();
  if (!text)          return showToast('Escribe algo primero');
  if (text.length > 500) return showToast('Máximo 500 caracteres');

  if (rateLimitStatus && !rateLimitStatus.allowed) {
    openUpgradeModal();
    return;
  }

  // Reset UI
  $('resultsSection').classList.remove('visible');
  $('imageSection').classList.remove('visible');
  $('imagePreview').classList.remove('visible');
  $('loadingState').classList.add('visible');
  $('improveBtn').disabled = true;
  selectedVariation = null;
  document.querySelectorAll('.variation-card').forEach(c => c.classList.remove('selected'));

  try {
    const res = await fetch(`${API_URL}/improve`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429) {
        rateLimitStatus = err.detail || rateLimitStatus;
        openUpgradeModal();
        return;
      }
      throw new Error(err.detail || `Error ${res.status}`);
    }

    const data = await res.json();
    renderVariations(data);

    $('resultsSection').classList.add('visible');
    $('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showToast(`Error: ${err.message}`, 4000);
  } finally {
    $('loadingState').classList.remove('visible');
    $('improveBtn').disabled = false;
    // Refresh rate-limit status
    fetchRateLimitStatus();
  }
}

// ── Rate limit ────────────────────────────────────────────────────────────────
async function fetchRateLimitStatus() {
  try {
    const res = await fetch(`${API_URL}/rate-limit/status`);
    if (res.ok) {
      rateLimitStatus = await res.json();
      updateUsageChip();
    }
  } catch {
    // Non-critical — silently ignore
  }
}

function applyThemeToTemplate(theme) {
  const inner = document.getElementById('textTemplateInner');
  const body  = document.getElementById('textTemplateText');
  const handle = document.getElementById('textTemplateDate');

  // Resetear estilos inline anteriores
  inner.removeAttribute('style');

  const themes = {
    light:    { bg: '#ffffff', text: '#0f1419', secondary: '#536471', border: '#eff3f4' },
    dark:     { bg: '#15202b', text: '#ffffff', secondary: '#8b98a5', border: '#38444d' },
    gradient: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', secondary: '#e0e0e0', border: 'rgba(255,255,255,.2)' },
    sunset:   { bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', text: '#ffffff', secondary: '#f5f5f5', border: 'rgba(255,255,255,.3)' },
    ocean:    { bg: 'linear-gradient(135deg, #667eea 0%, #48dbfb 100%)', text: '#ffffff', secondary: '#e8f8ff', border: 'rgba(255,255,255,.3)' },
    forest:   { bg: 'linear-gradient(135deg, #38ada9 0%, #78e08f 100%)', text: '#ffffff', secondary: '#e8f5e9', border: 'rgba(255,255,255,.3)' },
    fire:     { bg: 'linear-gradient(135deg, #ee5a6f 0%, #f7b731 100%)', text: '#ffffff', secondary: '#fff3e0', border: 'rgba(255,255,255,.3)' },
    midnight: { bg: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', text: '#ffffff', secondary: '#bdc3c7', border: 'rgba(255,255,255,.2)' },
  };

  const t = themes[theme] || themes.light;

  inner.style.background   = t.bg;
  inner.style.borderColor  = t.border;

  // Texto principal y secundario
  document.getElementById('textTemplateText').style.color = t.text;
  document.querySelector('#textTemplateInner .text-name').style.color    = t.text;
  document.querySelector('#textTemplateInner .text-handle').style.color  = t.secondary;
  document.querySelector('#textTemplateInner .text-footer').style.color  = t.secondary;
  document.querySelector('#textTemplateInner .text-footer').style.borderTopColor   = t.border;
  document.querySelector('#textTemplateInner .text-watermark').style.color         = t.secondary;
  document.querySelector('#textTemplateInner .text-watermark').style.borderTopColor = t.border;
}

function getActualYear() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ── Image generation ──────────────────────────────────────────────────────────
async function generateImage() {
  if (!selectedVariation) {
    showToast('Selecciona una variación primero');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled    = true;
  btn.innerHTML = '<span> class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></span> Generando…';

  try {
    const templateText = document.getElementById('textTemplateText');
    const templateDate = document.getElementById('textTemplateDate');
    templateText.textContent = selectedVariation.text;
    templateDate.textContent = new Date().toLocaleDateString('es-ES', {
      hour: '2-digit', minute: '2-digit',
      day: 'numeric', month: 'short', year: 'numeric'
    });

    applyThemeToTemplate(selectedTheme);

    const inner = document.getElementById('textTemplateInner');
    const canvas = await html2canvas(inner, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const img = document.getElementById('generatedImage');
    img.src = canvas.toDataURL('image/png');
    document.getElementById('imagePreview').classList.add('visible');
    document.getElementById('imagePreview').scrollIntoView({ behavior: 'smooth', block: 'start' });

    btn.innerHTML = '<span>✓</span> Imagen generada';

  } catch (err) {
    showToast(`Error: ${err.message}`, 4000);
    btn.disabled = false;
    btn.innerHTML = '<span>🎨</span> Generar imagen';
  }
}

// ── Download / Share ──────────────────────────────────────────────────────────
function downloadImage() {
  const img = $('generatedImage');
  const a   = document.createElement('a');
  a.href     = img.src;
  a.download = `textcraft-${Date.now()}.png`;
  a.click();
}

function openShareModal() {
  openModal('shareModal');
}

function shareToTwitter() {
  showToast('Descargando imagen… súbela a Twitter/X manualmente');
  downloadImage();
  closeModal('shareModal');
}

function shareToLinkedIn() {
  showToast('Descargando imagen… créala como post en LinkedIn');
  downloadImage();
  closeModal('shareModal');
}

function shareViaWhatsApp() {
  const text = encodeURIComponent('Mira el text que he creado con textCraft AI 🎨');
  window.open(`https://wa.me/?text=${text}`, '_blank');
  closeModal('shareModal');
}

async function copyImageToClipboard() {
  try {
    const img      = $('generatedImage');
    const response = await fetch(img.src);
    const blob     = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('✓ Imagen copiada — pégala con Ctrl+V');
    closeModal('shareModal');
  } catch {
    showToast('No se pudo copiar — usa el botón de descargar');
    downloadImage();
    closeModal('shareModal');
  }
}

// ── Upgrade modal ─────────────────────────────────────────────────────────────
function openUpgradeModal() {
  if (!rateLimitStatus) return;
  $('upgradeUsed').textContent = rateLimitStatus.used;
  const pct = Math.min(100, (rateLimitStatus.used / rateLimitStatus.limit) * 100);
  $('upgradeBar').style.width = `${pct}%`;
  openModal('upgradeModal');
}

// ── Feedback modal ────────────────────────────────────────────────────────────
function openFeedbackModal() {
  closeModal('upgradeModal');
  openModal('feedbackModal');
}

async function submitFeedback() {
  const text = $('feedbackText').value.trim();
  if (!text) { showToast('Escribe tu feedback primero'); return; }

  const btn = $('feedbackSubmit');
  btn.disabled     = true;
  btn.textContent  = 'Enviando…';

  try {
    const res = await fetch(`${API_URL}/feedback`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ feedback: text }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    showToast('✓ Feedback enviado — ¡gracias!');
    $('feedbackText').value = '';
    closeModal('feedbackModal');
  } catch (err) {
    showToast(`Error al enviar: ${err.message}`, 4000);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Enviar';
  }
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeToggle').textContent = isDark ? '🌙' : '☀️';
  try { localStorage.setItem('tc-theme', isDark ? 'light' : 'dark'); } catch {}
}

function initTheme() {
  let saved = 'light';
  try { saved = localStorage.getItem('tc-theme') || 'light'; } catch {}
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

// ── Init ──────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set actual year in footer
  getActualYear();
  // Restore saved theme
  initTheme();
  // Character counter
  $('textInput').addEventListener('input', updateCharCount);

  // Improve button
  $('improveBtn').addEventListener('click', improve);

  // Allow Ctrl+Enter to submit
  $('textInput').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') improve();
  });

  // Build theme pills
  buildThemePills();

  // Load initial rate-limit status
  fetchRateLimitStatus();
});
