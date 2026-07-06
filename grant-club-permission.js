const API_BASE_URL = 'http://localhost:5001/api';

const permissionUserSearch = document.getElementById('permissionUserSearch');
const permissionRoleFilter = document.getElementById('permissionRoleFilter');
const permissionUserList = document.getElementById('permissionUserList');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser') || 'null');
let portalUsers = [];

permissionUserSearch.addEventListener('input', renderPermissionUsers);
permissionRoleFilter.addEventListener('change', renderPermissionUsers);

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
    renderAccessState(permissionUserList, {
      icon: '📝',
      title: 'Super Admin Access Required',
      message: 'Only the Super Admin can grant permission to users for creating a new club.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Back to Clubs', href: 'clubs.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  return true;
}

async function loadUsers() {
  if (!checkAccess()) return;

  try {
    const data = await apiRequest('/auth/users');
    portalUsers = data.users.filter(function (user) {
      return user.role !== 'superadmin';
    });
    renderPermissionUsers();
  } catch (error) {
    permissionUserList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function renderPermissionUsers() {
  if (!checkAccess()) return;

  const searchTerm = permissionUserSearch.value.trim().toLowerCase();
  const roleFilter = permissionRoleFilter.value;

  let filteredUsers = portalUsers;

  if (roleFilter !== 'all') {
    filteredUsers = filteredUsers.filter(function (user) {
      return user.role === roleFilter;
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
    permissionUserList.innerHTML = '<p class="loading-message small-loading">No matching users found.</p>';
    return;
  }

  permissionUserList.innerHTML = filteredUsers.map(function (user) {
    const clubName = user.club ? user.club.name : 'No club';
    const statusText = user.isActive ? 'Active' : 'Inactive';
    const statusClass = user.isActive ? 'payment-verified-badge' : 'payment-rejected-badge';

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
          <button class="manage-action-btn" onclick="grantClubPermission('${user.email}', this)">Grant Permission</button>
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

async function grantClubPermission(studentEmail, button) {
  const message = prompt(
    'Enter a message for the selected user:',
    'You have permission to submit details for creating a new club.'
  );

  if (message === null) {
    return;
  }

  try {
    setButtonLoading(button, true, 'Sending...');

    await apiRequest('/club-requests/assign', {
      method: 'POST',
      body: JSON.stringify({
        studentEmail: studentEmail,
        message: message || 'You have permission to submit details for creating a new club.'
      })
    });

    showToast('Club creation permission sent successfully. The user will see it in notifications.', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function formatRole(role) {
  if (role === 'clubadmin') return 'Club Admin';
  if (role === 'coordinator') return 'Coordinator';
  return 'Student';
}

loadUsers();
