const API_BASE_URL = 'http://localhost:5001/api';

const myClubsList = document.getElementById('myClubsList');
let token = localStorage.getItem('campusConnectStudentToken') || '';
let user = JSON.parse(localStorage.getItem('campusConnectStudentUser') || 'null');

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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

async function loadMyClubs() {
  if (!token || !user) {
    renderAccessState(myClubsList, {
      icon: '🔒',
      title: 'Login Required',
      message: 'Login to view the clubs where you are a member.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' }
      ]
    });
    return;
  }

  try {
    const data = await apiRequest('/members/my-memberships');
    renderMyClubs(data.memberships);
  } catch (error) {
    myClubsList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function renderMyClubs(memberships) {
  if (!memberships || memberships.length === 0) {
    myClubsList.innerHTML = '<p class="loading-message small-loading">You are not a member of any club yet.</p>';
    return;
  }

  myClubsList.innerHTML = memberships.map(function (membership) {
    return `
      <a href="my-club-details.html?membershipId=${membership._id}&clubId=${membership.club._id}" class="club-name-row">
        <div>
          <h3>${membership.club.name}</h3>
          <p>Your Role: ${formatRole(membership.clubRole)} • ${membership.club.description}</p>
        </div>
        <span class="payment-verified-badge">Member</span>
      </a>
    `;
  }).join('');
}

function formatRole(role) {
  return String(role).replace('_', ' ').toUpperCase();
}

loadMyClubs();
