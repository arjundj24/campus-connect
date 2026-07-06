const API_BASE_URL = 'http://localhost:5001/api';

const requestSearch = document.getElementById('requestSearch');
const requestStatusFilter = document.getElementById('requestStatusFilter');
const clubRequestList = document.getElementById('clubRequestList');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser') || 'null');
let clubRequests = [];

requestSearch.addEventListener('input', renderClubRequests);
requestStatusFilter.addEventListener('change', renderClubRequests);

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
    renderAccessState(clubRequestList, {
      icon: '🔒',
      title: 'Super Admin Access Required',
      message: 'Only the Super Admin can review and approve club creation requests.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Back to Clubs', href: 'clubs.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  return true;
}

async function loadClubRequests() {
  if (!checkAccess()) return;

  try {
    const data = await apiRequest('/club-requests/admin/all');
    clubRequests = data.requests;
    renderClubRequests();
  } catch (error) {
    clubRequestList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function renderClubRequests() {
  if (!checkAccess()) return;

  const searchTerm = requestSearch.value.trim().toLowerCase();
  const selectedStatus = requestStatusFilter.value;

  let filteredRequests = clubRequests;

  if (selectedStatus !== 'all') {
    filteredRequests = filteredRequests.filter(function (request) {
      return request.status === selectedStatus;
    });
  }

  if (searchTerm !== '') {
    filteredRequests = filteredRequests.filter(function (request) {
      const studentName = request.student ? request.student.name : '';
      const studentEmail = request.student ? request.student.email : '';
      return (
        request.name.toLowerCase().includes(searchTerm) ||
        studentName.toLowerCase().includes(searchTerm) ||
        studentEmail.toLowerCase().includes(searchTerm)
      );
    });
  }

  if (filteredRequests.length === 0) {
    clubRequestList.innerHTML = '<p class="loading-message small-loading">No club requests found.</p>';
    return;
  }

  clubRequestList.innerHTML = filteredRequests.map(function (request) {
    const studentName = request.student ? request.student.name : 'Student';
    const studentEmail = request.student ? request.student.email : '';
    const actionButtons = request.status === 'submitted'
      ? `
        <button class="approve-btn" onclick="updateClubRequestApproval('${request._id}', 'approved')">Approve Club</button>
        <button class="reject-btn" onclick="updateClubRequestApproval('${request._id}', 'rejected')">Reject</button>
      `
      : '';

    return `
      <div class="registration-manage-card">
        <div class="registration-manage-header">
          <div>
            <h4>${request.name || 'Club details not submitted yet'}</h4>
            <p><strong>Student:</strong> ${studentName} (${studentEmail})</p>
            <p><strong>Status:</strong> ${formatStatus(request.status)}</p>
            <p><strong>Description:</strong> ${request.description || 'Not submitted yet'}</p>
            <p><strong>Faculty Coordinator:</strong> ${request.facultyCoordinator || 'Not added'}</p>
            <p><strong>Student Coordinator:</strong> ${request.studentCoordinator || 'Not added'}</p>
            <p><strong>Email:</strong> ${request.email || 'Not added'} | <strong>Phone:</strong> ${request.phone || 'Not added'}</p>
            ${request.approvalNote ? `<p class="approval-note"><strong>Note:</strong> ${request.approvalNote}</p>` : ''}
          </div>
          <div class="approval-actions">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function updateClubRequestApproval(requestId, status) {
  const approvalNote = status === 'approved'
    ? 'Club approved by Super Admin.'
    : prompt('Enter rejection note:') || 'Club request rejected.';

  try {
    await apiRequest(`/club-requests/${requestId}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: status,
        approvalNote: approvalNote
      })
    });

    await loadClubRequests();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function formatStatus(status) {
  return String(status || '').replace('_', ' ').toUpperCase();
}

loadClubRequests();
