/* ════════════════════════════════════════════════════════
   app.js — Sitio público de Parroquia Nuestra Señora de Luján
   Solo LEE datos de Supabase. parish_id fijo = 'lj'
════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://ojosqscdzjehutitdfoz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laJxknrjuvEn4FvHN0wIJg_hROPOPdx';
const PARISH_ID    = 'lj';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado local
const state = {
  about_us:  '',
  notices:   [],
  events:    [],
  photos:    [],
  schedules: [],
  team:      []
};

// ── Carga de datos ──────────────────────────────────────
async function loadAllData() {
  showLoading(true);
  try {
    const filter = `parish_id=eq.${PARISH_ID}`;
    const [
      { data: parish    },
      { data: notices   },
      { data: events    },
      { data: photos    },
      { data: schedules },
      { data: team      }
    ] = await Promise.all([
      db.from('parishes').select('about_us').eq('id', PARISH_ID).single(),
      db.from('notices').select('*').eq('parish_id', PARISH_ID).order('created_at', { ascending: false }),
      db.from('events').select('*').eq('parish_id', PARISH_ID).order('event_date', { ascending: true }),
      db.from('photos').select('*').eq('parish_id', PARISH_ID).order('created_at', { ascending: true }),
      db.from('schedules').select('*').eq('parish_id', PARISH_ID).order('created_at', { ascending: true }),
      db.from('team_members').select('*').eq('parish_id', PARISH_ID).order('created_at', { ascending: true })
    ]);

    state.about_us  = parish?.about_us || '';
    state.notices   = notices   || [];
    state.events    = events    || [];
    state.photos    = photos    || [];
    state.schedules = schedules || [];
    state.team      = team      || [];

    renderAll();
  } catch (err) {
    console.error(err);
    showToast('⚠️ Error al conectar con la base de datos.');
  } finally {
    showLoading(false);
  }
}

// ── Navegación ──────────────────────────────────────────
const PAGE_ORDER = ['home', 'info', 'quienes'];
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn:not(.other-parish)').forEach((btn, i) => {
    btn.classList.toggle('active', PAGE_ORDER[i] === id);
  });
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Renderizado ─────────────────────────────────────────
function renderAll() {
  renderNotices();
  renderEvents();
  renderSchedules();
  renderPhotos();
  renderTeam();
}

function renderNotices() {
  const el = document.getElementById('notices-display');
  if (!el) return;
  if (!state.notices.length) { el.innerHTML = '<div class="empty-state">No hay avisos por el momento.</div>'; return; }
  el.innerHTML = state.notices.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });
    return `<div class="notice-item">
      <div class="notice-date">${date}</div>
      <div class="notice-text">
        <span class="notice-title">${esc(n.title)}</span>
        ${n.content ? esc(n.content) : ''}
      </div>
    </div>`;
  }).join('');
}

function renderEvents() {
  const el = document.getElementById('events-display');
  if (!el) return;
  if (!state.events.length) { el.innerHTML = '<div class="empty-state">No hay eventos próximos.</div>'; return; }
  el.innerHTML = state.events.map(ev => {
    const d = new Date(ev.event_date + 'T00:00:00');
    const day   = d.toLocaleDateString('es-CL', { day:'2-digit' });
    const month = d.toLocaleDateString('es-CL', { month:'short' }).toUpperCase();
    return `<div class="event-item">
      <div class="event-date-box"><div class="month">${month}</div><div class="day">${day}</div></div>
      <div class="event-info">
        <h4>${esc(ev.title)}</h4>
        ${ev.description ? `<p>${esc(ev.description)}</p>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderSchedules() {
  const el = document.getElementById('schedule-display');
  if (!el) return;
  el.innerHTML = state.schedules.length
    ? state.schedules.map(s => `<div class="schedule-item"><span class="schedule-day">${esc(s.day)}</span><span class="schedule-time">${esc(s.time)}</span></div>`).join('')
    : '<div class="empty-state">Horario no disponible aún.</div>';
}

function renderPhotos() {
  const el = document.getElementById('photos-display');
  if (!el) return;
  el.innerHTML = state.photos.length
    ? state.photos.map(ph => `<div class="photo-thumb" onclick="openLightbox('${ph.url}')"><img src="${ph.url}" alt="${esc(ph.description||'')}"></div>`).join('')
    : '<div class="empty-state" style="grid-column:1/-1;">No hay fotos aún.</div>';
}

function renderTeam() {
  const el  = document.getElementById('team-display');
  const desc = document.getElementById('quienes-desc');
  if (desc) { desc.textContent = state.about_us; desc.style.display = state.about_us ? 'block' : 'none'; }
  if (!el) return;
  if (!state.team.length) { el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No hay personas registradas aún.</div>'; return; }

  const igSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  const fbSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;

  el.innerHTML = state.team.map(m => `
    <div class="team-card">
      <div class="team-photo-wrap">
        ${m.photo_url ? `<img src="${m.photo_url}" alt="${esc(m.name)}" class="team-photo">` : '<div class="team-photo-placeholder">👤</div>'}
      </div>
      <div class="team-info">
        <h4 class="team-name">${esc(m.name)}</h4>
        <span class="team-role">${esc(m.role)}</span>
        <div class="team-contacts">
          ${m.phone     ? `<a href="tel:${esc(m.phone)}" class="team-contact-link phone">📞 ${esc(m.phone)}</a>` : ''}
          ${m.email     ? `<a href="mailto:${esc(m.email)}" class="team-contact-link email">✉️ ${esc(m.email)}</a>` : ''}
          ${m.instagram ? `<a href="https://instagram.com/${esc(m.instagram)}" target="_blank" class="team-contact-link instagram">${igSVG} @${esc(m.instagram)}</a>` : ''}
          ${m.facebook  ? `<a href="https://facebook.com/${esc(m.facebook)}" target="_blank" class="team-contact-link facebook">${fbSVG} ${esc(m.facebook)}</a>` : ''}
        </div>
      </div>
    </div>`).join('');
}

// ── Lightbox ────────────────────────────────────────────
function openLightbox(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').classList.add('active'); }
function closeLightbox()  { document.getElementById('lightbox').classList.remove('active'); }

// ── Utilidades ──────────────────────────────────────────
function esc(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showToast(msg)     { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); }
function showLoading(v)     { document.getElementById('global-loading').style.display=v?'flex':'none'; }

loadAllData();