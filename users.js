const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';
const usersSearch = document.getElementById('usersSearch');
const usersRoleFilter = document.getElementById('usersRoleFilter');
const usersPageList = document.getElementById('usersPageList');
const totalUsersCount = document.getElementById('totalUsersCount');
const studentsCount = document.getElementById('studentsCount');
const adminsCount = document.getElementById('adminsCount');
const inactiveUsersCount = document.getElementById('inactiveUsersCount');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser')) || null;
let portalUsers = [];

usersSearch.addEventListener('input', renderUsers);
usersRoleFilter.addEventListener('change', renderUsers);

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
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

function checkAccess() {
  if (!adminToken || !currentAdmin || currentAdmin.role !== 'superadmin') {
    renderAccessState(usersPageList, {
      icon: '🔒',
      title: 'Super Admin Access Required',
      message: 'Only the Super Admin can view and manage Campus Connect portal users.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Back to Dashboard', href: 'admin.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  return true;
}

async function loadUsers() {
  if (!checkAccess()) {
    return;
  }

  try {
    const data = await apiRequest('/auth/users');
    portalUsers = data.users;
    updateUserStats();
    renderUsers();
  } catch (error) {
    usersPageList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function updateUserStats() {
  const students = portalUsers.filter(function (user) {
    return user.role === 'student';
  });

  const admins = portalUsers.filter(function (user) {
    return user.role !== 'student';
  });

  const inactive = portalUsers.filter(function (user) {
    return user.isActive === false;
  });

  totalUsersCount.textContent = portalUsers.length;
  studentsCount.textContent = students.length;
  adminsCount.textContent = admins.length;
  inactiveUsersCount.textContent = inactive.length;
}

function renderUsers() {
  if (!checkAccess()) {
    return;
  }

  const searchTerm = usersSearch.value.trim().toLowerCase();
  const selectedRole = usersRoleFilter.value;

  let filteredUsers = portalUsers;

  if (selectedRole !== 'all') {
    filteredUsers = filteredUsers.filter(function (user) {
      return user.role === selectedRole;
    });
  }

  if (searchTerm !== '') {
    filteredUsers = filteredUsers.filter(function (user) {
      const clubName = user.club ? user.club.name : '';
      const phone = user.phone || '';
      const department = user.department || '';
      const rollNumber = user.rollNumber || '';

      return (
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm) ||
        clubName.toLowerCase().includes(searchTerm) ||
        phone.toLowerCase().includes(searchTerm) ||
        department.toLowerCase().includes(searchTerm) ||
        rollNumber.toLowerCase().includes(searchTerm)
      );
    });
  }

  if (filteredUsers.length === 0) {
    usersPageList.innerHTML = '<p class="loading-message small-loading">No matching users found.</p>';
    return;
  }

  usersPageList.innerHTML = filteredUsers.map(function (user) {
    const clubName = user.club ? user.club.name : 'No club';
    const statusText = user.isActive ? 'Active' : 'Inactive';
    const statusClass = user.isActive ? 'payment-verified-badge' : 'payment-rejected-badge';
    const actionText = user.isActive ? 'Deactivate' : 'Activate';
    const nextStatus = user.isActive ? 'false' : 'true';

    return `
      <div class="portal-user-card users-page-card">
        <div>
          <h4>${user.name}</h4>
          <p>${user.email}</p>
          <p><strong>Role:</strong> ${formatRole(user.role)} | <strong>Club:</strong> ${clubName}</p>
          ${user.role === 'student' ? renderStudentDetails(user) : ''}
        </div>

        <div class="user-card-actions">
          <span class="${statusClass}">${statusText}</span>
          ${user.role !== 'superadmin' ? `<button class="manage-action-btn" onclick="toggleUserStatus('${user._id}', ${nextStatus})">${actionText}</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderStudentDetails(user) {
  return `
    <p><strong>Phone:</strong> ${user.phone || 'Not added'} | <strong>Department:</strong> ${user.department || 'Not added'}</p>
    <p><strong>Year:</strong> ${user.year || 'Not added'} | <strong>Roll:</strong> ${user.rollNumber || 'Not added'}</p>
    <p><strong>College:</strong> ${user.college || 'Not added'}</p>
  `;
}

async function toggleUserStatus(userId, isActive) {
  try {
    await apiRequest(`/auth/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: isActive })
    });

    await loadUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function formatRole(role) {
  if (role === 'superadmin') return 'Super Admin';
  if (role === 'clubadmin') return 'Club Admin';
  if (role === 'coordinator') return 'Coordinator';
  return 'Student';
}

loadUsers();
