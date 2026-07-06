const API_BASE_URL = 'http://localhost:5001/api';

const eventTitle = document.getElementById('eventTitle');
const eventSubtitle = document.getElementById('eventSubtitle');
const eventInfoBox = document.getElementById('eventInfoBox');
const eventRegistrationCount = document.getElementById('eventRegistrationCount');
const eventPresentCount = document.getElementById('eventPresentCount');
const viewParticipantsPageLink = document.getElementById('viewParticipantsPageLink');
const assignTasksPageLink = document.getElementById('assignTasksPageLink');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser') || 'null');
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId');
let currentEvent = null;

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
  if (!adminToken || !currentAdmin || !['superadmin', 'clubadmin', 'coordinator'].includes(currentAdmin.role)) {
    eventTitle.textContent = 'Access Restricted';
    eventSubtitle.textContent = 'Only admins and coordinators can view event operations.';
    renderAccessState(eventInfoBox, {
      icon: '🔒',
      title: 'Admin Access Required',
      message: 'Login with an admin or coordinator account to view this event page.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Admin Dashboard', href: 'admin.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  if (!eventId) {
    eventTitle.textContent = 'Event Not Selected';
    eventSubtitle.textContent = 'No event ID was provided.';
    renderAccessState(eventInfoBox, {
      icon: '📅',
      title: 'No Event Selected',
      message: 'Open this page from an event list to view details.',
      actions: [
        { label: 'Back to Dashboard', href: 'admin.html' }
      ]
    });
    return false;
  }

  return true;
}

async function loadEventDetails() {
  if (!checkAccess()) return;

  try {
    const eventData = await apiRequest(`/events/manage/details/${eventId}`);
    currentEvent = eventData.event;

    eventTitle.textContent = currentEvent.title;
    eventSubtitle.textContent = `${currentEvent.club ? currentEvent.club.name : 'Club'} • ${formatDisplayDate(currentEvent.date)} • ${currentEvent.venue}`;

    eventInfoBox.innerHTML = `
      <p><strong>Club:</strong> ${currentEvent.club ? currentEvent.club.name : 'Club'}</p>
      <p><strong>Event Type:</strong> ${currentEvent.eventType}</p>
      <p><strong>Description:</strong> ${currentEvent.description}</p>
      <p><strong>Rules:</strong> ${currentEvent.rules || 'No rules added'}</p>
      <p><strong>Date:</strong> ${formatDisplayDate(currentEvent.date)}</p>
      <p><strong>Time:</strong> ${currentEvent.startTime} - ${currentEvent.endTime}</p>
      <p><strong>Venue:</strong> ${currentEvent.venue}</p>
      <p><strong>Registration Type:</strong> ${formatRegistrationType(currentEvent.registrationType)}</p>
      <p><strong>Team Size:</strong> ${currentEvent.minTeamSize} - ${currentEvent.maxTeamSize}</p>
      <p><strong>Payment:</strong> ${currentEvent.isPaid ? `₹${currentEvent.fee} | UPI: ${currentEvent.upiId || 'Not added'}` : 'Free Event'}</p>
      <p><strong>Approval Status:</strong> ${currentEvent.approvalStatus}</p>
      <p><strong>Published:</strong> ${currentEvent.published ? 'Yes' : 'No'}</p>
      <p><strong>Contact:</strong> ${currentEvent.contactEmail || 'No email'} | ${currentEvent.contactPhone || 'No phone'}</p>
    `;

    viewParticipantsPageLink.href = `event-participants.html?eventId=${eventId}`;
    assignTasksPageLink.href = `event-assignments.html?eventId=${eventId}`;

    if (currentAdmin.role === 'superadmin') {
      assignTasksPageLink.classList.add('hidden');
    }

    await loadParticipantSummary();
  } catch (error) {
    eventTitle.textContent = 'Error';
    eventSubtitle.textContent = error.message;
  }
}

async function loadParticipantSummary() {
  try {
    const data = await apiRequest(`/registrations/event/${eventId}`);
    const registrations = data.registrations;

    eventRegistrationCount.textContent = registrations.length;

    const presentCount = registrations.filter(function (registration) {
      return registration.attendance.present === true;
    }).length;

    eventPresentCount.textContent = presentCount;
  } catch (error) {
    eventRegistrationCount.textContent = '0';
    eventPresentCount.textContent = '0';
  }
}

function formatRegistrationType(type) {
  if (type === 'individual') return 'Individual';
  if (type === 'team') return 'Team';
  return 'Individual / Team';
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

loadEventDetails();
