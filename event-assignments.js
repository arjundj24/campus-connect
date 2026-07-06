const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';

const assignmentEventTitle = document.getElementById('assignmentEventTitle');
const assignmentEventSubtitle = document.getElementById('assignmentEventSubtitle');
const assignmentForm = document.getElementById('assignmentForm');
const assignmentMember = document.getElementById('assignmentMember');
const assignmentRole = document.getElementById('assignmentRole');
const assignmentTaskTitle = document.getElementById('assignmentTaskTitle');
const assignmentTaskDescription = document.getElementById('assignmentTaskDescription');
const assignmentList = document.getElementById('assignmentList');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser') || 'null');
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId');
let members = [];
let assignments = [];
let currentEvent = null;

assignmentForm.addEventListener('submit', createAssignment);

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
    assignmentEventTitle.textContent = 'Access Restricted';
    assignmentEventSubtitle.textContent = 'Only Club Admins and Coordinators can view event task assignments.';
    assignmentForm.classList.add('hidden');
    renderAccessState(assignmentList, {
      icon: '🔒',
      title: 'Club Access Required',
      message: 'Login as Club Admin or Coordinator to view event assignments.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Admin Dashboard', href: 'admin.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  if (!eventId) {
    assignmentEventTitle.textContent = 'Event Not Selected';
    assignmentEventSubtitle.textContent = 'No event ID was provided.';
    assignmentForm.classList.add('hidden');
    renderAccessState(assignmentList, {
      icon: '📌',
      title: 'No Event Selected',
      message: 'Open this page from an event in the Club Admin dashboard.',
      actions: [
        { label: 'Back to Dashboard', href: 'admin.html' }
      ]
    });
    return false;
  }

  if (currentAdmin.role === 'coordinator') {
    assignmentForm.classList.add('hidden');
  }

  return true;
}

async function loadAssignmentPage() {
  if (!checkAccess()) return;

  try {
    const memberData = await apiRequest('/members/my-club');
    const assignmentData = await apiRequest(`/assignments/event/${eventId}`);

    members = memberData.members.filter(function (member) {
      return member.isActive === true;
    });

    assignments = assignmentData.assignments;
    currentEvent = assignmentData.event;

    assignmentEventTitle.textContent = currentEvent.title;
    assignmentEventSubtitle.textContent = `${currentEvent.club.name} • ${formatDisplayDate(currentEvent.date)} • ${currentEvent.venue}`;

    populateMemberDropdown();
    renderAssignments();
  } catch (error) {
    assignmentList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function populateMemberDropdown() {
  assignmentMember.innerHTML = '<option value="">Select member</option>';

  members.forEach(function (member) {
    assignmentMember.innerHTML += `<option value="${member._id}">${member.name} - ${formatRole(member.clubRole)}</option>`;
  });
}

async function createAssignment(event) {
  event.preventDefault();
  const submitButton = event.submitter;

  try {
    setButtonLoading(submitButton, true, 'Assigning...');
    await apiRequest('/assignments', {
      method: 'POST',
      body: JSON.stringify({
        eventId: eventId,
        memberId: assignmentMember.value,
        eventRole: assignmentRole.value.trim(),
        taskTitle: assignmentTaskTitle.value.trim(),
        taskDescription: assignmentTaskDescription.value.trim()
      })
    });

    assignmentForm.reset();
    await loadAssignmentPage();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

function renderAssignments() {
  if (!assignments || assignments.length === 0) {
    assignmentList.innerHTML = '<p class="loading-message small-loading">No tasks assigned yet.</p>';
    return;
  }

  assignmentList.innerHTML = assignments.map(function (assignment) {
    return `
      <div class="registration-manage-card">
        <div class="registration-manage-header">
          <div>
            <h4>${assignment.member.name}</h4>
            <p>${assignment.member.email}</p>
            <p><strong>Event Role:</strong> ${assignment.eventRole}</p>
            <p><strong>Task:</strong> ${assignment.taskTitle}</p>
            <p>${assignment.taskDescription || ''}</p>
          </div>
          <span class="payment-pending-badge">${formatStatus(assignment.status)}</span>
        </div>
        ${currentAdmin.role === 'clubadmin' ? renderAssignmentActions(assignment) : ''}
      </div>
    `;
  }).join('');
}

function renderAssignmentActions(assignment) {
  return `
    <div class="registration-status-grid">
      <div class="registration-control-group">
        <label>Status</label>
        <select id="assignmentStatus-${assignment._id}">
          <option value="assigned" ${assignment.status === 'assigned' ? 'selected' : ''}>Assigned</option>
          <option value="in_progress" ${assignment.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${assignment.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
        <button class="manage-action-btn" onclick="updateAssignmentStatus('${assignment._id}', this)">Update Status</button>
      </div>
      <div class="registration-control-group">
        <label>Delete</label>
        <button class="manage-action-btn" onclick="deleteAssignment('${assignment._id}', this)">Delete Assignment</button>
      </div>
    </div>
  `;
}

async function updateAssignmentStatus(assignmentId, button) {
  const status = document.getElementById(`assignmentStatus-${assignmentId}`).value;

  try {
    setButtonLoading(button, true, 'Updating...');

    await apiRequest(`/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: status })
    });

    await loadAssignmentPage();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteAssignment(assignmentId, button) {
  const confirmDelete = await showConfirmModal({
    title: 'Delete assignment?',
    message: 'This task assignment will be permanently removed from the event.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  });

  if (!confirmDelete) return;

  try {
    setButtonLoading(button, true, 'Deleting...');

    await apiRequest(`/assignments/${assignmentId}`, {
      method: 'DELETE'
    });

    await loadAssignmentPage();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function formatRole(role) {
  return String(role).replace('_', ' ').toUpperCase();
}

function formatStatus(status) {
  return String(status).replace('_', ' ').toUpperCase();
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

loadAssignmentPage();
