const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';

const clubSearch = document.getElementById('clubSearch');
const clubStatusFilter = document.getElementById('clubStatusFilter');
const clubNameList = document.getElementById('clubNameList');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser')) || null;
let clubs = [];
let events = [];

clubSearch.addEventListener('input', renderClubs);
clubStatusFilter.addEventListener('change', renderClubs);

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

function checkAccess() {
  if (!adminToken || !currentAdmin || currentAdmin.role !== 'superadmin') {
    renderAccessState(clubNameList, {
      icon: '🏛️',
      title: 'Super Admin Access Required',
      message: 'Only the Super Admin can view and manage the full college clubs directory.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Back to Dashboard', href: 'admin.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  return true;
}

async function loadClubsPage() {
  if (!checkAccess()) return;

  try {
    const clubsData = await apiRequest('/clubs/admin/all');
    const eventsData = await apiRequest('/events/admin/all');

    clubs = clubsData.clubs;
    events = eventsData.events;

    renderClubs();
  } catch (error) {
    clubNameList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function renderClubs() {
  if (!checkAccess()) return;

  const searchTerm = clubSearch.value.trim().toLowerCase();
  const statusFilter = clubStatusFilter.value;

  let filteredClubs = clubs;

  if (statusFilter === 'active') {
    filteredClubs = filteredClubs.filter(function (club) {
      return club.isActive === true;
    });
  }

  if (statusFilter === 'inactive') {
    filteredClubs = filteredClubs.filter(function (club) {
      return club.isActive === false;
    });
  }

  if (searchTerm !== '') {
    filteredClubs = filteredClubs.filter(function (club) {
      return club.name.toLowerCase().includes(searchTerm);
    });
  }

  if (filteredClubs.length === 0) {
    clubNameList.innerHTML = '<p class="loading-message small-loading">No clubs found.</p>';
    return;
  }

  clubNameList.innerHTML = filteredClubs.map(function (club) {
    const clubEvents = events.filter(function (event) {
      return event.club && event.club._id === club._id;
    });

    const publishedCount = clubEvents.filter(function (event) {
      return event.published === true;
    }).length;

    const statusClass = club.isActive ? 'payment-verified-badge' : 'payment-rejected-badge';
    const statusText = club.isActive ? 'Active' : 'Inactive';

    return `
      <a href="club-details.html?clubId=${club._id}" class="club-name-row">
        <div>
          <h3>${club.name}</h3>
          <p>${clubEvents.length} event(s) • ${publishedCount} published</p>
        </div>
        <span class="${statusClass}">${statusText}</span>
      </a>
    `;
  }).join('');
}

loadClubsPage();
