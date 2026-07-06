const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';
const publicClubTitle = document.getElementById('publicClubTitle');
const publicClubDescription = document.getElementById('publicClubDescription');
const publicClubInfoBox = document.getElementById('publicClubInfoBox');
const publicClubEventsList = document.getElementById('publicClubEventsList');

const params = new URLSearchParams(window.location.search);
const clubId = params.get('clubId');

async function loadPublicClub() {
  if (!clubId) {
    publicClubTitle.textContent = 'Club Not Selected';
    publicClubDescription.textContent = 'No club ID was provided.';
    return;
  }

  try {
    const clubResponse = await fetch(`${API_BASE_URL}/clubs/${clubId}`);
    const clubData = await clubResponse.json();

    if (!clubResponse.ok) {
      throw new Error(clubData.message || 'Failed to load club.');
    }

    const eventsResponse = await fetch(`${API_BASE_URL}/events/public`);
    const eventsData = await eventsResponse.json();

    if (!eventsResponse.ok) {
      throw new Error(eventsData.message || 'Failed to load events.');
    }

    const club = clubData.club;
    const events = eventsData.events.filter(function (event) {
      return event.club && event.club._id === club._id;
    });

    publicClubTitle.textContent = club.name;
    publicClubDescription.textContent = club.description;

    publicClubInfoBox.innerHTML = `
      <p><strong>Faculty Coordinator:</strong> ${club.facultyCoordinator || 'Not added'}</p>
      <p><strong>Student Coordinator:</strong> ${club.studentCoordinator || 'Not added'}</p>
      <p><strong>Email:</strong> ${club.email || 'Not added'}</p>
      <p><strong>Phone:</strong> ${club.phone || 'Not added'}</p>
      <p><strong>Instagram:</strong> ${club.instagramUrl || 'Not added'}</p>
      <p><strong>WhatsApp:</strong> ${club.whatsappLink || 'Not added'}</p>
    `;

    renderEvents(events);
  } catch (error) {
    publicClubTitle.textContent = 'Error';
    publicClubDescription.textContent = error.message;
  }
}

function renderEvents(events) {
  if (!events || events.length === 0) {
    publicClubEventsList.innerHTML = '<p class="loading-message small-loading">No published events from this club right now.</p>';
    return;
  }

  publicClubEventsList.innerHTML = events.map(function (event) {
    return `
      <a href="index.html#events" class="club-event-detail-card">
        <div>
          <h3>${event.title}</h3>
          <p>${formatDisplayDate(event.date)} • ${event.startTime} - ${event.endTime} • ${event.venue}</p>
          <p>${event.eventType} • ${formatRegistrationType(event.registrationType)} • ${event.isPaid ? `₹${event.fee}` : 'Free'}</p>
        </div>
        <span class="payment-verified-badge">Published</span>
      </a>
    `;
  }).join('');
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

loadPublicClub();
