const API_BASE_URL = 'http://localhost:5001/api';

const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
const eventSearch = document.getElementById('eventSearch');
const clubFilter = document.getElementById('clubFilter');
const eventGrid = document.getElementById('eventGrid');
const clubGrid = document.getElementById('clubGrid');
const homeClubCount = document.getElementById('homeClubCount');
const homeEventCount = document.getElementById('homeEventCount');

const studentDashboard = document.getElementById('studentDashboard');
const studentDashboardNav = document.getElementById('studentDashboardNav');
const myClubsNav = document.getElementById('myClubsNav');
const adminDashboardNav = document.getElementById('adminDashboardNav');
const notificationBadge = document.getElementById('notificationBadge');
const studentProfileForm = document.getElementById('studentProfileForm');
const profileSuccess = document.getElementById('profileSuccess');
const editProfileBtn = document.getElementById('editProfileBtn');
const cancelProfileEditBtn = document.getElementById('cancelProfileEditBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const profileCollege = document.getElementById('profileCollege');
const profileDepartment = document.getElementById('profileDepartment');
const profileYear = document.getElementById('profileYear');
const profileRoll = document.getElementById('profileRoll');
const myRegistrationsList = document.getElementById('myRegistrationsList');
const myCertificatesList = document.getElementById('myCertificatesList');

const studentAuthBtn = document.getElementById('studentAuthBtn');
const studentUserPill = document.getElementById('studentUserPill');
const studentUserName = document.getElementById('studentUserName');
const studentLogoutBtn = document.getElementById('studentLogoutBtn');
const studentAuthModal = document.getElementById('studentAuthModal');
const closeStudentAuthModal = document.getElementById('closeStudentAuthModal');
const studentAuthMessage = document.getElementById('studentAuthMessage');
const studentSignupForm = document.getElementById('studentSignupForm');
const studentLoginForm = document.getElementById('studentLoginForm');
const studentSignupName = document.getElementById('studentSignupName');
const studentSignupEmail = document.getElementById('studentSignupEmail');
const studentSignupPassword = document.getElementById('studentSignupPassword');
const studentLoginEmail = document.getElementById('studentLoginEmail');
const studentLoginPassword = document.getElementById('studentLoginPassword');

const eventModal = document.getElementById('eventModal');
const closeEventModal = document.getElementById('closeEventModal');
const modalEventTitle = document.getElementById('modalEventTitle');
const modalClubName = document.getElementById('modalClubName');
const modalEventDescription = document.getElementById('modalEventDescription');
const modalEventDate = document.getElementById('modalEventDate');
const modalEventVenue = document.getElementById('modalEventVenue');
const modalEventType = document.getElementById('modalEventType');
const modalEventFee = document.getElementById('modalEventFee');
const modalUpiId = document.getElementById('modalUpiId');
const modalRegisterBtn = document.getElementById('modalRegisterBtn');

const registrationModal = document.getElementById('registrationModal');
const closeRegistrationModal = document.getElementById('closeRegistrationModal');
const registrationEventName = document.getElementById('registrationEventName');
const registrationForm = document.getElementById('registrationForm');
const registrationType = document.getElementById('registrationType');
const teamFields = document.getElementById('teamFields');
const paymentFields = document.getElementById('paymentFields');
const paymentNote = document.getElementById('paymentNote');
const registrationSuccess = document.getElementById('registrationSuccess');

const teamName = document.getElementById('teamName');
const teamMembers = document.getElementById('teamMembers');
const transactionId = document.getElementById('transactionId');
const paymentScreenshot = document.getElementById('paymentScreenshot');

const participantName = document.getElementById('participantName');
const participantEmail = document.getElementById('participantEmail');
const participantPhone = document.getElementById('participantPhone');
const participantCollege = document.getElementById('participantCollege');
const participantDepartment = document.getElementById('participantDepartment');
const participantYear = document.getElementById('participantYear');
const participantRoll = document.getElementById('participantRoll');

let allEvents = [];
let allClubs = [];
let selectedEvent = null;
let studentToken = localStorage.getItem('campusConnectStudentToken') || '';
let currentStudent = JSON.parse(localStorage.getItem('campusConnectStudentUser')) || null;
let myRegistrations = [];

menuBtn.addEventListener('click', function () {
  navLinks.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(function (link) {
  link.addEventListener('click', function () {
    navLinks.classList.remove('active');
  });
});

eventSearch.addEventListener('input', filterEvents);
clubFilter.addEventListener('change', filterEvents);
registrationType.addEventListener('change', updateTeamFields);
studentAuthBtn.addEventListener('click', openStudentAuthModal);
studentLogoutBtn.addEventListener('click', logoutStudent);
closeStudentAuthModal.addEventListener('click', closeStudentAuthModalBox);
studentSignupForm.addEventListener('submit', handleStudentSignup);
studentLoginForm.addEventListener('submit', handleStudentLogin);
studentProfileForm.addEventListener('submit', updateStudentProfile);
editProfileBtn.addEventListener('click', function () {
  setProfileEditMode(true);
});
cancelProfileEditBtn.addEventListener('click', function () {
  fillProfileForm();
  setProfileEditMode(false);
});

closeEventModal.addEventListener('click', function () {
  eventModal.classList.add('hidden');
});

closeRegistrationModal.addEventListener('click', function () {
  registrationModal.classList.add('hidden');
});

modalRegisterBtn.addEventListener('click', function () {
  eventModal.classList.add('hidden');

  if (selectedEvent) {
    openRegistration(selectedEvent);
  }
});

window.addEventListener('click', function (event) {
  if (event.target === eventModal) {
    eventModal.classList.add('hidden');
  }

  if (event.target === registrationModal) {
    registrationModal.classList.add('hidden');
  }

  if (event.target === studentAuthModal) {
    studentAuthModal.classList.add('hidden');
  }
});

function openStudentAuthModal() {
  studentAuthMessage.textContent = '';
  studentAuthMessage.className = 'auth-message';
  studentAuthModal.classList.remove('hidden');
}

function closeStudentAuthModalBox() {
  studentAuthModal.classList.add('hidden');
}

function showStudentAuthMessage(message, type) {
  studentAuthMessage.textContent = message;
  studentAuthMessage.className = `auth-message ${type}`;
}

function saveStudentAuth(data) {
  studentToken = data.token;
  currentStudent = data.user;
  localStorage.setItem('campusConnectStudentToken', studentToken);
  localStorage.setItem('campusConnectStudentUser', JSON.stringify(currentStudent));
  updateStudentAuthUI();
  fillProfileForm();
  loadMyRegistrations();
  loadNotificationCount();
}

function clearStudentAuth() {
  const previousRole = currentStudent ? currentStudent.role : '';
  studentToken = '';
  currentStudent = null;
  myRegistrations = [];
  localStorage.removeItem('campusConnectStudentToken');
  localStorage.removeItem('campusConnectStudentUser');

  if (previousRole === 'superadmin' || previousRole === 'clubadmin' || previousRole === 'coordinator') {
    localStorage.removeItem('campusConnectAdminToken');
    localStorage.removeItem('campusConnectAdminUser');
  }

  updateStudentAuthUI();
  loadNotificationCount();
}

function updateStudentAuthUI() {
  if (studentToken && currentStudent) {
    studentAuthBtn.classList.add('hidden');
    studentUserPill.classList.remove('hidden');
    studentDashboard.classList.remove('hidden');
    studentDashboardNav.classList.remove('hidden');
    myClubsNav.classList.remove('hidden');
    studentUserName.textContent = currentStudent.name;

    if (currentStudent.role === 'superadmin' || currentStudent.role === 'clubadmin' || currentStudent.role === 'coordinator') {
      adminDashboardNav.classList.remove('hidden');
    } else {
      adminDashboardNav.classList.add('hidden');
    }
  } else {
    studentAuthBtn.classList.remove('hidden');
    studentUserPill.classList.add('hidden');
    studentDashboard.classList.add('hidden');
    studentDashboardNav.classList.add('hidden');
    myClubsNav.classList.add('hidden');
    adminDashboardNav.classList.add('hidden');
    studentUserName.textContent = '';
  }
}

async function loadNotificationCount() {
  if (!studentToken || !notificationBadge) {
    if (notificationBadge) notificationBadge.classList.add('hidden');
    return;
  }

  try {
    const data = await authFetch('/notifications/my');

    if (data.unreadCount > 0) {
      notificationBadge.textContent = data.unreadCount;
      notificationBadge.classList.remove('hidden');
    } else {
      notificationBadge.classList.add('hidden');
    }
  } catch (error) {
    notificationBadge.classList.add('hidden');
  }
}

async function authFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (studentToken) {
    headers.Authorization = `Bearer ${studentToken}`;
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

async function studentAuthRequest(endpoint, body) {
  return authFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

async function handleStudentSignup(event) {
  event.preventDefault();
  const submitButton = event.submitter;
  setButtonLoading(submitButton, true, 'Creating account...');

  try {
    const data = await studentAuthRequest('/auth/signup', {
      name: studentSignupName.value.trim(),
      email: studentSignupEmail.value.trim(),
      password: studentSignupPassword.value
    });

    saveStudentAuth(data);
    studentSignupForm.reset();
    studentAuthModal.classList.add('hidden');
  } catch (error) {
    showStudentAuthMessage(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

async function handleStudentLogin(event) {
  event.preventDefault();
  const submitButton = event.submitter;
  setButtonLoading(submitButton, true, 'Logging in...');

  try {
    const data = await studentAuthRequest('/auth/login', {
      email: studentLoginEmail.value.trim(),
      password: studentLoginPassword.value
    });

    if (data.user.role === 'superadmin' || data.user.role === 'clubadmin' || data.user.role === 'coordinator') {
      localStorage.setItem('campusConnectAdminToken', data.token);
      localStorage.setItem('campusConnectAdminUser', JSON.stringify(data.user));
    }

    saveStudentAuth(data);
    studentLoginForm.reset();
    studentAuthModal.classList.add('hidden');
  } catch (error) {
    showStudentAuthMessage(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

function logoutStudent() {
  clearStudentAuth();
}

function fillProfileForm() {
  if (!currentStudent) return;

  profileName.value = currentStudent.name || '';
  profileEmail.value = currentStudent.email || '';
  profilePhone.value = currentStudent.phone || '';
  profileCollege.value = currentStudent.college || '';
  profileDepartment.value = currentStudent.department || '';
  profileYear.value = currentStudent.year || '';
  profileRoll.value = currentStudent.rollNumber || '';
  setProfileEditMode(false);
}

function setProfileEditMode(isEditing) {
  const editableFields = [
    profileName,
    profilePhone,
    profileCollege,
    profileDepartment,
    profileYear,
    profileRoll
  ];

  editableFields.forEach(function (field) {
    field.disabled = !isEditing;
  });

  if (isEditing) {
    editProfileBtn.classList.add('hidden');
    cancelProfileEditBtn.classList.remove('hidden');
    saveProfileBtn.classList.remove('hidden');
  } else {
    editProfileBtn.classList.remove('hidden');
    cancelProfileEditBtn.classList.add('hidden');
    saveProfileBtn.classList.add('hidden');
  }
}

async function updateStudentProfile(event) {
  event.preventDefault();
  const submitButton = event.submitter;
  setButtonLoading(submitButton, true, 'Saving...');

  try {
    const data = await authFetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: profileName.value.trim(),
        phone: profilePhone.value.trim(),
        college: profileCollege.value.trim(),
        department: profileDepartment.value.trim(),
        year: profileYear.value,
        rollNumber: profileRoll.value.trim()
      })
    });

    currentStudent = data.user;
    localStorage.setItem('campusConnectStudentUser', JSON.stringify(currentStudent));
    updateStudentAuthUI();
    fillProfileForm();
    profileSuccess.classList.remove('hidden');
    setProfileEditMode(false);

    setTimeout(function () {
      profileSuccess.classList.add('hidden');
    }, 2500);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

async function loadMyRegistrations() {
  if (!studentToken) return;

  try {
    const data = await authFetch('/registrations/my-registrations');
    myRegistrations = data.registrations;
    renderMyRegistrations();
    renderMyCertificates();
  } catch (error) {
    myRegistrationsList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function renderMyRegistrations() {
  if (!myRegistrations || myRegistrations.length === 0) {
    myRegistrationsList.innerHTML = '<p class="loading-message small-loading">You have not registered for any events yet.</p>';
    return;
  }

  myRegistrationsList.innerHTML = myRegistrations.map(function (registration) {
    const event = registration.event;
    return `
      <div class="student-dashboard-item">
        <h4>${event ? event.title : 'Event'}</h4>
        <p>${registration.club ? registration.club.name : 'Club'} • ${event ? formatDisplayDate(event.date) : ''}</p>
        <p><strong>Registration:</strong> ${registration.registrationType} | <strong>Payment:</strong> ${formatStatus(registration.payment.status)}</p>
        <p><strong>Attendance:</strong> ${registration.attendance.present ? 'Present' : 'Not marked'} | <strong>Certificate:</strong> ${formatStatus(registration.certificateStatus)}</p>
      </div>
    `;
  }).join('');
}

function renderMyCertificates() {
  const certificates = myRegistrations.filter(function (registration) {
    return registration.certificateStatus === 'issued';
  });

  if (certificates.length === 0) {
    myCertificatesList.innerHTML = '<p class="loading-message small-loading">No issued certificates yet.</p>';
    return;
  }

  myCertificatesList.innerHTML = certificates.map(function (registration) {
    return `
      <div class="student-dashboard-item certificate-item">
        <h4>${registration.event ? registration.event.title : 'Event Certificate'}</h4>
        <p>${registration.club ? registration.club.name : 'Club'} • ${registration.resultStatus}</p>
        <span class="event-status published">Certificate Issued</span>
      </div>
    `;
  }).join('');
}

async function loadClubs() {
  try {
    const response = await fetch(`${API_BASE_URL}/clubs`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load clubs.');
    }

    allClubs = data.clubs;
    homeClubCount.textContent = allClubs.length;
    renderClubs(allClubs);
  } catch (error) {
    clubGrid.innerHTML = `<p class="loading-message">${error.message}</p>`;
  }
}

function renderClubs(clubs) {
  if (!clubs || clubs.length === 0) {
    clubGrid.innerHTML = '<p class="loading-message">No active clubs found.</p>';
    return;
  }

  clubGrid.innerHTML = clubs.map(function (club) {
    return `
      <a href="public-club.html?clubId=${club._id}" class="club-card clickable-card">
        <div class="club-icon">🏛️</div>
        <h3>${club.name}</h3>
        <p>${club.description}</p>
        <div class="club-meta">
          ${club.facultyCoordinator ? `<span>Faculty: ${club.facultyCoordinator}</span>` : ''}
          ${club.studentCoordinator ? `<span>Student: ${club.studentCoordinator}</span>` : ''}
          ${club.email ? `<span>Email: ${club.email}</span>` : ''}
        </div>
      </a>
    `;
  }).join('');
}

async function loadPublishedEvents() {
  try {
    eventGrid.innerHTML = '<p class="loading-message">Loading published events...</p>';

    const response = await fetch(`${API_BASE_URL}/events/public`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load events.');
    }

    allEvents = data.events;
    homeEventCount.textContent = allEvents.length;
    populateClubFilter(allEvents);
    renderEvents(allEvents);
  } catch (error) {
    eventGrid.innerHTML = `<p class="loading-message">${error.message}</p>`;
  }
}

function populateClubFilter(events) {
  const clubs = [...new Set(events.map(function (event) {
    return event.club.name;
  }))];

  clubFilter.innerHTML = '<option value="all">All Clubs</option>';

  clubs.forEach(function (clubName) {
    clubFilter.innerHTML += `<option value="${clubName.toLowerCase()}">${clubName}</option>`;
  });
}

function renderEvents(events) {
  if (events.length === 0) {
    eventGrid.innerHTML = '<p class="loading-message">No published events found.</p>';
    return;
  }

  eventGrid.innerHTML = events.map(function (event) {
    return `
      <article class="event-card">
        <div class="event-status published">Published</div>
        <h3>${event.title}</h3>
        <p class="club-name">${event.club.name}</p>
        <p>${event.description}</p>
        <div class="event-meta">
          <span>📍 ${event.venue}</span>
          <span>📅 ${formatDisplayDate(event.date)}</span>
          <span>${getRegistrationIcon(event.registrationType)} ${formatRegistrationType(event.registrationType)}</span>
          <span>${event.isPaid ? `💳 ₹${event.fee}` : '🆓 Free'}</span>
        </div>
        <div class="event-actions">
          <button class="details-btn" onclick="openEventDetails('${event._id}')">View Details</button>
          <button class="register-btn" onclick="openRegistrationById('${event._id}')">Register</button>
        </div>
      </article>
    `;
  }).join('');
}

function filterEvents() {
  const searchTerm = eventSearch.value.trim().toLowerCase();
  const selectedClub = clubFilter.value;
  let filteredEvents = allEvents;

  if (searchTerm !== '') {
    filteredEvents = filteredEvents.filter(function (event) {
      return (
        event.title.toLowerCase().includes(searchTerm) ||
        event.club.name.toLowerCase().includes(searchTerm) ||
        event.eventType.toLowerCase().includes(searchTerm)
      );
    });
  }

  if (selectedClub !== 'all') {
    filteredEvents = filteredEvents.filter(function (event) {
      return event.club.name.toLowerCase() === selectedClub;
    });
  }

  renderEvents(filteredEvents);
}

function openEventDetails(eventId) {
  const event = allEvents.find(function (item) {
    return item._id === eventId;
  });

  if (!event) return showToast('Event not found.', 'error');

  selectedEvent = event;
  modalEventTitle.textContent = event.title;
  modalClubName.textContent = event.club.name;
  modalEventDescription.textContent = event.description;
  modalEventDate.textContent = `${formatDisplayDate(event.date)} | ${event.startTime} - ${event.endTime}`;
  modalEventVenue.textContent = event.venue;
  modalEventType.textContent = formatRegistrationType(event.registrationType);
  modalEventFee.textContent = event.isPaid ? `₹${event.fee}` : 'Free';
  modalUpiId.textContent = event.isPaid ? event.upiId || 'Not provided' : 'Not required';
  eventModal.classList.remove('hidden');
}

function openRegistrationById(eventId) {
  const event = allEvents.find(function (item) {
    return item._id === eventId;
  });

  if (!event) return showToast('Event not found.', 'error');
  openRegistration(event);
}

function openRegistration(event) {
  if (!studentToken || !currentStudent) {
    selectedEvent = event;
    openStudentAuthModal();
    showStudentAuthMessage('Please login with a student account or create one before registering.', 'error');
    return;
  }

  selectedEvent = event;
  registrationEventName.textContent = `${event.title} - ${event.club.name}`;
  registrationSuccess.classList.add('hidden');
  registrationForm.reset();
  participantName.value = currentStudent.name || '';
  participantEmail.value = currentStudent.email || '';
  participantPhone.value = currentStudent.phone || '';
  participantCollege.value = currentStudent.college || '';
  participantDepartment.value = currentStudent.department || '';
  participantYear.value = currentStudent.year || '';
  participantRoll.value = currentStudent.rollNumber || '';
  setupRegistrationTypeOptions();
  updateTeamFields();
  updatePaymentFields();
  registrationModal.classList.remove('hidden');
}

function setupRegistrationTypeOptions() {
  registrationType.innerHTML = '';

  if (selectedEvent.registrationType === 'individual' || selectedEvent.registrationType === 'both') {
    registrationType.innerHTML += '<option value="individual">Individual</option>';
  }

  if (selectedEvent.registrationType === 'team' || selectedEvent.registrationType === 'both') {
    registrationType.innerHTML += '<option value="team">Team</option>';
  }
}

function updateTeamFields() {
  if (registrationType.value === 'team') {
    teamFields.classList.remove('hidden');
    teamName.required = true;
    teamMembers.required = true;
  } else {
    teamFields.classList.add('hidden');
    teamName.required = false;
    teamMembers.required = false;
  }
}

function updatePaymentFields() {
  if (selectedEvent && selectedEvent.isPaid) {
    paymentFields.classList.remove('hidden');
    paymentNote.textContent = `Registration fee: ₹${selectedEvent.fee}. Pay to UPI ID: ${selectedEvent.upiId || 'Not provided'}. Enter payment details for verification.`;
    transactionId.required = true;
    paymentScreenshot.required = true;
  } else {
    paymentFields.classList.add('hidden');
    transactionId.required = false;
    paymentScreenshot.required = false;
  }
}

registrationForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const submitButton = event.submitter;

  if (!selectedEvent || !selectedEvent._id) return showToast('Event not selected properly.', 'error');
  if (!studentToken) return openStudentAuthModal();

  const payload = {
    registrationType: registrationType.value,
    participant: {
      name: participantName.value.trim(),
      email: participantEmail.value.trim(),
      phone: participantPhone.value.trim(),
      college: participantCollege.value.trim(),
      department: participantDepartment.value.trim(),
      year: participantYear.value,
      rollNumber: participantRoll.value.trim()
    }
  };

  if (registrationType.value === 'team') {
    payload.team = {
      teamName: teamName.value.trim(),
      members: parseTeamMembers(teamMembers.value)
    };
  }

  if (selectedEvent.isPaid) {
    payload.transactionId = transactionId.value.trim();
    payload.screenshotUrl = paymentScreenshot.value.trim();
  }

  try {
    setButtonLoading(submitButton, true, 'Submitting...');

    const response = await fetch(`${API_BASE_URL}/registrations/events/${selectedEvent._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Registration failed.');

    registrationSuccess.textContent = '✅ Registration submitted successfully and saved to database.';
    registrationSuccess.classList.remove('hidden');
    registrationForm.reset();
    updateTeamFields();
    updatePaymentFields();
    loadMyRegistrations();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
});

function parseTeamMembers(text) {
  if (!text.trim()) return [];

  return text.split('\n').filter(function (line) {
    return line.trim() !== '';
  }).map(function (line) {
    const parts = line.split(',').map(function (part) {
      return part.trim();
    });

    return {
      name: parts[0] || 'Team Member',
      rollNumber: parts[1] || '',
      department: parts[2] || '',
      year: parts[3] || '',
      email: parts[4] || '',
      phone: parts[5] || ''
    };
  });
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getRegistrationIcon(type) {
  if (type === 'team') return '👥';
  if (type === 'both') return '👤/👥';
  return '👤';
}

function formatRegistrationType(type) {
  if (type === 'individual') return 'Individual';
  if (type === 'team') return 'Team';
  return 'Individual / Team';
}

function formatStatus(status) {
  return String(status || '').replace('_', ' ').toUpperCase();
}

updateStudentAuthUI();
fillProfileForm();
if (studentToken) {
  loadMyRegistrations();
  loadNotificationCount();
}
loadClubs();
loadPublishedEvents();
