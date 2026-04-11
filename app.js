/* ════════════════════════════════════════════════════════
   app.js — Sitio PÚBLICO de las Parroquias
   Solo lee datos de Supabase. No tiene ninguna función
   de escritura ni de administración.

   TABLAS QUE LEE:
   parishes      → id, name, about_us
   notices       → id, parish_id, title, content, created_at
   events        → id, parish_id, title, event_date, description
   photos        → id, parish_id, url, description
   schedules     → id, parish_id, day, time
   team_members  → id, parish_id, name, role, phone, email,
                   instagram, facebook, photo_url
════════════════════════════════════════════════════════ */

// ════════════════════════════════════════════════════════
// CONEXIÓN A SUPABASE
// ════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://ojosqscdzjehutitdfoz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laJxknrjuvEn4FvHN0wIJg_hROPOPdx';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);


// ════════════════════════════════════════════════════════
// ESTADO LOCAL
// ════════════════════════════════════════════════════════
const state = {
  parishes: {
    sc: { about_us: '' },
    lj: { about_us: '' }
  },
  notices:   [],
  events:    [],
  photos:    { sc: [], lj: [] },
  schedules: { sc: [], lj: [] },
  team:      { sc: [], lj: [] }
};


// ════════════════════════════════════════════════════════
// CARGA DE DATOS DESDE SUPABASE
// ════════════════════════════════════════════════════════
async function loadAllData() {
  showLoading(true);
  try {
    const [
      { data: parishes  },
      { data: notices   },
      { data: events    },
      { data: photos    },
      { data: schedules },
      { data: team      }
    ] = await Promise.all([
      db.from('parishes').select('id, name, about_us'),
      db.from('notices').select('*').order('created_at', { ascending: false }),
      db.from('events').select('*').order('event_date', { ascending: true }),
      db.from('photos').select('*').order('created_at', { ascending: true }),
      db.from('schedules').select('*').order('created_at', { ascending: true }),
      db.from('team_members').select('*').order('created_at', { ascending: true })
    ]);

    // Parroquias
    if (parishes) parishes.forEach(p => {
      if (state.parishes[p.id]) state.parishes[p.id].about_us = p.about_us || '';
    });

    state.notices      = notices   || [];
    state.events       = events    || [];
    state.photos.sc    = (photos    || []).filter(x => x.parish_id === 'sc');
    state.photos.lj    = (photos    || []).filter(x => x.parish_id === 'lj');
    state.schedules.sc = (schedules || []).filter(x => x.parish_id === 'sc');
    state.schedules.lj = (schedules || []).filter(x => x.parish_id === 'lj');
    state.team.sc      = (team      || []).filter(x => x.parish_id === 'sc');
    state.team.lj      = (team      || []).filter(x => x.parish_id === 'lj');

    renderAll();
  } catch (err) {
    console.error('Error al cargar datos:', err);
    showToast('⚠️ Error al conectar con la base de datos.');
  } finally {
    showLoading(false);
  }
}


// ════════════════════════════════════════════════════════
// NAVEGACIÓN
// ════════════════════════════════════════════════════════
const PAGE_ORDER = ['home', 'sc', 'lj', 'quienes'];

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', PAGE_ORDER[i] === id);
  });
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchQuienesTab(parish) {
  ['sc', 'lj'].forEach(p => {
    document.getElementById('qtab-'   + p)?.classList.toggle('active', p === parish);
    document.getElementById('qpanel-' + p)?.classList.toggle('active', p === parish);
  });
}


// ════════════════════════════════════════════════════════
// RENDERIZADO
// ════════════════════════════════════════════════════════
function renderAll() {
  ['sc', 'lj'].forEach(p => {
    renderNotices(p);
    renderEvents(p);
    renderSchedules(p);
    renderPhotos(p);
  });
  renderQuienesSomos();
}

function renderNotices(p) {
  const el = document.getElementById(p + '-notices-display');
  if (!el) return;
  const list = state.notices.filter(n => n.parish_id === p);
  if (!list.length) { el.innerHTML = '<div class="empty-state">No hay avisos por el momento.</div>'; return; }
  el.innerHTML = list.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });
    return `
      <div class="notice-item">
        <div class="notice-date">${date}</div>
        <div class="notice-text">
          <span class="notice-title">${esc(n.title)}</span>
          ${n.content ? esc(n.content) : ''}
        </div>
      </div>`;
  }).join('');
}

function renderEvents(p) {
  const el = document.getElementById(p + '-events-display');
  if (!el) return;
  const list = state.events.filter(e => e.parish_id === p);
  if (!list.length) { el.innerHTML = '<div class="empty-state">No hay eventos próximos.</div>'; return; }
  el.innerHTML = list.map(ev => {
    const d     = new Date(ev.event_date + 'T00:00:00');
    const day   = d.toLocaleDateString('es-CL', { day:'2-digit' });
    const month = d.toLocaleDateString('es-CL', { month:'short' }).toUpperCase();
    return `
      <div class="event-item">
        <div class="event-date-box">
          <div class="month">${month}</div>
          <div class="day">${day}</div>
        </div>
        <div class="event-info">
          <h4>${esc(ev.title)}</h4>
          ${ev.description ? `<p>${esc(ev.description)}</p>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderSchedules(p) {
  const el = document.getElementById(p + '-schedule-display');
  if (!el) return;
  const list = state.schedules[p];
  el.innerHTML = list.length
    ? list.map(s => `
        <div class="schedule-item">
          <span class="schedule-day">${esc(s.day)}</span>
          <span class="schedule-time">${esc(s.time)}</span>
        </div>`).join('')
    : '<div class="empty-state">Horario no disponible aún.</div>';
}

function renderPhotos(p) {
  const el = document.getElementById(p + '-photos-display');
  if (!el) return;
  const list = state.photos[p];
  el.innerHTML = list.length
    ? list.map(ph => `
        <div class="photo-thumb" onclick="openLightbox('${ph.url}')">
          <img src="${ph.url}" alt="${esc(ph.description || 'Foto')}">
        </div>`).join('')
    : '<div class="empty-state" style="grid-column:1/-1;">No hay fotos aún.</div>';
}

function renderQuienesSomos() {
  ['sc', 'lj'].forEach(p => {
    const wrap = document.getElementById('qdesc-' + p + '-wrap');
    const text = document.getElementById('qdesc-' + p);
    if (wrap && text) {
      const txt = state.parishes[p].about_us;
      text.textContent   = txt;
      wrap.style.display = txt ? 'block' : 'none';
    }
    const grid = document.getElementById('qteam-' + p);
    if (!grid) return;
    const members = state.team[p];
    grid.innerHTML = members.length
      ? members.map(m => buildTeamCard(m, p)).join('')
      : '<div class="empty-state" style="grid-column:1/-1;">No hay personas registradas aún.</div>';
  });
}

function buildTeamCard(m, parish) {
  const igSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  const fbSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
  const color = parish === 'sc' ? '#1a3a6b' : '#6b1a1a';
  return `
    <div class="team-card">
      <div class="team-photo-wrap">
        ${m.photo_url
          ? `<img src="${m.photo_url}" alt="${esc(m.name)}" class="team-photo">`
          : `<div class="team-photo-placeholder">👤</div>`}
      </div>
      <div class="team-info">
        <h4 class="team-name">${esc(m.name)}</h4>
        <span class="team-role" style="background:${color};">${esc(m.role)}</span>
        <div class="team-contacts">
          ${m.phone     ? `<a href="tel:${esc(m.phone)}" class="team-contact-link phone">📞 ${esc(m.phone)}</a>` : ''}
          ${m.email     ? `<a href="mailto:${esc(m.email)}" class="team-contact-link email">✉️ ${esc(m.email)}</a>` : ''}
          ${m.instagram ? `<a href="https://instagram.com/${esc(m.instagram)}" target="_blank" class="team-contact-link instagram">${igSVG} @${esc(m.instagram)}</a>` : ''}
          ${m.facebook  ? `<a href="https://facebook.com/${esc(m.facebook)}" target="_blank" class="team-contact-link facebook">${fbSVG} ${esc(m.facebook)}</a>` : ''}
        </div>
      </div>
    </div>`;
}


// ════════════════════════════════════════════════════════
// LIGHTBOX
// ════════════════════════════════════════════════════════
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}


// ════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
function showLoading(visible) {
  document.getElementById('global-loading').style.display = visible ? 'flex' : 'none';
}


// ════════════════════════════════════════════════════════
// INICIO
// ════════════════════════════════════════════════════════
loadAllData();