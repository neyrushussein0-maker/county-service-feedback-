// ============================================================
//  County Service Feedback Portal — script.js
// ============================================================

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
let isLoggedIn = false;

// ============ PAGE NAVIGATION ============
function showPage(id) {
  // Block admin dashboard if not logged in
  if (id === 'admin-dashboard' && !isLoggedIn) {
    id = 'admin-login';
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));

  document.getElementById(id).classList.add('active');

  // Highlight correct nav button
  const navBtn = document.getElementById('nav-' + id) || document.getElementById('nav-admin-login');
  if (navBtn) navBtn.classList.add('active');

  // Load data for each page
  window.scrollTo(0, 0);
  if (id === 'home')            updateHomeStats();
  if (id === 'reports')         renderReports();
  if (id === 'admin-dashboard') loadDashboard();
}

// ============ ADMIN LOGIN ============
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();
  const err  = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    isLoggedIn = true;

    // Swap nav button text to show logged-in state
    document.getElementById('nav-admin-login').textContent = '🛡️ Dashboard';

    // Clear inputs
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    err.classList.remove('show');

    showPage('admin-dashboard');
  } else {
    err.classList.remove('show');
    void err.offsetWidth; // restart animation
    err.classList.add('show');
  }
}

// ============ ADMIN LOGOUT ============
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    isLoggedIn = false;
    document.getElementById('nav-admin-login').textContent = '🔐 Admin';
    showPage('home');
  }
}

// ============ ADMIN SUB-NAV ============
function showAdminSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-subnav button').forEach(b => b.classList.remove('active'));

  document.getElementById('asec-' + id).classList.add('active');
  document.getElementById('asub-' + id).classList.add('active');

  if (id === 'analytics') renderAnalytics();
}

// ============ STAR RATING ============
const ratingLabels = { '1':'Very Poor ⚠️', '2':'Poor 😕', '3':'Average 😐', '4':'Good 😊', '5':'Excellent ⭐' };

document.querySelectorAll('.star-rating input').forEach(radio => {
  radio.addEventListener('change', () => {
    document.getElementById('rating-text').textContent = ratingLabels[radio.value] || 'Click to rate';
  });
});

// ============ SUBMIT FEEDBACK ============
function submitFeedback(e) {
  e.preventDefault();

  const rating = document.querySelector('input[name="rating"]:checked');
  if (!rating) { alert('Please rate your experience using the stars.'); return; }

  const entry = {
    id:       Date.now(),
    name:     document.getElementById('f-name').value.trim(),
    email:    document.getElementById('f-email').value.trim(),
    service:  document.getElementById('f-service').value,
    rating:   parseInt(rating.value),
    message:  document.getElementById('f-message').value.trim(),
    location: document.getElementById('f-location').value.trim(),
    date:     new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
    time:     new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  };

  const data = getFeedback();
  data.unshift(entry);
  localStorage.setItem('county_feedback', JSON.stringify(data));

  document.getElementById('feedbackForm').reset();
  document.getElementById('rating-text').textContent = 'Click to rate';

  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ============ GET FEEDBACK ============
function getFeedback() {
  try { return JSON.parse(localStorage.getItem('county_feedback')) || []; }
  catch { return []; }
}

// ============ RENDER PUBLIC REPORTS ============
function renderReports() {
  const list = document.getElementById('feedbackList');
  let data = getFeedback();

  const svc = document.getElementById('filterService').value;
  const rat = document.getElementById('filterRating').value;
  if (svc) data = data.filter(d => d.service === svc);
  if (rat) data = data.filter(d => d.rating === parseInt(rat));

  updateReportStats(getFeedback());

  if (data.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="e-icon">📭</div><h3>No Feedback Found</h3><p>No submissions match your filter, or none submitted yet.</p></div>`;
    return;
  }

  list.innerHTML = data.map(d => `
    <div class="feedback-item">
      <div class="fi-header">
        <div class="fi-name">
          👤 ${esc(d.name)}
          ${d.location ? `<span style="color:#aaa;font-weight:400;font-size:0.82rem;"> · ${esc(d.location)}</span>` : ''}
        </div>
        <span class="fi-service">${esc(d.service)}</span>
      </div>
      <div class="fi-stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</div>
      <p class="fi-message">"${esc(d.message)}"</p>
      <div class="fi-footer">
        <span class="fi-email">${d.email ? esc(d.email) : 'Anonymous'}</span>
        <span>🕐 ${d.date} at ${d.time}</span>
      </div>
    </div>
  `).join('');
}

function updateReportStats(data) {
  document.getElementById('r-total').textContent = data.length;
  document.getElementById('r-high').textContent  = data.filter(d => d.rating === 5).length;
  document.getElementById('r-low').textContent   = data.filter(d => d.rating <= 2).length;
  if (data.length) {
    document.getElementById('r-avg').textContent = (data.reduce((s,d) => s + d.rating, 0) / data.length).toFixed(1) + '★';
  } else {
    document.getElementById('r-avg').textContent = '—';
  }
}

function updateHomeStats() {
  const data = getFeedback();
  document.getElementById('stat-total').textContent = data.length;
  if (data.length) {
    document.getElementById('stat-avg').textContent = (data.reduce((s,d) => s + d.rating, 0) / data.length).toFixed(1) + '★';
  }
}

function clearAll() {
  if (confirm('Delete all feedback? This cannot be undone.')) {
    localStorage.removeItem('county_feedback');
    renderReports();
  }
}

// ============ ADMIN DASHBOARD LOAD ============
function loadDashboard() {
  const data = getFeedback();
  const total = data.length;
  const avg   = total ? (data.reduce((s,d) => s + d.rating, 0) / total).toFixed(1) : '—';

  document.getElementById('ov-total').textContent = total;
  document.getElementById('ov-avg').textContent   = total ? avg + '★' : '—';
  document.getElementById('ov-five').textContent  = data.filter(d => d.rating === 5).length;
  document.getElementById('ov-low').textContent   = data.filter(d => d.rating <= 2).length;
  document.getElementById('set-total').textContent = total;
  document.getElementById('set-storage').textContent = (new Blob([JSON.stringify(data)]).size / 1024).toFixed(1) + ' KB';

  // Recent table
  const rBody = document.getElementById('recentTable');
  const recent = data.slice(0, 5);
  rBody.innerHTML = recent.length === 0
    ? '<tr><td colspan="4" class="table-empty">No feedback yet.</td></tr>'
    : recent.map(d => `
        <tr>
          <td><strong>${esc(d.name)}</strong></td>
          <td><span class="pill pill-green">${esc(d.service)}</span></td>
          <td style="color:var(--gold);">${'★'.repeat(d.rating)}${'☆'.repeat(5-d.rating)}</td>
          <td style="color:#aaa;">${d.date}</td>
        </tr>
      `).join('');

  renderAllTable(data);
}

// ============ ALL FEEDBACK TABLE ============
function renderAllTable(data) {
  const tbody = document.getElementById('allTable');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No feedback submitted yet.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((d, i) => `
    <tr>
      <td style="color:#aaa;">${i + 1}</td>
      <td>
        <strong>${esc(d.name)}</strong><br>
        <span style="color:#aaa;font-size:0.76rem;">${d.email ? esc(d.email) : 'Anonymous'}</span>
      </td>
      <td style="font-size:0.82rem;">${esc(d.service)}</td>
      <td>
        <span class="pill ${d.rating >= 4 ? 'pill-green' : d.rating === 3 ? 'pill-gold' : 'pill-red'}">
          ${'★'.repeat(d.rating)} ${d.rating}/5
        </span>
      </td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.82rem;color:var(--mid);" title="${esc(d.message)}">${esc(d.message)}</td>
      <td style="color:#aaa;font-size:0.82rem;">${d.location || '—'}</td>
      <td style="color:#aaa;font-size:0.82rem;white-space:nowrap;">${d.date}</td>
      <td><button class="del-btn" onclick="deleteEntry(${d.id})">🗑</button></td>
    </tr>
  `).join('');
}

function searchTable(q) {
  const data = getFeedback().filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    d.service.toLowerCase().includes(q.toLowerCase()) ||
    d.message.toLowerCase().includes(q.toLowerCase())
  );
  renderAllTable(data);
}

function deleteEntry(id) {
  if (!confirm('Delete this feedback entry?')) return;
  localStorage.setItem('county_feedback', JSON.stringify(getFeedback().filter(d => d.id !== id)));
  loadDashboard();
}

// ============ ANALYTICS ============
function renderAnalytics() {
  const data = getFeedback();

  // Service bar chart
  const services = {};
  data.forEach(d => { services[d.service] = (services[d.service] || 0) + 1; });
  const maxSvc = Math.max(...Object.values(services), 1);
  const sChart = document.getElementById('serviceChart');
  sChart.innerHTML = Object.keys(services).length === 0
    ? '<p class="no-data">No data yet.</p>'
    : Object.entries(services).sort((a,b) => b[1]-a[1]).map(([name, count]) => `
        <div class="bar-row">
          <div class="bar-label" title="${esc(name)}">${esc(name)}</div>
          <div class="bar-wrap"><div class="bar-fill" style="width:${(count/maxSvc*100).toFixed(0)}%"></div></div>
          <div class="bar-num">${count}</div>
        </div>
      `).join('');

  // Rating chart
  const ratings = {5:0, 4:0, 3:0, 2:0, 1:0};
  data.forEach(d => ratings[d.rating]++);
  const maxR = Math.max(...Object.values(ratings), 1);
  const rChart = document.getElementById('ratingChart');
  rChart.innerHTML = data.length === 0
    ? '<p class="no-data">No data yet.</p>'
    : [5,4,3,2,1].map(r => `
        <div class="r-row">
          <div class="r-label">${r}★</div>
          <div class="r-wrap"><div class="r-fill" style="width:${(ratings[r]/maxR*100).toFixed(0)}%"></div></div>
          <div class="r-num">${ratings[r]}</div>
        </div>
      `).join('');

  // Summary stats
  const total = data.length;
  const avg   = total ? (data.reduce((s,d) => s + d.rating, 0) / total).toFixed(2) : null;
  document.getElementById('summaryStats').innerHTML = !total
    ? '<span class="no-data">No data available yet.</span>'
    : `<div style="line-height:2;font-size:0.9rem;color:var(--mid);">
        <div>Total Submissions: <strong style="color:var(--dark);">${total}</strong></div>
        <div>Average Rating: <strong style="color:var(--dark);">${avg} ★</strong></div>
        <div>5★ Reviews: <strong style="color:var(--dark);">${ratings[5]} (${((ratings[5]/total)*100).toFixed(0)}%)</strong></div>
        <div>Low Ratings (1–2★): <strong style="color:var(--dark);">${ratings[1]+ratings[2]}</strong></div>
        <div>Services Covered: <strong style="color:var(--dark);">${Object.keys(services).length}</strong></div>
      </div>`;

  // Top service
  const top = Object.entries(services).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('topService').innerHTML = top
    ? `<div style="font-size:3.5rem;">🏅</div>
       <div style="font-size:1rem;font-weight:600;color:var(--dark);margin-top:0.75rem;">${esc(top[0])}</div>
       <div style="font-size:0.82rem;color:var(--mid);margin-top:0.25rem;">${top[1]} submission${top[1]!==1?'s':''}</div>`
    : `<div style="font-size:3.5rem;">🏅</div><div class="no-data" style="margin-top:0.5rem;">No data yet</div>`;
}

// ============ EXPORT CSV ============
function exportCSV() {
  const data = getFeedback();
  if (!data.length) { alert('No data to export.'); return; }

  const headers = ['Name','Email','Service','Rating','Message','Location','Date','Time'];
  const rows = data.map(d => [
    `"${d.name}"`, `"${d.email||''}"`, `"${d.service}"`,
    d.rating, `"${d.message.replace(/"/g,'""')}"`,
    `"${d.location||''}"`, `"${d.date}"`, `"${d.time}"`
  ].join(','));

  const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type:'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'county_feedback.csv' });
  a.click();
  URL.revokeObjectURL(a.href);
}

// ============ ADMIN CLEAR ============
function adminClear() {
  if (confirm('⚠️ Delete ALL feedback permanently? This cannot be undone.')) {
    localStorage.removeItem('county_feedback');
    loadDashboard();
  }
}

// ============ XSS PROTECTION ============
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============ INIT ============
updateHomeStats();