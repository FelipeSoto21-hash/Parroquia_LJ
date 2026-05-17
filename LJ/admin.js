/* ════════════════════════════════════════════════════════
   admin.js — Panel de administración EXCLUSIVO de Parroquia Nuestra Señora de Luján
   parish_id fijo = 'lj'. No puede modificar la otra parroquia.
════════════════════════════════════════════════════════ */

const SUPABASE_URL  = 'https://ojosqscdzjehutitdfoz.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_laJxknrjuvEn4FvHN0wIJg_hROPOPdx';
const PARISH_ID     = 'lj';   // ← fijo, inmutable

// Credenciales exclusivas de esta parroquia
const ADMIN_USER = 'admin_lj';
const ADMIN_PASS = 'parroquia_lj_2024';

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

// ════════════════════════════════════════════════════════
// LOGIN / LOGOUT
// ════════════════════════════════════════════════════════
function doLogin(event) {
  if (event) event.preventDefault();
  const user  = document.getElementById('login-user').value.trim();
  const pass  = document.getElementById('login-pass').value.trim();
  const errEl = document.getElementById('login-error');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    document.getElementById('a-login-view').style.display = 'none';
    document.getElementById('a-panel-view').style.display = 'block';
    errEl.style.display = 'none';
    document.getElementById('a-header-right').innerHTML = `
      <span class="a-header-user">👤 ${esc(user)}</span>
      <a href="index.html" class="a-btn-logout">← Ver Sitio</a>
      <button class="a-btn-logout" onclick="doLogout()" style="margin-left:6px;">Salir</button>
    `;
    loadAllData();
  } else {
    errEl.textContent   = 'Credenciales incorrectas.';
    errEl.style.display = 'block';
    document.getElementById('login-pass').value = '';
  }
}

function doLogout() {
  document.getElementById('a-login-view').style.display = 'flex';
  document.getElementById('a-panel-view').style.display = 'none';
  document.getElementById('a-header-right').innerHTML   = '';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

// ════════════════════════════════════════════════════════
// CARGA DE DATOS (solo de esta parroquia)
// ════════════════════════════════════════════════════════
async function loadAllData() {
  showLoading(true);
  try {
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

    // Rellenar textarea de descripción
    const descEl = document.getElementById('tm-description');
    if (descEl) descEl.value = state.about_us;

    renderAll();
  } catch (err) {
    console.error(err);
    showToast('⚠️ Error al conectar con Supabase.');
  } finally {
    showLoading(false);
  }
}

// ════════════════════════════════════════════════════════
// PESTAÑAS
// ════════════════════════════════════════════════════════
const TAB_ORDER = ['notices','events','schedule','photos','team'];
function switchTab(tab) {
  document.querySelectorAll('.a-tab').forEach((el,i) => el.classList.toggle('active', TAB_ORDER[i]===tab));
  document.querySelectorAll('.a-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
}

// ════════════════════════════════════════════════════════
// AVISOS
// ════════════════════════════════════════════════════════
async function addNotice() {
  const title   = document.getElementById('n-title').value.trim();
  const content = document.getElementById('n-content').value.trim();
  if (!title) { showToast('El título es obligatorio.'); return; }

  showLoading(true);
  const { data, error } = await db.from('notices')
    .insert([{ parish_id: PARISH_ID, title, content }]).select().single();
  showLoading(false);
  if (error) { showToast('⚠️ Error al guardar: ' + error.message); return; }

  state.notices.unshift(data);
  document.getElementById('n-title').value   = '';
  document.getElementById('n-content').value = '';
  renderAll();
  showToast('Aviso publicado ✓');
}

async function deleteNotice(id) {
  if (!confirm('¿Eliminar este aviso?')) return;
  const { error } = await db.from('notices').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar.'); return; }
  state.notices = state.notices.filter(n => n.id !== id);
  renderAll(); showToast('Aviso eliminado.');
}

// ════════════════════════════════════════════════════════
// EVENTOS
// ════════════════════════════════════════════════════════
async function addEvent() {
  const title       = document.getElementById('e-title').value.trim();
  const event_date  = document.getElementById('e-date').value;
  const description = document.getElementById('e-desc').value.trim();
  if (!title || !event_date) { showToast('Título y fecha son obligatorios.'); return; }

  showLoading(true);
  const { data, error } = await db.from('events')
    .insert([{ parish_id: PARISH_ID, title, event_date, description }]).select().single();
  showLoading(false);
  if (error) { showToast('⚠️ Error al guardar.'); return; }

  state.events.push(data);
  state.events.sort((a,b) => a.event_date.localeCompare(b.event_date));
  document.getElementById('e-title').value = '';
  document.getElementById('e-date').value  = '';
  document.getElementById('e-desc').value  = '';
  renderAll(); showToast('Evento guardado ✓');
}

async function deleteEvent(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  const { error } = await db.from('events').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar.'); return; }
  state.events = state.events.filter(e => e.id !== id);
  renderAll(); showToast('Evento eliminado.');
}

// ════════════════════════════════════════════════════════
// HORARIOS
// ════════════════════════════════════════════════════════
async function addSchedule() {
  const day  = document.getElementById('s-day').value.trim();
  const time = document.getElementById('s-time').value.trim();
  if (!day || !time) { showToast('Día y hora son obligatorios.'); return; }

  showLoading(true);
  const { data, error } = await db.from('schedules')
    .insert([{ parish_id: PARISH_ID, day, time }]).select().single();
  showLoading(false);
  if (error) { showToast('⚠️ Error al guardar.'); return; }

  state.schedules.push(data);
  document.getElementById('s-day').value  = '';
  document.getElementById('s-time').value = '';
  renderAll(); showToast('Horario guardado ✓');
}

async function deleteSchedule(id) {
  if (!confirm('¿Eliminar este horario?')) return;
  const { error } = await db.from('schedules').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar.'); return; }
  state.schedules = state.schedules.filter(s => s.id !== id);
  renderAll(); showToast('Horario eliminado.');
}

// ════════════════════════════════════════════════════════
// FOTOS
// ════════════════════════════════════════════════════════
function handlePhotoFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('p-base64').value = ev.target.result;
    document.getElementById('p-url').value    = '';
    document.getElementById('p-preview').src  = ev.target.result;
    document.getElementById('p-preview-wrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function addPhoto() {
  const description = document.getElementById('p-desc').value.trim();
  const urlField    = document.getElementById('p-url').value.trim();
  const base64Field = document.getElementById('p-base64').value;
  const url = urlField || base64Field;
  if (!url) { showToast('Agrega una URL o sube una imagen.'); return; }

  showLoading(true);
  const { data, error } = await db.from('photos')
    .insert([{ parish_id: PARISH_ID, url, description }]).select().single();
  showLoading(false);
  if (error) { showToast('⚠️ Error al guardar.'); return; }

  state.photos.push(data);
  document.getElementById('p-url').value    = '';
  document.getElementById('p-desc').value   = '';
  document.getElementById('p-base64').value = '';
  document.getElementById('p-preview-wrap').style.display = 'none';
  document.getElementById('p-file').value   = '';
  renderAll(); showToast('Foto guardada ✓');
}

async function deletePhoto(id) {
  if (!confirm('¿Eliminar esta foto?')) return;
  const { error } = await db.from('photos').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar.'); return; }
  state.photos = state.photos.filter(p => p.id !== id);
  renderAll(); showToast('Foto eliminada.');
}

// ════════════════════════════════════════════════════════
// QUIÉNES SOMOS
// ════════════════════════════════════════════════════════
async function saveAbout() {
  const about_us = document.getElementById('tm-description').value.trim();
  showLoading(true);
  const { error } = await db.from('parishes')
    .update({ about_us, updated_at: new Date().toISOString() })
    .eq('id', PARISH_ID);
  showLoading(false);
  if (error) { showToast('⚠️ Error al guardar.'); return; }
  state.about_us = about_us;
  showToast('Descripción guardada ✓');
}

function previewTeamPhoto(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('tm-photo-data').value    = ev.target.result;
    document.getElementById('tm-photo-label').textContent = '✅ ' + file.name;
  };
  reader.readAsDataURL(file);
}

async function addTeamMember() {
  const name      = document.getElementById('tm-name').value.trim();
  const role      = document.getElementById('tm-role').value.trim();
  const phone     = document.getElementById('tm-phone').value.trim();
  const email     = document.getElementById('tm-email').value.trim();
  const instagram = document.getElementById('tm-instagram').value.trim();
  const facebook  = document.getElementById('tm-facebook').value.trim();
  const photo_url = document.getElementById('tm-photo-data').value;
  if (!name || !role) { showToast('Nombre y cargo son obligatorios.'); return; }

  showLoading(true);
  const { data, error } = await db.from('team_members')
    .insert([{ parish_id: PARISH_ID, name, role, phone, email, instagram, facebook, photo_url }])
    .select().single();
  showLoading(false);
  if (error) { showToast('⚠️ Error al guardar.'); return; }

  state.team.push(data);
  ['tm-name','tm-role','tm-phone','tm-email','tm-instagram','tm-facebook','tm-photo-data']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('tm-photo-label').textContent = '📷 Subir foto';
  document.getElementById('tm-photo-file').value = '';
  renderAll(); showToast('Persona agregada ✓');
}

async function deleteTeamMember(id) {
  if (!confirm('¿Eliminar esta persona del equipo?')) return;
  const { error } = await db.from('team_members').delete().eq('id', id);
  if (error) { showToast('⚠️ Error al eliminar.'); return; }
  state.team = state.team.filter(m => m.id !== id);
  renderAll(); showToast('Persona eliminada.');
}

// ════════════════════════════════════════════════════════
// RENDERIZADO DE LISTAS (admin)
// ════════════════════════════════════════════════════════
function renderAll() {
  // Avisos
  const nl = document.getElementById('list-notices');
  if (nl) nl.innerHTML = state.notices.length
    ? state.notices.map(n => {
        const date = new Date(n.created_at).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
        return `<div class="a-list-item"><div class="a-list-item-body"><strong>${esc(n.title)}</strong><span>${esc(n.content||'Sin contenido')} · ${date}</span></div><button class="a-btn-del" onclick="deleteNotice('${n.id}')">✕</button></div>`;
      }).join('')
    : '<div class="a-empty">No hay avisos publicados.</div>';

  // Eventos
  const el = document.getElementById('list-events');
  if (el) el.innerHTML = state.events.length
    ? state.events.map(ev => `<div class="a-list-item"><div class="a-list-item-body"><strong>${esc(ev.title)}</strong><span>${ev.event_date}${ev.description?' · '+esc(ev.description):''}</span></div><button class="a-btn-del" onclick="deleteEvent('${ev.id}')">✕</button></div>`).join('')
    : '<div class="a-empty">No hay eventos.</div>';

  // Horarios
  const sl = document.getElementById('list-schedule');
  if (sl) sl.innerHTML = state.schedules.length
    ? state.schedules.map(s => `<div class="a-list-item"><div class="a-list-item-body"><strong>${esc(s.day)}</strong><span>${esc(s.time)}</span></div><button class="a-btn-del" onclick="deleteSchedule('${s.id}')">✕</button></div>`).join('')
    : '<div class="a-empty">No hay horarios.</div>';

  // Fotos
  const pl = document.getElementById('list-photos');
  if (pl) pl.innerHTML = state.photos.length
    ? state.photos.map(ph => `<div class="a-photo-item"><img src="${ph.url}" alt="${esc(ph.description||'')}"><button class="a-photo-del" onclick="deletePhoto('${ph.id}')">✕</button></div>`).join('')
    : '<div class="a-empty">Sin fotos.</div>';

  // Equipo
  const tl = document.getElementById('list-team');
  if (tl) tl.innerHTML = state.team.length
    ? state.team.map(m => `<div class="a-member-item">${m.photo_url?`<img src="${m.photo_url}" class="a-member-avatar" alt="${esc(m.name)}">`:'<div class="a-member-avatar-placeholder">👤</div>'}<div class="a-member-info"><strong>${esc(m.name)}</strong><span>${esc(m.role)}${m.phone?' · 📞 '+esc(m.phone):''}${m.email?' · ✉️ '+esc(m.email):''}</span></div><button class="a-btn-del" onclick="deleteTeamMember('${m.id}')">✕</button></div>`).join('')
    : '<div class="a-empty">No hay personas registradas.</div>';
}

// ════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════
function esc(s) { if(!s)return''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function showToast(msg) { const t=document.getElementById('a-toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); }
function showLoading(v) { document.getElementById('admin-loading').style.display=v?'flex':'none'; }