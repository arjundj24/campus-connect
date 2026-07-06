const API_BASE_URL = 'http://localhost:5001/api';

const participantsEventTitle = document.getElementById('participantsEventTitle');
const participantsEventSubtitle = document.getElementById('participantsEventSubtitle');
const participantsList = document.getElementById('participantsList');
const participantSearch = document.getElementById('participantSearch');
const participantPaymentFilter = document.getElementById('participantPaymentFilter');
const printParticipantsBtn = document.getElementById('printParticipantsBtn');
const exportParticipantsCsvBtn = document.getElementById('exportParticipantsCsvBtn');
const exportParticipantsPdfBtn = document.getElementById('exportParticipantsPdfBtn');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser') || 'null');
const params = new URLSearchParams(window.location.search);
const eventId = params.get('eventId');
let currentEvent = null;
let registrations = [];

participantSearch.addEventListener('input', renderParticipants);
participantPaymentFilter.addEventListener('change', renderParticipants);
printParticipantsBtn.addEventListener('click', function () {
  window.print();
});
exportParticipantsCsvBtn.addEventListener('click', exportParticipantsCSV);
exportParticipantsPdfBtn.addEventListener('click', exportParticipantsPDF);

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
    participantsEventTitle.textContent = 'Access Restricted';
    participantsEventSubtitle.textContent = 'Only admins and coordinators can view participants.';
    renderAccessState(participantsList, {
      icon: '🔒',
      title: 'Admin Access Required',
      message: 'Login with an admin or coordinator account to view participant lists.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Admin Dashboard', href: 'admin.html', className: 'secondary-btn btn-like' }
      ]
    });
    return false;
  }

  if (!eventId) {
    participantsEventTitle.textContent = 'Event Not Selected';
    participantsEventSubtitle.textContent = 'No event ID was provided.';
    renderAccessState(participantsList, {
      icon: '👥',
      title: 'No Event Selected',
      message: 'Open participants from a specific event details page.',
      actions: [
        { label: 'Back to Dashboard', href: 'admin.html' }
      ]
    });
    return false;
  }

  return true;
}

async function loadParticipantsPage() {
  if (!checkAccess()) return;

  try {
    const eventData = await apiRequest(`/events/manage/details/${eventId}`);
    const registrationData = await apiRequest(`/registrations/event/${eventId}`);

    currentEvent = eventData.event;
    registrations = registrationData.registrations;

    participantsEventTitle.textContent = `${currentEvent.title} - Participants`;
    participantsEventSubtitle.textContent = `${currentEvent.club.name} • ${formatDisplayDate(currentEvent.date)} • ${currentEvent.venue}`;

    renderParticipants();
  } catch (error) {
    participantsEventTitle.textContent = 'Error';
    participantsEventSubtitle.textContent = error.message;
  }
}

function getFilteredRegistrations() {
  const searchTerm = participantSearch.value.trim().toLowerCase();
  const paymentFilter = participantPaymentFilter.value;

  let filtered = registrations;

  if (paymentFilter !== 'all') {
    filtered = filtered.filter(function (registration) {
      return registration.payment.status === paymentFilter;
    });
  }

  if (searchTerm !== '') {
    filtered = filtered.filter(function (registration) {
      const participant = registration.participant;
      const teamName = registration.team ? registration.team.teamName : '';

      return (
        participant.name.toLowerCase().includes(searchTerm) ||
        participant.email.toLowerCase().includes(searchTerm) ||
        participant.phone.toLowerCase().includes(searchTerm) ||
        participant.department.toLowerCase().includes(searchTerm) ||
        participant.rollNumber.toLowerCase().includes(searchTerm) ||
        teamName.toLowerCase().includes(searchTerm)
      );
    });
  }

  return filtered;
}

function renderParticipants() {
  const filtered = getFilteredRegistrations();

  if (!filtered || filtered.length === 0) {
    participantsList.innerHTML = '<p class="loading-message small-loading">No participants found.</p>';
    return;
  }

  participantsList.innerHTML = filtered.map(function (registration, index) {
    const participant = registration.participant;
    const teamInfo = registration.registrationType === 'team'
      ? `<p><strong>Team:</strong> ${registration.team.teamName} (${registration.team.members.length + 1} members)</p>`
      : '';

    return `
      <div class="registration-manage-card participant-print-card">
        <div class="registration-manage-header">
          <div>
            <h4>${index + 1}. ${participant.name}</h4>
            <p>${participant.email} • ${participant.phone}</p>
            <p><strong>Department:</strong> ${participant.department} | <strong>Year:</strong> ${participant.year} | <strong>Roll:</strong> ${participant.rollNumber}</p>
            <p><strong>Registration Type:</strong> ${registration.registrationType}</p>
            ${teamInfo}
          </div>
          <span class="${getPaymentBadgeClass(registration.payment.status)}">${formatPaymentStatus(registration.payment.status)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function exportParticipantsCSV() {
  const filtered = getFilteredRegistrations();

  if (filtered.length === 0) {
    showToast('No participants to export.', 'warning');
    return;
  }

  const headers = ['Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Roll Number', 'Registration Type', 'Team Name', 'Payment Status', 'Attendance', 'Result', 'Certificate'];

  const rows = filtered.map(function (registration) {
    return [
      registration.participant.name,
      registration.participant.email,
      registration.participant.phone,
      registration.participant.college,
      registration.participant.department,
      registration.participant.year,
      registration.participant.rollNumber,
      registration.registrationType,
      registration.team ? registration.team.teamName : '',
      registration.payment.status,
      registration.attendance.present ? 'Present' : 'Not Marked',
      registration.resultStatus,
      registration.certificateStatus
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map(function (row) {
      return row.map(function (value) {
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    })
  ].join('\n');

  downloadFile(`${safeFileName(currentEvent.title)}-participants.csv`, csv, 'text/csv;charset=utf-8;');
}

function exportParticipantsPDF() {
  window.print();
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: type });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getPaymentBadgeClass(status) {
  if (status === 'verified') return 'payment-verified-badge';
  if (status === 'rejected') return 'payment-rejected-badge';
  if (status === 'not_required') return 'payment-free-badge';
  return 'payment-pending-badge';
}

function formatPaymentStatus(status) {
  if (status === 'not_required') return 'Free Event';
  return String(status).replace('_', ' ').toUpperCase();
}

function safeFileName(name) {
  return String(name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

loadParticipantsPage();
