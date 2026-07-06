const API_BASE_URL = 'http://localhost:5001/api';

const myClubTitle = document.getElementById('myClubTitle');
const myClubDescription = document.getElementById('myClubDescription');
const myMembershipBox = document.getElementById('myMembershipBox');
const myClubInfoBox = document.getElementById('myClubInfoBox');
const myClubEventsList = document.getElementById('myClubEventsList');

let token = localStorage.getItem('campusConnectStudentToken') || '';
let user = JSON.parse(localStorage.getItem('campusConnectStudentUser') || 'null');
const params = new URLSearchParams(window.location.search);
const clubId = params.get('clubId');

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

async function loadMyClubDetails() {
  if (!token || !user) {
    myClubTitle.textContent = 'Login Required';
    myClubDescription.textContent = 'Please login to view your club details.';
    renderAccessState(myMembershipBox, {
      icon: '🔒',
      title: 'Login Required',
      message: 'Login to view your club membership and club events.',
      actions: [
        { label: 'Go to Public Login', href: 'index.html' }
      ]
    });
    return;
  }

  if (!clubId) {
    myClubTitle.textContent = 'Club Not Selected';
    myClubDescription.textContent = 'No club ID was provided.';
    renderAccessState(myMembershipBox, {
      icon: '🏛️',
      title: 'No Club Selected',
      message: 'Open this page from My Clubs to view a specific membership.',
      actions: [
        { label: 'Go to My Clubs', href: 'my-clubs.html' }
      ]
    });
    return;
  }

  try {
    const data = await apiRequest(`/events/member/club/${clubId}`);
    const club = data.membership.club;
    const membership = data.membership;
    const events = data.events;

    myClubTitle.textContent = club.name;
    myClubDescription.textContent = club.description;

    myMembershipBox.innerHTML = `
      <p><strong>Your Role:</strong> ${formatRole(membership.clubRole)}</p>
      <p><strong>Name:</strong> ${membership.name}</p>
      <p><strong>Email:</strong> ${membership.email}</p>
      <p><strong>Year:</strong> ${membership.year || 'Not added'}</p>
      <p><strong>Department:</strong> ${membership.department || 'Not added'}</p>
      <p><strong>Roll Number:</strong> ${membership.rollNumber || 'Not added'}</p>
    `;

    myClubInfoBox.innerHTML = `
      <p><strong>Faculty Coordinator:</strong> ${club.facultyCoordinator || 'Not added'}</p>
      <p><strong>Student Coordinator:</strong> ${club.studentCoordinator || 'Not added'}</p>
      <p><strong>Email:</strong> ${club.email || 'Not added'}</p>
      <p><strong>Phone:</strong> ${club.phone || 'Not added'}</p>
      <p><strong>Instagram:</strong> ${club.instagramUrl || 'Not added'}</p>
      <p><strong>WhatsApp:</strong> ${club.whatsappLink || 'Not added'}</p>
    `;

    renderEvents(events);
  } catch (error) {
    myClubTitle.textContent = 'Error';
    myClubDescription.textContent = error.message;
  }
}

function renderEvents(events) {
  if (!events || events.length === 0) {
    myClubEventsList.innerHTML = '<p class="loading-message small-loading">No approved or published events found for this club.</p>';
    return;
  }

  myClubEventsList.innerHTML = events.map(function (event) {
    return `
      <a href="my-event-details.html?eventId=${event._id}" class="club-event-detail-card">
        <div>
          <h3>${event.title}</h3>
          <p>${formatDisplayDate(event.date)} • ${event.startTime} - ${event.endTime} • ${event.venue}</p>
          <p>${event.eventType} • ${event.published ? 'Published' : 'Approved, Not Published'}</p>
        </div>
        <span class="${event.published ? 'payment-verified-badge' : 'payment-free-badge'}">${event.published ? 'Published' : 'Approved'}</span>
      </a>
    `;
  }).join('');
}

function formatRole(role) {
  return String(role).replace('_', ' ').toUpperCase();
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

loadMyClubDetails();
