const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';

const clubTitle = document.getElementById('clubTitle');
const clubDescription = document.getElementById('clubDescription');
const clubInfoBox = document.getElementById('clubInfoBox');
const clubEventsList = document.getElementById('clubEventsList');
const clubEventCount = document.getElementById('clubEventCount');
const clubPublishedCount = document.getElementById('clubPublishedCount');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser')) || null;
const params = new URLSearchParams(window.location.search);
const clubId = params.get('clubId');

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
    clubTitle.textContent = 'Access Restricted';
    clubDescription.textContent = 'Only the Super Admin can view full club administration details.';
    renderAccessState(clubInfoBox, {
      icon: '🔒',
      title: 'Super Admin Access Required',
      message: 'Login as Super Admin to view club details and associated events.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' },
        { label: 'Back to Clubs', href: 'clubs.html', className: 'secondary-btn btn-like' }
      ]
    });
    clubEventsList.innerHTML = '';
    return false;
  }

  if (!clubId) {
    clubTitle.textContent = 'Club Not Selected';
    clubDescription.textContent = 'No club ID was provided.';
    renderAccessState(clubInfoBox, {
      icon: '🏛️',
      title: 'No Club Selected',
      message: 'Open this page from the Clubs Directory to view a specific club.',
      actions: [
        { label: 'Go to Clubs Directory', href: 'clubs.html' }
      ]
    });
    return false;
  }

  return true;
}

async function loadClubDetails() {
  if (!checkAccess()) return;

  try {
    const clubData = await apiRequest(`/clubs/admin/${clubId}`);
    const eventsData = await apiRequest(`/events/admin/club/${clubId}`);

    const club = clubData.club;
    const events = eventsData.events;

    clubTitle.textContent = club.name;
    clubDescription.textContent = club.description;

    clubInfoBox.innerHTML = `
      <p><strong>Status:</strong> ${club.isActive ? 'Active' : 'Inactive'}</p>
      <p><strong>Faculty Coordinator:</strong> ${club.facultyCoordinator || 'Not added'}</p>
      <p><strong>Student Coordinator:</strong> ${club.studentCoordinator || 'Not added'}</p>
      <p><strong>Email:</strong> ${club.email || 'Not added'}</p>
      <p><strong>Phone:</strong> ${club.phone || 'Not added'}</p>
      <p><strong>Instagram:</strong> ${club.instagramUrl || 'Not added'}</p>
      <p><strong>WhatsApp:</strong> ${club.whatsappLink || 'Not added'}</p>
    `;

    const publishedCount = events.filter(function (event) {
      return event.published === true;
    }).length;

    clubEventCount.textContent = events.length;
    clubPublishedCount.textContent = publishedCount;

    renderClubEvents(events);
  } catch (error) {
    clubTitle.textContent = 'Error';
    clubDescription.textContent = error.message;
  }
}

function renderClubEvents(events) {
  if (!events || events.length === 0) {
    clubEventsList.innerHTML = '<p class="loading-message small-loading">No events found for this club.</p>';
    return;
  }

  clubEventsList.innerHTML = events.map(function (event) {
    return `
      <a href="event-details-admin.html?eventId=${event._id}" class="club-event-detail-card">
        <div>
          <h3>${event.title}</h3>
          <p>${formatDisplayDate(event.date)} • ${event.startTime} - ${event.endTime} • ${event.venue}</p>
          <p>${event.eventType} • ${formatRegistrationType(event.registrationType)} • ${event.isPaid ? `₹${event.fee}` : 'Free'}</p>
        </div>
        <span class="${getEventBadgeClass(event)}">${getEventStatusText(event)}</span>
      </a>
    `;
  }).join('');
}

function getEventStatusText(event) {
  if (event.published) return 'Published';
  if (event.approvalStatus === 'approved') return 'Approved';
  if (event.approvalStatus === 'rejected') return 'Rejected';
  if (event.approvalStatus === 'changes_requested') return 'Changes Requested';
  return 'Pending';
}

function getEventBadgeClass(event) {
  if (event.published) return 'payment-verified-badge';
  if (event.approvalStatus === 'approved') return 'payment-free-badge';
  if (event.approvalStatus === 'rejected' || event.approvalStatus === 'changes_requested') return 'payment-rejected-badge';
  return 'payment-pending-badge';
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

loadClubDetails();
