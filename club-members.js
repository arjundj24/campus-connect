const API_BASE_URL = 'http://localhost:5001/api';

const addMemberForm = document.getElementById('addMemberForm');
const memberEmail = document.getElementById('memberEmail');
const memberRole = document.getElementById('memberRole');
const memberSearch = document.getElementById('memberSearch');
const memberRoleFilter = document.getElementById('memberRoleFilter');
const memberList = document.getElementById('memberList');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser') || 'null');
let members = [];

addMemberForm.addEventListener('submit', addMember);
memberSearch.addEventListener('input', renderMembers);
memberRoleFilter.addEventListener('change', renderMembers);

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
  if (!adminToken || !currentAdmin || !['clubadmin', 'coordinator'].includes(currentAdmin.role)) {
    renderAccessState(memberList, {
      icon: '🔒',
      title: 'Club Access Required',
      message: 'Only Club Admins and Coordinators can view club members.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Admin Dashboard', href: 'admin.html', className: 'secondary-btn btn-like' }
      ]
    });
    addMemberForm.classList.add('hidden');
    return false;
  }

  if (currentAdmin.role !== 'clubadmin') {
    addMemberForm.classList.add('hidden');
  }

  return true;
}

async function loadMembers() {
  if (!checkAccess()) return;

  try {
    const data = await apiRequest('/members/my-club');
    members = data.members;
    renderMembers();
  } catch (error) {
    memberList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

async function addMember(event) {
  event.preventDefault();
  const submitButton = event.submitter;

  try {
    setButtonLoading(submitButton, true, 'Adding...');
    await apiRequest('/members', {
      method: 'POST',
      body: JSON.stringify({
        email: memberEmail.value.trim(),
        clubRole: memberRole.value
      })
    });

    addMemberForm.reset();
    await loadMembers();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

function renderMembers() {
  if (!checkAccess()) return;

  const searchTerm = memberSearch.value.trim().toLowerCase();
  const selectedRole = memberRoleFilter.value;

  let filteredMembers = members;

  if (selectedRole !== 'all') {
    filteredMembers = filteredMembers.filter(function (member) {
      return member.clubRole === selectedRole;
    });
  }

  if (searchTerm !== '') {
    filteredMembers = filteredMembers.filter(function (member) {
      return (
        member.name.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm) ||
        member.department.toLowerCase().includes(searchTerm) ||
        member.year.toLowerCase().includes(searchTerm) ||
        member.clubRole.toLowerCase().includes(searchTerm)
      );
    });
  }

  if (filteredMembers.length === 0) {
    memberList.innerHTML = '<p class="loading-message small-loading">No members found.</p>';
    return;
  }

  memberList.innerHTML = filteredMembers.map(function (member) {
    return `
      <div class="portal-user-card users-page-card">
        <div>
          <h4>${member.name}</h4>
          <p>${member.email}</p>
          <p><strong>Year:</strong> ${member.year || 'Not added'} | <strong>Department:</strong> ${member.department || 'Not added'}</p>
          <p><strong>Roll:</strong> ${member.rollNumber || 'Not added'} | <strong>Role:</strong> ${formatRole(member.clubRole)}</p>
        </div>
        <div class="user-card-actions">
          <span class="${member.isActive ? 'payment-verified-badge' : 'payment-rejected-badge'}">${member.isActive ? 'Active' : 'Inactive'}</span>
          ${currentAdmin.role === 'clubadmin' ? renderMemberActions(member) : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderMemberActions(member) {
  return `
    <select id="role-${member._id}">
      <option value="member" ${member.clubRole === 'member' ? 'selected' : ''}>Member</option>
      <option value="volunteer" ${member.clubRole === 'volunteer' ? 'selected' : ''}>Volunteer</option>
      <option value="coordinator" ${member.clubRole === 'coordinator' ? 'selected' : ''}>Coordinator</option>
      <option value="treasurer" ${member.clubRole === 'treasurer' ? 'selected' : ''}>Treasurer</option>
      <option value="secretary" ${member.clubRole === 'secretary' ? 'selected' : ''}>Secretary</option>
      <option value="president" ${member.clubRole === 'president' ? 'selected' : ''}>President</option>
      <option value="club_admin" ${member.clubRole === 'club_admin' ? 'selected' : ''}>Club Admin</option>
    </select>
    <button class="manage-action-btn" onclick="updateMemberRole('${member._id}', this)">Update Role</button>
  `;
}

async function updateMemberRole(memberId, button) {
  const role = document.getElementById(`role-${memberId}`).value;

  try {
    setButtonLoading(button, true, 'Updating...');

    await apiRequest(`/members/${memberId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ clubRole: role })
    });

    await loadMembers();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function formatRole(role) {
  return String(role).replace('_', ' ').toUpperCase();
}

loadMembers();
