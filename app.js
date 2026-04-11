/* ════════════════════════════════════════════════════════
   app.js — Parroquias San Crescente & Nuestra Señora de Luján
   Base de datos: Supabase (JS SDK v2)

   TABLAS USADAS (esquema real):
   ─────────────────────────────
   parishes        → id (text PK), name, about_us, updated_at
   notices         → id (uuid PK), parish_id (→parishes.id), title, content, created_at
   events          → id (uuid PK), parish_id, title, event_date, description, created_at
   photos          → id (uuid PK), parish_id, url, description, created_at

   TABLAS EXTRA (ver supabase_extra.sql para crearlas):
   ─────────────────────────────────────────────────────
   schedules       → id (uuid PK), parish_id, day, time, created_at
   team_members    → id (uuid PK), parish_id, name, role, phone, email,
                     instagram, facebook, photo_url, created_at
════════════════════════════════════════════════════════ */


// ════════════════════════════════════════════════════════
// CONFIGURACIÓN SUPABASE
// ════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://ojosqscdzjehutitdfoz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_laJxknrjuvEn4FvHN0wIJg_hROPOPdx';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// IDs de parroquia tal como están en la tabla `parishes`
const PARISH_IDS = { sc: 'sc', lj: 'lj' };


// ════════════════════════════════════════════════════════
// ESTADO LOCAL (caché en memoria)
// ════════════════════════════════════════════════════════

const state = {
  parishes: {
    sc: { id: 'sc', name: 'Parroquia San Crescente',           about_us: '' },
    lj: { id: 'lj', name: 'Parroquia Nuestra Señora de Luján', about_us: '' }
  },
  notices:   [],          // todos los avisos de ambas parroquias
  events:    [],          // todos los eventos
  photos:    { sc: [], lj: [] },
  schedules: { sc: [], lj: [] },
  team:      { sc: [], lj: [] }
};


// ════════════════════════════════════════════════════════
// CARGA INICIAL DESDE SUPABASE
// ════════════════════════════════════════════════════════

async function loadAllData() {
  showLoading(true);
  try {
    // Cargar todo en paralelo
    const [
      { data: parishes,  error: eParishes  },
      { data: notices,   error: eNotices   },
      { data: events,    error: eEvents    },
      { data: photos,    error: ePhotos    },
      { data: schedules, error: eSchedules },
      { data: team,      error: eTeam      }
    ] = await Promise.all([
      db.from('parishes').select('*'),
      db.from('notices').select('*').order('created_at', { ascending: false }),
      db.from('events').select('*').order('event_date', { ascending: true }),
      db.from('photos').select('*').order('created_at', { ascending: true }),
      db.from('schedules').select('*').order('created_at', { ascending: true }),
      db.from('team_members').select('*').order('created_at', { ascending: true })
    ]);

    // Parroquias → guardar about_us en estado local
    if (parishes) {
      parishes.forEach(p => {
        if (state.parishes[p.id]) {
          state.parishes[p.id].about_us = p.about_us || '';
          state.parishes[p.id].name     = p.name;
        }
      });
    }

    // Avisos
    state.notices = notices || [];

    // Eventos
    state.events = events || [];

    // Fotos separadas por parroquia
    const allPhotos = photos || [];
    state.photos.sc = allPhotos.filter(p => p.parish_id === 'sc');
    state.photos.lj = allPhotos.filter(p => p.parish_id === 'lj');

    // Horarios (tabla extra)
    const allSchedules = schedules || [];
    state.schedules.sc = allSchedules.filter(s => s.parish_id === 'sc');
    state.schedules.lj = allSchedules.filter(s => s.parish_id === 'lj');

    // Equipo (tabla extra)
    const allTeam = team || [];
    state.team.sc = allTeam.filter(m => m.parish_id === 'sc');
    state.team.lj = allTeam.filter(m => m.parish_id === 'lj');

    renderAll();
  } catch (err) {
    console.error('Error cargando datos:', err);
    showToast('⚠️ Error al conectar con la base de datos.');
  } finally {
    showLoading(false);
  }
}


// ════════════════════════════════════════════════════════
// NAVEGACIÓN
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

function switchQuienesTab(parish) {
  ['sc', 'lj'].forEach(p => {
    document.getElementById('qtab-'  + p).classList.toggle('active', p === parish);
    document.getElementById('qpanel-'+ p).classList.toggle('active', p === parish);
  });
}


// ════════════════════════════════════════════════════════
// AUTENTICACIÓN ADMIN
// ════════════════════════════════════════════════════════

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'parroquia2024';

function doLogin(event) {
    // 1. EVITAR RECARGA: Si el botón está en un <form>, esto evita que la página se refresque
    if (event) event.preventDefault();

    const userEl = document.getElementById('login-user');
    const passEl = document.getElementById('login-pass');
    const errorEl = document.getElementById('login-error');

    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    // 2. LOG DE SEGURIDAD (Míralo en F12 si falla)
    console.log("Validando acceso para:", user);

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        // Ocultar login y mostrar panel
        document.getElementById('admin-login-view').style.display = 'none';
        document.getElementById('admin-panel-view').style.display = 'block';
        errorEl.style.display = 'none';

        // 3. RELLENAR DATOS: Aseguramos que los campos de texto tengan la info de Supabase
        const scDesc = document.getElementById('tm-sc-description');
        const ljDesc = document.getElementById('tm-lj-description');
        
        if (scDesc) scDesc.value = state.parishes.sc.about_us || '';
        if (ljDesc) ljDesc.value = state.parishes.lj.about_us || '';

        // Actualizar listas de la base de datos en la vista admin
        renderAll();
        showToast('Acceso concedido ✓');
    } else {
        errorEl.textContent = 'Usuario o contraseña incorrectos.';
        errorEl.style.display = 'block';
        passEl.value = ''; // Limpiar clave por seguridad
    }
}

function doLogout() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-panel-view').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}


// ════════════════════════════════════════════════════════
// PESTAÑAS PANEL ADMIN
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
// AVISOS  (tabla: notices → parish_id, title, content)
// ════════════════════════════════════════════════════════

async function addNotice() {
  const parish_id = document.getElementById('n-parish').value;
  const title     = document.getElementById('n-title').value.trim();
  const content   = document.getElementById('n-content').value.trim();

  if (!title) { showToast('Por favor ingresa un título.'); return; }

  showLoading(true);
  const { data, error } = await db
    .from('notices')
    .insert([{ parish_id, title, content }])
    .select()
    .single();
  showLoading(false);

  if (error) { showToast('⚠️ Error al guardar el aviso.'); console.error(error); return; }

  state.notices.unshift(data);
  document.getElementById('n-title').value   = '';
  document.getElementById('n-content').value = '';
  renderAll();
  showToast('Aviso agregado ✓');
}

async function deleteNotice(id) {
  const { error } = await db.from('notices').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar el aviso.'); return; }
  state.notices = state.notices.filter(n => n.id !== id);
  renderAll();
  showToast('Aviso eliminado.');
}


// ════════════════════════════════════════════════════════
// EVENTOS  (tabla: events → parish_id, title, event_date, description)
// ════════════════════════════════════════════════════════

async function addEvent() {
  const parish_id   = document.getElementById('e-parish').value;
  const title       = document.getElementById('e-title').value.trim();
  const event_date  = document.getElementById('e-date').value;
  const description = document.getElementById('e-desc').value.trim();

  if (!title || !event_date) { showToast('Completa título y fecha.'); return; }

  showLoading(true);
  const { data, error } = await db
    .from('events')
    .insert([{ parish_id, title, event_date, description }])
    .select()
    .single();
  showLoading(false);

  if (error) { showToast('⚠️ Error al guardar el evento.'); console.error(error); return; }

  state.events.push(data);
  state.events.sort((a, b) => a.event_date.localeCompare(b.event_date));
  document.getElementById('e-title').value = '';
  document.getElementById('e-date').value  = '';
  document.getElementById('e-desc').value  = '';
  renderAll();
  showToast('Evento agregado ✓');
}

async function deleteEvent(id) {
  const { error } = await db.from('events').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar el evento.'); return; }
  state.events = state.events.filter(e => e.id !== id);
  renderAll();
  showToast('Evento eliminado.');
}


// ════════════════════════════════════════════════════════
// HORARIOS  (tabla extra: schedules → parish_id, day, time)
// ════════════════════════════════════════════════════════

async function addSchedule() {
  const parish_id = document.getElementById('s-parish').value;
  const day       = document.getElementById('s-day').value.trim();
  const time      = document.getElementById('s-time').value.trim();

  if (!day || !time) { showToast('Completa día y hora.'); return; }

  showLoading(true);
  const { data, error } = await db
    .from('schedules')
    .insert([{ parish_id, day, time }])
    .select()
    .single();
  showLoading(false);

  if (error) { showToast('⚠️ Error al guardar el horario.'); console.error(error); return; }

  state.schedules[parish_id].push(data);
  document.getElementById('s-day').value  = '';
  document.getElementById('s-time').value = '';
  renderAll();
  showToast('Horario agregado ✓');
}

async function deleteSchedule(id, parish_id) {
  const { error } = await db.from('schedules').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar el horario.'); return; }
  state.schedules[parish_id] = state.schedules[parish_id].filter(s => s.id !== id);
  renderAll();
  showToast('Horario eliminado.');
}


// ════════════════════════════════════════════════════════
// FOTOS  (tabla: photos → parish_id, url, description)
// Soporta URL directa O subida de archivo (convertida a base64 como URL)
// ════════════════════════════════════════════════════════

// Previsualización al elegir archivo
function handlePhotoFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('p-base64').value = ev.target.result;
    document.getElementById('p-url').value    = '';   // limpiar campo URL
    const preview = document.getElementById('photo-preview');
    preview.src = ev.target.result;
    document.getElementById('photo-preview-wrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function addPhoto() {
  const parish_id   = document.getElementById('p-parish').value;
  const description = document.getElementById('p-desc').value.trim();
  const urlField    = document.getElementById('p-url').value.trim();
  const base64Field = document.getElementById('p-base64').value;

  // Usar URL si existe, si no usar base64
  const url = urlField || base64Field;
  if (!url) { showToast('Agrega una URL o sube una imagen.'); return; }

  showLoading(true);
  const { data, error } = await db
    .from('photos')
    .insert([{ parish_id, url, description }])
    .select()
    .single();
  showLoading(false);

  if (error) { showToast('⚠️ Error al guardar la foto.'); console.error(error); return; }

  state.photos[parish_id].push(data);

  // Limpiar formulario
  document.getElementById('p-url').value    = '';
  document.getElementById('p-desc').value   = '';
  document.getElementById('p-base64').value = '';
  document.getElementById('photo-preview-wrap').style.display = 'none';
  document.getElementById('photo-upload-input').value = '';

  renderAll();
  showToast('Foto agregada ✓');
}

async function deletePhoto(id, parish_id) {
  const { error } = await db.from('photos').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar la foto.'); return; }
  state.photos[parish_id] = state.photos[parish_id].filter(p => p.id !== id);
  renderAll();
  showToast('Foto eliminada.');
}


// ════════════════════════════════════════════════════════
// QUIÉNES SOMOS — about_us (tabla: parishes → about_us)
// ════════════════════════════════════════════════════════

async function saveParishAbout(parish_id) {
  const about_us = document.getElementById('tm-' + parish_id + '-description').value.trim();

  showLoading(true);
  const { error } = await db
    .from('parishes')
    .update({ about_us, updated_at: new Date().toISOString() })
    .eq('id', parish_id);
  showLoading(false);

  if (error) { showToast('⚠️ Error al guardar la descripción.'); console.error(error); return; }

  state.parishes[parish_id].about_us = about_us;
  renderAll();
  showToast('Descripción guardada ✓');
}


// ════════════════════════════════════════════════════════
// QUIÉNES SOMOS — Personas (tabla extra: team_members)
// ════════════════════════════════════════════════════════

function previewTeamPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('tm-photo-data').value  = ev.target.result;
    document.getElementById('tm-photo-label').textContent = '✅ ' + file.name;
  };
  reader.readAsDataURL(file);
}

async function addTeamMember() {
  const parish_id = document.getElementById('tm-parish').value;
  const name      = document.getElementById('tm-name').value.trim();
  const role      = document.getElementById('tm-role').value.trim();
  const phone     = document.getElementById('tm-phone').value.trim();
  const email     = document.getElementById('tm-email').value.trim();
  const instagram = document.getElementById('tm-instagram').value.trim();
  const facebook  = document.getElementById('tm-facebook').value.trim();
  const photo_url = document.getElementById('tm-photo-data').value;

  if (!name || !role) { showToast('El nombre y el cargo son obligatorios.'); return; }

  showLoading(true);
  const { data, error } = await db
    .from('team_members')
    .insert([{ parish_id, name, role, phone, email, instagram, facebook, photo_url }])
    .select()
    .single();
  showLoading(false);

  if (error) { showToast('⚠️ Error al guardar la persona.'); console.error(error); return; }

  state.team[parish_id].push(data);

  // Limpiar formulario
  ['tm-name','tm-role','tm-phone','tm-email','tm-instagram','tm-facebook','tm-photo-data']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('tm-photo-label').textContent = '📷 Subir foto';
  document.getElementById('tm-photo-input').value = '';

  renderAll();
  showToast('Persona agregada ✓');
}

async function deleteTeamMember(id, parish_id) {
  const { error } = await db.from('team_members').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar la persona.'); return; }
  state.team[parish_id] = state.team[parish_id].filter(m => m.id !== id);
  renderAll();
  showToast('Persona eliminada.');
}


// ════════════════════════════════════════════════════════
// RENDERIZADO PRINCIPAL
// ════════════════════════════════════════════════════════

function renderAll() {
  ['sc', 'lj'].forEach(p => {
    renderNotices(p);
    renderEvents(p);
    renderSchedules(p);
    renderPhotos(p);
  });
  renderQuienesSomos();
  renderAdminLists();
  renderAdminTeam();
}

// ── Avisos públicos ──────────────────────────────────────
function renderNotices(p) {
  const el = document.getElementById(p + '-notices-display');
  if (!el) return;
  const list = state.notices.filter(n => n.parish_id === p);

  if (!list.length) { el.innerHTML = '<div class="empty-state">No hay avisos por el momento.</div>'; return; }

  el.innerHTML = list.map(n => {
    const date = new Date(n.created_at).toLocaleDateString('es-CL',
      { day:'2-digit', month:'short', year:'numeric' });
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

// ── Eventos públicos ─────────────────────────────────────
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

// ── Horarios públicos ────────────────────────────────────
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

// ── Fotos públicas ───────────────────────────────────────
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

// ── Quiénes Somos ────────────────────────────────────────
function renderQuienesSomos() {
  ['sc', 'lj'].forEach(p => {
    // Descripción (about_us de parishes)
    const descWrap = document.getElementById('qdesc-' + p + '-wrap');
    const descText = document.getElementById('qdesc-' + p);
    if (descWrap && descText) {
      const txt = state.parishes[p].about_us;
      descText.textContent   = txt;
      descWrap.style.display = txt ? 'block' : 'none';
    }

    // Tarjetas del equipo
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
  const color = parish === 'sc' ? 'var(--sc-blue)' : 'var(--lj-burgundy)';

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
          ${m.phone     ? `<a href="tel:${esc(m.phone)}"                          class="team-contact-link phone">📞 ${esc(m.phone)}</a>` : ''}
          ${m.email     ? `<a href="mailto:${esc(m.email)}"                        class="team-contact-link email">✉️ ${esc(m.email)}</a>` : ''}
          ${m.instagram ? `<a href="https://instagram.com/${esc(m.instagram)}" target="_blank" class="team-contact-link instagram">${igSVG} @${esc(m.instagram)}</a>` : ''}
          ${m.facebook  ? `<a href="https://facebook.com/${esc(m.facebook)}"  target="_blank" class="team-contact-link facebook">${fbSVG} ${esc(m.facebook)}</a>` : ''}
        </div>
      </div>
    </div>`;
}

// ── Admin: listas de contenido ───────────────────────────
function renderAdminLists() {
  const noticesEl = document.getElementById('admin-notices-list');
  if (!noticesEl) return;

  // Avisos
  noticesEl.innerHTML = state.notices.length
    ? state.notices.map(n => {
        const date = new Date(n.created_at).toLocaleDateString('es-CL',
          { day:'2-digit', month:'short', year:'numeric' });
        return `
          <div class="admin-list-item">
            <div class="admin-list-item-text">
              <strong>
                <span class="parish-badge ${n.parish_id==='sc'?'badge-sc':'badge-lj'}">
                  ${n.parish_id==='sc'?'SC':'LJ'}
                </span>${esc(n.title)}
              </strong>
              <span>${esc(n.content||'')} · ${date}</span>
            </div>
            <button class="btn-del" onclick="deleteNotice('${n.id}')">✕</button>
          </div>`;
      }).join('')
    : '<div class="empty-state">No hay avisos.</div>';

  // Eventos
  const eventsEl = document.getElementById('admin-events-list');
  eventsEl.innerHTML = state.events.length
    ? state.events.map(ev => `
        <div class="admin-list-item">
          <div class="admin-list-item-text">
            <strong>
              <span class="parish-badge ${ev.parish_id==='sc'?'badge-sc':'badge-lj'}">
                ${ev.parish_id==='sc'?'SC':'LJ'}
              </span>${esc(ev.title)}
            </strong>
            <span>${ev.event_date}${ev.description?' · '+esc(ev.description):''}</span>
          </div>
          <button class="btn-del" onclick="deleteEvent('${ev.id}')">✕</button>
        </div>`).join('')
    : '<div class="empty-state">No hay eventos.</div>';

  // Horarios
  const schedEl = document.getElementById('admin-schedule-list');
  const allSchedules = [...state.schedules.sc, ...state.schedules.lj];
  schedEl.innerHTML = allSchedules.length
    ? allSchedules.map(s => `
        <div class="admin-list-item">
          <div class="admin-list-item-text">
            <strong>
              <span class="parish-badge ${s.parish_id==='sc'?'badge-sc':'badge-lj'}">
                ${s.parish_id==='sc'?'SC':'LJ'}
              </span>${esc(s.day)}
            </strong>
            <span>${esc(s.time)}</span>
          </div>
          <button class="btn-del" onclick="deleteSchedule('${s.id}','${s.parish_id}')">✕</button>
        </div>`).join('')
    : '<div class="empty-state">No hay horarios.</div>';

  // Fotos
  ['sc', 'lj'].forEach(p => {
    const grid = document.getElementById('admin-' + p + '-photos');
    if (!grid) return;
    grid.innerHTML = state.photos[p].length
      ? state.photos[p].map(ph => `
          <div class="photo-admin-item">
            <img src="${ph.url}" alt="${esc(ph.description||'')}">
            <button class="del-photo" onclick="deletePhoto('${ph.id}','${p}')">✕</button>
          </div>`).join('')
      : '<div class="empty-state">Sin fotos.</div>';
  });
}

// ── Admin: equipo ────────────────────────────────────────
function renderAdminTeam() {
  ['sc', 'lj'].forEach(p => {
    // Rellenar textarea de descripción
    const descEl = document.getElementById('tm-' + p + '-description');
    if (descEl && !descEl.value && state.parishes[p].about_us) {
      descEl.value = state.parishes[p].about_us;
    }

    const listEl = document.getElementById('admin-team-' + p + '-list');
    if (!listEl) return;
    const members = state.team[p];

    listEl.innerHTML = members.length
      ? members.map(m => `
          <div class="admin-list-item">
            <div style="display:flex;align-items:center;gap:0.75rem;flex:1;">
              ${m.photo_url
                ? `<img src="${m.photo_url}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #e0d5c0;">`
                : `<div style="width:44px;height:44px;border-radius:50%;background:#e8dfc8;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👤</div>`}
              <div class="admin-list-item-text">
                <strong>${esc(m.name)}</strong>
                <span>${esc(m.role)}${m.phone?' · 📞 '+esc(m.phone):''}${m.email?' · ✉️ '+esc(m.email):''}</span>
              </div>
            </div>
            <button class="btn-del" onclick="deleteTeamMember('${m.id}','${p}')">✕</button>
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function showLoading(visible) {
  document.getElementById('global-loading').style.display = visible ? 'flex' : 'none';
}


// ════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════
loadAllData();