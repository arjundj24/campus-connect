const API_BASE_URL = 'http://localhost:5001/api';

const myEventTitle = document.getElementById('myEventTitle');
const myEventSubtitle = document.getElementById('myEventSubtitle');
const myEventInfoBox = document.getElementById('myEventInfoBox');
const myAssignmentsList = document.getElementById('myAssignmentsList');

let token = localStorage.getItem('campusConnectStudentToken') || '';
let user = JSON.parse(localStorage.getItem('campusConnectStudentUser') || 'null');
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId');

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

async function loadMyEventDetails() {
  if (!token || !user) {
    myEventTitle.textContent = 'Login Required';
    myEventSubtitle.textContent = 'Please login to view event details.';
    renderAccessState(myEventInfoBox, {
      icon: '🔒',
      title: 'Login Required',
      message: 'Login to view club event details and assigned tasks.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' }
      ]
    });
    return;
  }

  if (!eventId) {
    myEventTitle.textContent = 'Event Not Selected';
    myEventSubtitle.textContent = 'No event ID was provided.';
    renderAccessState(myEventInfoBox, {
      icon: '📅',
      title: 'No Event Selected',
      message: 'Open this page from My Club Details to view a specific event.',
      actions: [
        { label: 'Go to My Clubs', href: 'my-clubs.html' }
      ]
    });
    return;
  }

  try {
    const assignmentData = await apiRequest(`/assignments/my/event/${eventId}`);
    const event = assignmentData.event;
    const assignments = assignmentData.assignments;

    myEventTitle.textContent = event.title;
    myEventSubtitle.textContent = `${event.club.name} • ${formatDisplayDate(event.date)} • ${event.venue}`;

    myEventInfoBox.innerHTML = `
      <p><strong>Club:</strong> ${event.club.name}</p>
      <p><strong>Event Type:</strong> ${event.eventType}</p>
      <p><strong>Description:</strong> ${event.description}</p>
      <p><strong>Rules:</strong> ${event.rules || 'No rules added'}</p>
      <p><strong>Date:</strong> ${formatDisplayDate(event.date)}</p>
      <p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
      <p><strong>Venue:</strong> ${event.venue}</p>
      <p><strong>Status:</strong> ${event.published ? 'Published' : 'Approved, Not Published'}</p>
    `;

    renderAssignments(assignments);
  } catch (error) {
    myEventTitle.textContent = 'Error';
    myEventSubtitle.textContent = error.message;
  }
}

function renderAssignments(assignments) {
  if (!assignments || assignments.length === 0) {
    myAssignmentsList.innerHTML = '<p class="loading-message small-loading">No tasks assigned to you for this event yet.</p>';
    return;
  }

  myAssignmentsList.innerHTML = assignments.map(function (assignment) {
    return `
      <div class="registration-manage-card">
        <div class="registration-manage-header">
          <div>
            <h4>${assignment.eventRole}</h4>
            <p><strong>Task:</strong> ${assignment.taskTitle}</p>
            <p>${assignment.taskDescription || ''}</p>
            <p><strong>Assigned by:</strong> ${assignment.assignedBy ? assignment.assignedBy.name : 'Club Admin'}</p>
          </div>
          <span class="payment-pending-badge">${formatStatus(assignment.status)}</span>
        </div>
      </div>
    `;
  }).join('');
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

loadMyEventDetails();
