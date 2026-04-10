/* ════════════════════════════════════════════════════════
   app.js — Lógica de las Parroquias
════════════════════════════════════════════════════════ */

// ────────────────────────────────────────────────────────
// ESTADO GLOBAL
// Aquí se guardan todos los datos en memoria.
// Para persistencia real, reemplaza con localStorage o una API.
// ────────────────────────────────────────────────────────
const state = {
  notices:   [],          // Avisos de ambas parroquias
  events:    [],          // Eventos/fechas de ambas parroquias
  schedules: [],          // Horarios de misa de ambas parroquias
  photos: {
    sc: [],               // Fotos de San Crescente
    lj: []                // Fotos de Nuestra Señora de Luján
  }
};


// ════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE PÁGINAS
// ════════════════════════════════════════════════════════

/**
 * Muestra la página indicada y oculta las demás.
 * @param {string} id - 'home' | 'sc' | 'lj' | 'admin'
 */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  // Resaltar el botón de nav activo
  const pageOrder = ['home', 'sc', 'lj', 'admin'];
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    btn.classList.toggle('active', pageOrder[i] === id);
  });

  renderAll();
}


// ════════════════════════════════════════════════════════
// AUTENTICACIÓN (admin)
// ════════════════════════════════════════════════════════

// Credenciales — cámbialas según sea necesario
const ADMIN_USER = 'ANDRESVALENCIA';
const ADMIN_PASS = 'PARROQUIAS2';

/** Valida las credenciales y muestra el panel si son correctas. */
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-panel-view').style.display = 'block';
    errorEl.style.display = 'none';
    renderAdminLists();
  } else {
    errorEl.textContent = 'Usuario o contraseña incorrectos.';
    errorEl.style.display = 'block';
  }
}

/** Cierra sesión y vuelve a mostrar el formulario de login. */
function doLogout() {
  document.getElementById('admin-login-view').style.display = 'flex';
  document.getElementById('admin-panel-view').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}


// ════════════════════════════════════════════════════════
// PESTAÑAS DEL PANEL DE ADMINISTRACIÓN
// ════════════════════════════════════════════════════════

const ADMIN_TAB_ORDER = ['notices', 'events', 'schedule', 'photos'];

/**
 * Cambia la pestaña activa dentro del panel admin.
 * @param {string} tab - 'notices' | 'events' | 'schedule' | 'photos'
 */
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

/** Agrega un aviso al estado y actualiza la vista. */
function addNotice() {
  const parish = document.getElementById('n-parish').value;
  const title  = document.getElementById('n-title').value.trim();
  const body   = document.getElementById('n-body').value.trim();

  if (!title) {
    showToast('Por favor ingresa un título.');
    return;
  }

  const today = new Date().toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  state.notices.unshift({ id: Date.now(), parish, title, body, date: today });

  // Limpiar formulario
  document.getElementById('n-title').value = '';
  document.getElementById('n-body').value  = '';

  renderAll();
  showToast('Aviso agregado ✓');
}

/**
 * Elimina un aviso por su ID.
 * @param {number} id
 */
function deleteNotice(id) {
  state.notices = state.notices.filter(n => n.id !== id);
  renderAll();
  showToast('Aviso eliminado.');
}


// ════════════════════════════════════════════════════════
// EVENTOS / FECHAS
// ════════════════════════════════════════════════════════

/** Agrega un evento al estado y actualiza la vista. */
function addEvent() {
  const parish = document.getElementById('e-parish').value;
  const title  = document.getElementById('e-title').value.trim();
  const date   = document.getElementById('e-date').value;
  const desc   = document.getElementById('e-desc').value.trim();

  if (!title || !date) {
    showToast('Completa título y fecha.');
    return;
  }

  state.events.push({ id: Date.now(), parish, title, date, desc });
  state.events.sort((a, b) => a.date.localeCompare(b.date)); // Orden cronológico

  // Limpiar formulario
  document.getElementById('e-title').value = '';
  document.getElementById('e-date').value  = '';
  document.getElementById('e-desc').value  = '';

  renderAll();
  showToast('Evento agregado ✓');
}

/**
 * Elimina un evento por su ID.
 * @param {number} id
 */
function deleteEvent(id) {
  state.events = state.events.filter(e => e.id !== id);
  renderAll();
  showToast('Evento eliminado.');
}


// ════════════════════════════════════════════════════════
// HORARIOS DE MISA
// ════════════════════════════════════════════════════════

/** Agrega un horario al estado y actualiza la vista. */
function addSchedule() {
  const parish = document.getElementById('s-parish').value;
  const day    = document.getElementById('s-day').value.trim();
  const time   = document.getElementById('s-time').value.trim();

  if (!day || !time) {
    showToast('Completa día y hora.');
    return;
  }

  state.schedules.push({ id: Date.now(), parish, day, time });

  // Limpiar formulario
  document.getElementById('s-day').value  = '';
  document.getElementById('s-time').value = '';

  renderAll();
  showToast('Horario agregado ✓');
}

/**
 * Elimina un horario por su ID.
 * @param {number} id
 */
function deleteSchedule(id) {
  state.schedules = state.schedules.filter(s => s.id !== id);
  renderAll();
  showToast('Horario eliminado.');
}


// ════════════════════════════════════════════════════════
// FOTOS
// ════════════════════════════════════════════════════════

/**
 * Lee los archivos seleccionados y los convierte a Base64 para mostrarlos.
 * @param {Event} e - Evento del input file
 */
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

  e.target.value = ''; // Reset input para permitir volver a subir el mismo archivo
  showToast(`${files.length} foto(s) subida(s) ✓`);
}

/**
 * Elimina una foto de la parroquia indicada.
 * @param {string} parish - 'sc' | 'lj'
 * @param {number} id
 */
function deletePhoto(parish, id) {
  state.photos[parish] = state.photos[parish].filter(p => p.id !== id);
  renderAll();
  showToast('Foto eliminada.');
}


// ════════════════════════════════════════════════════════
// RENDERIZADO
// ════════════════════════════════════════════════════════

/** Actualiza todas las vistas públicas y el panel admin. */
function renderAll() {
  renderParishPage('sc');
  renderParishPage('lj');
  renderAdminLists();
}

/**
 * Renderiza la página pública de una parroquia (avisos, eventos, horarios, fotos).
 * @param {string} p - 'sc' | 'lj'
 */
function renderParishPage(p) {
  renderNoticesPublic(p);
  renderEventsPublic(p);
  renderSchedulePublic(p);
  renderPhotosPublic(p);
}

function renderNoticesPublic(p) {
  const notices = state.notices.filter(n => n.parish === p);
  const el = document.getElementById(p + '-notices-display');

  if (!notices.length) {
    el.innerHTML = '<div class="empty-state">No hay avisos por el momento.</div>';
    return;
  }

  el.innerHTML = notices.map(n => `
    <div class="notice-item">
      <div class="notice-date">${n.date}</div>
      <div class="notice-text">
        <span class="notice-title">${esc(n.title)}</span>
        ${n.body ? esc(n.body) : ''}
      </div>
    </div>
  `).join('');
}

function renderEventsPublic(p) {
  const events = state.events.filter(e => e.parish === p);
  const el = document.getElementById(p + '-events-display');

  if (!events.length) {
    el.innerHTML = '<div class="empty-state">No hay eventos próximos.</div>';
    return;
  }

  el.innerHTML = events.map(ev => {
    const d     = new Date(ev.date + 'T00:00:00');
    const day   = d.toLocaleDateString('es-CL', { day: '2-digit' });
    const month = d.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase();

    return `
      <div class="event-item">
        <div class="event-date-box">
          <div class="month">${month}</div>
          <div class="day">${day}</div>
        </div>
        <div class="event-info">
          <h4>${esc(ev.title)}</h4>
          ${ev.desc ? `<p>${esc(ev.desc)}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderSchedulePublic(p) {
  const schedules = state.schedules.filter(s => s.parish === p);
  const el = document.getElementById(p + '-schedule-display');

  if (!schedules.length) {
    el.innerHTML = '<div class="empty-state">Horario no disponible aún.</div>';
    return;
  }

  el.innerHTML = schedules.map(s => `
    <div class="schedule-item">
      <span class="schedule-day">${esc(s.day)}</span>
      <span class="schedule-time">${esc(s.time)}</span>
    </div>
  `).join('');
}

function renderPhotosPublic(p) {
  const photos = state.photos[p];
  const el = document.getElementById(p + '-photos-display');

  if (!photos.length) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">No hay fotos aún.</div>';
    return;
  }

  el.innerHTML = photos.map(ph => `
    <div class="photo-thumb" onclick="openLightbox('${ph.src}')">
      <img src="${ph.src}" alt="Foto parroquia">
    </div>
  `).join('');
}

/** Renderiza las listas del panel de administración. */
function renderAdminLists() {
  const noticesEl = document.getElementById('admin-notices-list');
  if (!noticesEl) return; // El panel puede no estar visible aún

  // ── Avisos ──
  if (!state.notices.length) {
    noticesEl.innerHTML = '<div class="empty-state">No hay avisos.</div>';
  } else {
    noticesEl.innerHTML = state.notices.map(n => `
      <div class="admin-list-item">
        <div class="admin-list-item-text">
          <strong>
            <span class="parish-badge ${n.parish === 'sc' ? 'badge-sc' : 'badge-lj'}">
              ${n.parish === 'sc' ? 'SC' : 'LJ'}
            </span>
            ${esc(n.title)}
          </strong>
          <span>${esc(n.body)} · ${n.date}</span>
        </div>
        <button class="btn-del" onclick="deleteNotice(${n.id})">✕</button>
      </div>
    `).join('');
  }

  // ── Eventos ──
  const eventsEl = document.getElementById('admin-events-list');
  if (!state.events.length) {
    eventsEl.innerHTML = '<div class="empty-state">No hay eventos.</div>';
  } else {
    eventsEl.innerHTML = state.events.map(ev => `
      <div class="admin-list-item">
        <div class="admin-list-item-text">
          <strong>
            <span class="parish-badge ${ev.parish === 'sc' ? 'badge-sc' : 'badge-lj'}">
              ${ev.parish === 'sc' ? 'SC' : 'LJ'}
            </span>
            ${esc(ev.title)}
          </strong>
          <span>${ev.date}${ev.desc ? ' · ' + esc(ev.desc) : ''}</span>
        </div>
        <button class="btn-del" onclick="deleteEvent(${ev.id})">✕</button>
      </div>
    `).join('');
  }

  // ── Horarios ──
  const schedEl = document.getElementById('admin-schedule-list');
  if (!state.schedules.length) {
    schedEl.innerHTML = '<div class="empty-state">No hay horarios.</div>';
  } else {
    schedEl.innerHTML = state.schedules.map(s => `
      <div class="admin-list-item">
        <div class="admin-list-item-text">
          <strong>
            <span class="parish-badge ${s.parish === 'sc' ? 'badge-sc' : 'badge-lj'}">
              ${s.parish === 'sc' ? 'SC' : 'LJ'}
            </span>
            ${esc(s.day)}
          </strong>
          <span>${esc(s.time)}</span>
        </div>
        <button class="btn-del" onclick="deleteSchedule(${s.id})">✕</button>
      </div>
    `).join('');
  }

  // ── Fotos ──
  ['sc', 'lj'].forEach(p => {
    const grid = document.getElementById('admin-' + p + '-photos');
    if (!state.photos[p].length) {
      grid.innerHTML = '<div class="empty-state">Sin fotos.</div>';
    } else {
      grid.innerHTML = state.photos[p].map(ph => `
        <div class="photo-admin-item">
          <img src="${ph.src}" alt="">
          <button class="del-photo" onclick="deletePhoto('${p}', ${ph.id})">✕</button>
        </div>
      `).join('');
    }
  });
}


// ════════════════════════════════════════════════════════
// LIGHTBOX
// ════════════════════════════════════════════════════════

/**
 * Abre el lightbox con la imagen indicada.
 * @param {string} src - URL o base64 de la imagen
 */
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('active');
}

/** Cierra el lightbox. */
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}


// ════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════

/**
 * Escapa caracteres HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Muestra una notificación tipo toast en la esquina inferior derecha.
 * @param {string} msg
 */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}


// ════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ════════════════════════════════════════════════════════
renderAll();
