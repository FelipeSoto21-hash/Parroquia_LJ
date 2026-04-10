/* ════════════════════════════════════════════════════════
   app.js — Parroquias San Crescente & Nuestra Señora de Luján
════════════════════════════════════════════════════════ */

// ════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ════════════════════════════════════════════════════════
const state = {
  notices:   [],
  events:    [],
  schedules: [],
  photos: { sc: [], lj: [] },
  team: {
    sc: { description: '', members: [] },
    lj: { description: '', members: [] }
  }
};


// ════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE PÁGINAS
// ════════════════════════════════════════════════════════

const PAGE_ORDER = ['home', 'sc', 'lj', 'quienes', 'admin'];

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', PAGE_ORDER[i] === id);
  });

  renderAll();
}


// ════════════════════════════════════════════════════════
// PESTAÑAS QUIÉNES SOMOS (SC / LJ)
// ════════════════════════════════════════════════════════

function switchQuienesTab(parish) {
  // Tabs
  document.getElementById('qtab-sc').classList.toggle('active', parish === 'sc');
  document.getElementById('qtab-lj').classList.toggle('active', parish === 'lj');
  // Paneles
  document.getElementById('qpanel-sc').classList.toggle('active', parish === 'sc');
  document.getElementById('qpanel-lj').classList.toggle('active', parish === 'lj');
}


// ════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ════════════════════════════════════════════════════════

const ADMIN_USER = 'ANDRESVALENCIA';
const ADMIN_PASS = 'parroquias2026';

function doLogin() {
  const user    = document.getElementById('login-user').value.trim();
  const pass    = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-panel-view').style.display = 'block';
    errorEl.style.display = 'none';
    renderAdminLists();
    renderAdminTeam();
  } else {
    errorEl.textContent = 'Usuario o contraseña incorrectos.';
    errorEl.style.display = 'block';
  }
}

function doLogout() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-panel-view').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}


// ════════════════════════════════════════════════════════
// PESTAÑAS DEL PANEL ADMIN
// ════════════════════════════════════════════════════════

const ADMIN_TAB_ORDER = ['notices', 'events', 'schedule', 'photos', 'team'];

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach((el, i) => {
    el.classList.toggle('active', ADMIN_TAB_ORDER[i] === tab);
  });
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
}


// ════════════════════════════════════════════════════════
// AVISOS
// ════════════════════════════════════════════════════════

function addNotice() {
  const parish = document.getElementById('n-parish').value;
  const title  = document.getElementById('n-title').value.trim();
  const body   = document.getElementById('n-body').value.trim();
  if (!title) { showToast('Por favor ingresa un título.'); return; }

  const today = new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' });
  state.notices.unshift({ id: Date.now(), parish, title, body, date: today });
  document.getElementById('n-title').value = '';
  document.getElementById('n-body').value  = '';
  renderAll();
  showToast('Aviso agregado ✓');
}

function deleteNotice(id) {
  state.notices = state.notices.filter(n => n.id !== id);
  renderAll();
  showToast('Aviso eliminado.');
}


// ════════════════════════════════════════════════════════
// EVENTOS / FECHAS
// ════════════════════════════════════════════════════════

function addEvent() {
  const parish = document.getElementById('e-parish').value;
  const title  = document.getElementById('e-title').value.trim();
  const date   = document.getElementById('e-date').value;
  const desc   = document.getElementById('e-desc').value.trim();
  if (!title || !date) { showToast('Completa título y fecha.'); return; }

  state.events.push({ id: Date.now(), parish, title, date, desc });
  state.events.sort((a, b) => a.date.localeCompare(b.date));
  document.getElementById('e-title').value = '';
  document.getElementById('e-date').value  = '';
  document.getElementById('e-desc').value  = '';
  renderAll();
  showToast('Evento agregado ✓');
}

function deleteEvent(id) {
  state.events = state.events.filter(e => e.id !== id);
  renderAll();
  showToast('Evento eliminado.');
}


// ════════════════════════════════════════════════════════
// HORARIOS
// ════════════════════════════════════════════════════════

function addSchedule() {
  const parish = document.getElementById('s-parish').value;
  const day    = document.getElementById('s-day').value.trim();
  const time   = document.getElementById('s-time').value.trim();
  if (!day || !time) { showToast('Completa día y hora.'); return; }

  state.schedules.push({ id: Date.now(), parish, day, time });
  document.getElementById('s-day').value  = '';
  document.getElementById('s-time').value = '';
  renderAll();
  showToast('Horario agregado ✓');
}

function deleteSchedule(id) {
  state.schedules = state.schedules.filter(s => s.id !== id);
  renderAll();
  showToast('Horario eliminado.');
}


// ════════════════════════════════════════════════════════
// FOTOS DE GALERÍA
// ════════════════════════════════════════════════════════

function handlePhotos(e) {
  const parish = document.getElementById('p-parish').value;
  const files  = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      state.photos[parish].push({ id: Date.now() + Math.random(), src: ev.target.result });
      renderAll();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
  showToast(`${files.length} foto(s) subida(s) ✓`);
}

function deletePhoto(parish, id) {
  state.photos[parish] = state.photos[parish].filter(p => p.id !== id);
  renderAll();
  showToast('Foto eliminada.');
}


// ════════════════════════════════════════════════════════
// QUIÉNES SOMOS — EQUIPO
// ════════════════════════════════════════════════════════

/**
 * Guarda el texto descriptivo de la parroquia indicada.
 * @param {'sc'|'lj'} parish
 */
function saveTeamDescription(parish) {
  const text = document.getElementById('tm-' + parish + '-description').value.trim();
  state.team[parish].description = text;
  renderAll();
  showToast('Descripción guardada ✓');
}

/** Previsualiza la foto cargada para un nuevo miembro del equipo. */
function previewTeamPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('tm-photo-data').value = ev.target.result;
    document.getElementById('tm-photo-label').textContent = '✅ ' + file.name;
  };
  reader.readAsDataURL(file);
}

/** Agrega un nuevo miembro al equipo de la parroquia seleccionada. */
function addTeamMember() {
  const parish    = document.getElementById('tm-parish').value;
  const name      = document.getElementById('tm-name').value.trim();
  const role      = document.getElementById('tm-role').value.trim();
  const phone     = document.getElementById('tm-phone').value.trim();
  const email     = document.getElementById('tm-email').value.trim();
  const instagram = document.getElementById('tm-instagram').value.trim();
  const facebook  = document.getElementById('tm-facebook').value.trim();
  const photo     = document.getElementById('tm-photo-data').value;

  if (!name || !role) { showToast('El nombre y el cargo son obligatorios.'); return; }

  state.team[parish].members.push({ id: Date.now(), name, role, phone, email, instagram, facebook, photo });

  // Limpiar formulario
  ['tm-name','tm-role','tm-phone','tm-email','tm-instagram','tm-facebook','tm-photo-data'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('tm-photo-label').textContent = '📷 Subir foto';
  document.getElementById('tm-photo-input').value = '';

  renderAll();
  showToast('Persona agregada ✓');
}

/**
 * Elimina un miembro del equipo de la parroquia indicada.
 * @param {'sc'|'lj'} parish
 * @param {number} id
 */
function deleteTeamMember(parish, id) {
  state.team[parish].members = state.team[parish].members.filter(m => m.id !== id);
  renderAll();
  showToast('Persona eliminada.');
}


// ════════════════════════════════════════════════════════
// RENDERIZADO — FUNCIONES PRINCIPALES
// ════════════════════════════════════════════════════════

function renderAll() {
  renderParishPage('sc');
  renderParishPage('lj');
  renderQuienesSomos();
  renderAdminLists();
  renderAdminTeam();
}

/** Renderiza avisos, fechas, horarios y fotos de una parroquia. */
function renderParishPage(p) {
  renderNoticesPublic(p);
  renderEventsPublic(p);
  renderSchedulePublic(p);
  renderPhotosPublic(p);
}


// ════════════════════════════════════════════════════════
// RENDERIZADO — PÁGINA PÚBLICA
// ════════════════════════════════════════════════════════

function renderNoticesPublic(p) {
  const notices = state.notices.filter(n => n.parish === p);
  const el = document.getElementById(p + '-notices-display');
  if (!el) return;
  el.innerHTML = notices.length
    ? notices.map(n => `
        <div class="notice-item">
          <div class="notice-date">${n.date}</div>
          <div class="notice-text">
            <span class="notice-title">${esc(n.title)}</span>
            ${n.body ? esc(n.body) : ''}
          </div>
        </div>`).join('')
    : '<div class="empty-state">No hay avisos por el momento.</div>';
}

function renderEventsPublic(p) {
  const events = state.events.filter(e => e.parish === p);
  const el = document.getElementById(p + '-events-display');
  if (!el) return;
  if (!events.length) { el.innerHTML = '<div class="empty-state">No hay eventos próximos.</div>'; return; }
  el.innerHTML = events.map(ev => {
    const d     = new Date(ev.date + 'T00:00:00');
    const day   = d.toLocaleDateString('es-CL', { day:'2-digit' });
    const month = d.toLocaleDateString('es-CL', { month:'short' }).toUpperCase();
    return `
      <div class="event-item">
        <div class="event-date-box">
          <div class="month">${month}</div><div class="day">${day}</div>
        </div>
        <div class="event-info">
          <h4>${esc(ev.title)}</h4>
          ${ev.desc ? `<p>${esc(ev.desc)}</p>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderSchedulePublic(p) {
  const scheds = state.schedules.filter(s => s.parish === p);
  const el = document.getElementById(p + '-schedule-display');
  if (!el) return;
  el.innerHTML = scheds.length
    ? scheds.map(s => `
        <div class="schedule-item">
          <span class="schedule-day">${esc(s.day)}</span>
          <span class="schedule-time">${esc(s.time)}</span>
        </div>`).join('')
    : '<div class="empty-state">Horario no disponible aún.</div>';
}

function renderPhotosPublic(p) {
  const photos = state.photos[p];
  const el = document.getElementById(p + '-photos-display');
  if (!el) return;
  el.innerHTML = photos.length
    ? photos.map(ph => `
        <div class="photo-thumb" onclick="openLightbox('${ph.src}')">
          <img src="${ph.src}" alt="Foto parroquia">
        </div>`).join('')
    : '<div class="empty-state" style="grid-column:1/-1;">No hay fotos aún.</div>';
}


// ════════════════════════════════════════════════════════
// RENDERIZADO — PÁGINA QUIÉNES SOMOS
// ════════════════════════════════════════════════════════

function renderQuienesSomos() {
  ['sc', 'lj'].forEach(p => {
    // Descripción
    const descWrap = document.getElementById('qdesc-' + p + '-wrap');
    const descText = document.getElementById('qdesc-' + p);
    if (descWrap && descText) {
      if (state.team[p].description) {
        descText.textContent = state.team[p].description;
        descWrap.style.display = 'block';
      } else {
        descWrap.style.display = 'none';
      }
    }

    // Tarjetas del equipo
    const grid = document.getElementById('qteam-' + p);
    if (!grid) return;
    const members = state.team[p].members;
    grid.innerHTML = members.length
      ? members.map(m => buildTeamCard(m, p)).join('')
      : '<div class="empty-state" style="grid-column:1/-1;">No hay personas registradas aún.</div>';
  });
}

/** Construye el HTML de una tarjeta de persona del equipo. */
function buildTeamCard(m, parish) {
  const igSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  const fbSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;

  const roleColor = parish === 'sc' ? 'var(--sc-blue)' : 'var(--lj-burgundy)';

  return `
    <div class="team-card">
      <div class="team-photo-wrap">
        ${m.photo
          ? `<img src="${m.photo}" alt="${esc(m.name)}" class="team-photo">`
          : `<div class="team-photo-placeholder">👤</div>`}
      </div>
      <div class="team-info">
        <h4 class="team-name">${esc(m.name)}</h4>
        <span class="team-role" style="background:${roleColor};">${esc(m.role)}</span>
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
// RENDERIZADO — PANEL ADMIN
// ════════════════════════════════════════════════════════

function renderAdminLists() {
  const noticesEl = document.getElementById('admin-notices-list');
  if (!noticesEl) return;

  // Avisos
  noticesEl.innerHTML = state.notices.length
    ? state.notices.map(n => `
        <div class="admin-list-item">
          <div class="admin-list-item-text">
            <strong><span class="parish-badge ${n.parish==='sc'?'badge-sc':'badge-lj'}">${n.parish==='sc'?'SC':'LJ'}</span>${esc(n.title)}</strong>
            <span>${esc(n.body)} · ${n.date}</span>
          </div>
          <button class="btn-del" onclick="deleteNotice(${n.id})">✕</button>
        </div>`).join('')
    : '<div class="empty-state">No hay avisos.</div>';

  // Eventos
  const eventsEl = document.getElementById('admin-events-list');
  eventsEl.innerHTML = state.events.length
    ? state.events.map(ev => `
        <div class="admin-list-item">
          <div class="admin-list-item-text">
            <strong><span class="parish-badge ${ev.parish==='sc'?'badge-sc':'badge-lj'}">${ev.parish==='sc'?'SC':'LJ'}</span>${esc(ev.title)}</strong>
            <span>${ev.date}${ev.desc?' · '+esc(ev.desc):''}</span>
          </div>
          <button class="btn-del" onclick="deleteEvent(${ev.id})">✕</button>
        </div>`).join('')
    : '<div class="empty-state">No hay eventos.</div>';

  // Horarios
  const schedEl = document.getElementById('admin-schedule-list');
  schedEl.innerHTML = state.schedules.length
    ? state.schedules.map(s => `
        <div class="admin-list-item">
          <div class="admin-list-item-text">
            <strong><span class="parish-badge ${s.parish==='sc'?'badge-sc':'badge-lj'}">${s.parish==='sc'?'SC':'LJ'}</span>${esc(s.day)}</strong>
            <span>${esc(s.time)}</span>
          </div>
          <button class="btn-del" onclick="deleteSchedule(${s.id})">✕</button>
        </div>`).join('')
    : '<div class="empty-state">No hay horarios.</div>';

  // Fotos
  ['sc','lj'].forEach(p => {
    const grid = document.getElementById('admin-' + p + '-photos');
    if (!grid) return;
    grid.innerHTML = state.photos[p].length
      ? state.photos[p].map(ph => `
          <div class="photo-admin-item">
            <img src="${ph.src}" alt="">
            <button class="del-photo" onclick="deletePhoto('${p}',${ph.id})">✕</button>
          </div>`).join('')
      : '<div class="empty-state">Sin fotos.</div>';
  });
}

function renderAdminTeam() {
  ['sc','lj'].forEach(p => {
    // Rellenar textarea de descripción si ya tiene valor guardado
    const descInput = document.getElementById('tm-' + p + '-description');
    if (descInput && state.team[p].description && !descInput.value) {
      descInput.value = state.team[p].description;
    }

    const listEl = document.getElementById('admin-team-' + p + '-list');
    if (!listEl) return;
    const members = state.team[p].members;
    listEl.innerHTML = members.length
      ? members.map(m => `
          <div class="admin-list-item">
            <div style="display:flex;align-items:center;gap:0.75rem;flex:1;">
              ${m.photo
                ? `<img src="${m.photo}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #e0d5c0;">`
                : `<div style="width:44px;height:44px;border-radius:50%;background:#e8dfc8;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👤</div>`
              }
              <div class="admin-list-item-text">
                <strong>${esc(m.name)}</strong>
                <span>${esc(m.role)}${m.phone?' · 📞 '+esc(m.phone):''}${m.email?' · ✉️ '+esc(m.email):''}</span>
              </div>
            </div>
            <button class="btn-del" onclick="deleteTeamMember('${p}',${m.id})">✕</button>
          </div>`).join('')
      : '<div class="empty-state">No hay personas registradas.</div>';
  });
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
  return str
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}


// ════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════
renderAll();