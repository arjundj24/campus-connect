const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';
const adminLoginPanel = document.getElementById('adminLoginPanel');
const adminDashboardContent = document.getElementById('adminDashboardContent');
const adminUserBar = document.getElementById('adminUserBar');
const adminUserName = document.getElementById('adminUserName');
const adminUserRole = document.getElementById('adminUserRole');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const superAdminNavItem = document.getElementById('superAdminNavItem');
const clubAdminNavItem = document.getElementById('clubAdminNavItem');
const adminNotificationBadge = document.getElementById('adminNotificationBadge');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmail = document.getElementById('adminEmail');
const adminPassword = document.getElementById('adminPassword');
const adminAuthMessage = document.getElementById('adminAuthMessage');

const dashboardTabs = document.querySelectorAll('.dashboard-tab');
const superAdminDashboard = document.getElementById('superAdminDashboard');
const clubAdminDashboard = document.getElementById('clubAdminDashboard');
const superStats = document.querySelectorAll('#superAdminDashboard .admin-stat-card h3');
const clubStats = document.querySelectorAll('#clubAdminDashboard .admin-stat-card h3');
const superCalendarGrid = document.getElementById('superCalendarGrid');
const superCalendarMonth = document.getElementById('superCalendarMonth');
const superPrevMonthBtn = document.getElementById('superPrevMonthBtn');
const superNextMonthBtn = document.getElementById('superNextMonthBtn');
const clubCalendarGrid = document.getElementById('clubCalendarGrid');
const clubCalendarMonth = document.getElementById('clubCalendarMonth');
const clubPrevMonthBtn = document.getElementById('clubPrevMonthBtn');
const clubNextMonthBtn = document.getElementById('clubNextMonthBtn');
const approvalList = document.querySelector('#superAdminDashboard .approval-list');
const clubCalendarList = document.querySelector('.club-calendar-list');
const registrationSummaryList = document.querySelector('.registration-summary-list');

const createEventBtn = document.querySelector('.create-event-btn');
const createEventModal = document.getElementById('createEventModal');
const closeCreateEventModal = document.getElementById('closeCreateEventModal');
const createEventForm = document.getElementById('createEventForm');
const createEventSuccess = document.getElementById('createEventSuccess');
const createEventModalTitle = document.getElementById('createEventModalTitle');
const createEventModalSubtitle = document.getElementById('createEventModalSubtitle');
const createEventSubmitBtn = document.getElementById('createEventSubmitBtn');
const eventRegistrationType = document.getElementById('eventRegistrationType');
const teamSizeFields = document.getElementById('teamSizeFields');
const eventPaymentType = document.getElementById('eventPaymentType');
const feeField = document.getElementById('feeField');
const upiField = document.getElementById('upiField');
const eventFee = document.getElementById('eventFee');
const eventUpiId = document.getElementById('eventUpiId');

let adminToken = localStorage.getItem('campusConnectAdminToken') || '';
let currentAdmin = JSON.parse(localStorage.getItem('campusConnectAdminUser')) || null;
let allAdminEvents = [];
let clubEvents = [];
let clubRegistrations = [];
let allClubs = [];
let superCalendarDate = new Date();
let clubCalendarDate = new Date();
let editingEventId = null;

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', handleAdminLogin);
}
adminLogoutBtn.addEventListener('click', logoutAdmin);
createEventBtn.addEventListener('click', function () {
  openCreateEventModal();
});
closeCreateEventModal.addEventListener('click', closeCreateEvent);
eventRegistrationType.addEventListener('change', updateTeamSizeFields);
eventPaymentType.addEventListener('change', updatePaymentCreateFields);
createEventForm.addEventListener('submit', handleCreateEvent);
superPrevMonthBtn.addEventListener('click', function () {
  superCalendarDate.setMonth(superCalendarDate.getMonth() - 1);
  renderCalendarGrid(superCalendarGrid, superCalendarMonth, allAdminEvents, superCalendarDate, true);
});

superNextMonthBtn.addEventListener('click', function () {
  superCalendarDate.setMonth(superCalendarDate.getMonth() + 1);
  renderCalendarGrid(superCalendarGrid, superCalendarMonth, allAdminEvents, superCalendarDate, true);
});

clubPrevMonthBtn.addEventListener('click', function () {
  clubCalendarDate.setMonth(clubCalendarDate.getMonth() - 1);
  renderCalendarGrid(clubCalendarGrid, clubCalendarMonth, clubEvents, clubCalendarDate, false);
});

clubNextMonthBtn.addEventListener('click', function () {
  clubCalendarDate.setMonth(clubCalendarDate.getMonth() + 1);
  renderCalendarGrid(clubCalendarGrid, clubCalendarMonth, clubEvents, clubCalendarDate, false);
});

dashboardTabs.forEach(function (tab) {
  tab.addEventListener('click', function () {
    if (!currentAdmin) {
      return;
    }

    if (tab.dataset.dashboard === 'super' && currentAdmin.role !== 'superadmin') {
      showToast('Only Super Admin can access this dashboard.', 'warning');
      return;
    }

    dashboardTabs.forEach(function (button) {
      button.classList.remove('active');
    });

    tab.classList.add('active');

    if (tab.dataset.dashboard === 'super') {
      superAdminDashboard.classList.remove('hidden');
      clubAdminDashboard.classList.add('hidden');
      loadSuperDashboard();
    } else {
      clubAdminDashboard.classList.remove('hidden');
      superAdminDashboard.classList.add('hidden');
      loadClubDashboard();
    }
  });
});

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
    if (response.status === 401) {
      clearAdminAuth();
      updateAdminUI();
    }

    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

function showAdminMessage(message, type) {
  adminAuthMessage.textContent = message;
  adminAuthMessage.className = `auth-message ${type}`;
}

function clearAdminMessage() {
  adminAuthMessage.textContent = '';
  adminAuthMessage.className = 'auth-message';
}

async function handleAdminLogin(event) {
  event.preventDefault();
  clearAdminMessage();

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: adminEmail.value.trim(),
        password: adminPassword.value
      })
    });

    adminToken = data.token;
    currentAdmin = data.user;

    localStorage.setItem('campusConnectAdminToken', adminToken);
    localStorage.setItem('campusConnectAdminUser', JSON.stringify(currentAdmin));

    adminLoginForm.reset();
    updateAdminUI();
    await loadDashboardForRole();
  } catch (error) {
    showAdminMessage(error.message, 'error');
  }
}

function logoutAdmin() {
  clearAdminAuth();
  updateAdminUI();
}

function clearAdminAuth() {
  adminToken = '';
  currentAdmin = null;
  localStorage.removeItem('campusConnectAdminToken');
  localStorage.removeItem('campusConnectAdminUser');
}

function updateAdminUI() {
  if (adminToken && currentAdmin) {
    adminLoginPanel.classList.add('hidden');
    adminDashboardContent.classList.remove('hidden');
    adminUserBar.classList.remove('hidden');
    adminUserName.textContent = currentAdmin.name;
    adminUserRole.textContent = currentAdmin.role;

    loadAdminNotificationCount();

    if (currentAdmin.role === 'superadmin') {
      adminUserRole.className = 'role-badge super-badge';
      superAdminNavItem.classList.remove('hidden');
      clubAdminNavItem.classList.add('hidden');
      showDashboard('super');
    } else {
      adminUserRole.className = 'role-badge club-badge';
      superAdminNavItem.classList.add('hidden');
      clubAdminNavItem.classList.remove('hidden');
      showDashboard('club');
    }
  } else {
    adminLoginPanel.classList.remove('hidden');
    adminDashboardContent.classList.add('hidden');
    adminUserBar.classList.add('hidden');
    superAdminNavItem.classList.add('hidden');
    clubAdminNavItem.classList.add('hidden');
  }
}

async function loadAdminNotificationCount() {
  if (!adminToken || !adminNotificationBadge) {
    if (adminNotificationBadge) adminNotificationBadge.classList.add('hidden');
    return;
  }

  try {
    const data = await apiRequest('/notifications/my');

    if (data.unreadCount > 0) {
      adminNotificationBadge.textContent = data.unreadCount;
      adminNotificationBadge.classList.remove('hidden');
    } else {
      adminNotificationBadge.classList.add('hidden');
    }
  } catch (error) {
    adminNotificationBadge.classList.add('hidden');
  }
}

function showDashboard(type) {
  dashboardTabs.forEach(function (tab) {
    tab.classList.remove('active');

    if (tab.dataset.dashboard === type) {
      tab.classList.add('active');
    }
  });

  if (type === 'super') {
    superAdminDashboard.classList.remove('hidden');
    clubAdminDashboard.classList.add('hidden');
  } else {
    clubAdminDashboard.classList.remove('hidden');
    superAdminDashboard.classList.add('hidden');
  }
}

async function loadDashboardForRole() {
  if (!currentAdmin) {
    return;
  }

  if (currentAdmin.role === 'superadmin') {
    await loadSuperDashboard();
  } else {
    await loadClubDashboard();
  }
}

async function loadSuperDashboard() {
  try {
    const clubsData = await apiRequest('/clubs/admin/all');
    const eventsData = await apiRequest('/events/admin/all');

    allAdminEvents = eventsData.events;
    allClubs = clubsData.clubs;

    const pendingCount = allAdminEvents.filter(function (event) {
      return event.approvalStatus === 'pending';
    }).length;

    superStats[0].textContent = clubsData.count;
    superStats[1].textContent = eventsData.count;
    superStats[2].textContent = pendingCount;
    superStats[3].textContent = findVenueConflicts(allAdminEvents).length;

    renderCalendarGrid(superCalendarGrid, superCalendarMonth, allAdminEvents, superCalendarDate, true);
    renderPendingApprovals(allAdminEvents);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadClubDashboard() {
  try {
    const eventsData = await apiRequest('/events/club/my-events');
    const registrationsData = await apiRequest('/registrations/my-club');

    clubEvents = eventsData.events;
    clubRegistrations = registrationsData.registrations;

    const pendingCount = clubEvents.filter(function (event) {
      return event.approvalStatus === 'pending';
    }).length;

    const approvedCount = clubEvents.filter(function (event) {
      return event.approvalStatus === 'approved' && !event.published;
    }).length;

    const publishedCount = clubEvents.filter(function (event) {
      return event.published === true;
    }).length;

    clubStats[0].textContent = clubEvents.length;
    clubStats[1].textContent = pendingCount;
    clubStats[2].textContent = approvedCount;
    clubStats[3].textContent = publishedCount;

    renderCalendarGrid(clubCalendarGrid, clubCalendarMonth, clubEvents, clubCalendarDate, false);
    renderClubEvents(clubEvents);
    renderRegistrationSummary(clubRegistrations);

    if (currentAdmin.role === 'coordinator') {
      createEventBtn.classList.add('hidden');
    } else {
      createEventBtn.classList.remove('hidden');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderCalendarGrid(container, titleElement, events, calendarDate, showClubName) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  titleElement.textContent = calendarDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let html = `
    <div class="calendar-day-name">Sun</div>
    <div class="calendar-day-name">Mon</div>
    <div class="calendar-day-name">Tue</div>
    <div class="calendar-day-name">Wed</div>
    <div class="calendar-day-name">Thu</div>
    <div class="calendar-day-name">Fri</div>
    <div class="calendar-day-name">Sat</div>
  `;

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="admin-calendar-cell muted-cell"></div>';
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = getDateKey(new Date(year, month, day));
    const dayEvents = events.filter(function (event) {
      return event.date === dateKey;
    });

    const cellClass = dayEvents.length > 0 ? getEventStatusClass(dayEvents[0]) : '';

    const eventText = dayEvents.slice(0, 2).map(function (event) {
      const clubName = showClubName && event.club ? ` (${event.club.name})` : '';
      return `<span>${event.title}${clubName}</span>`;
    }).join('');

    const moreText = dayEvents.length > 2 ? `<span>+${dayEvents.length - 2} more</span>` : '';

    html += `
      <div class="admin-calendar-cell ${cellClass}">
        ${day}
        ${eventText}
        ${moreText}
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderPendingApprovals(events) {
  const pendingEvents = events.filter(function (event) {
    return event.approvalStatus === 'pending';
  });

  if (pendingEvents.length === 0) {
    approvalList.innerHTML = '<div class="approval-item"><p>No pending approvals.</p></div>';
    return;
  }

  approvalList.innerHTML = pendingEvents.map(function (event) {
    return `
      <div class="approval-item">
        <h4>${event.title}</h4>
        <p>${event.club ? event.club.name : 'Club'} • ${formatDisplayDate(event.date)} • ${event.venue}</p>
        <div class="approval-actions">
          <button class="approve-btn" onclick="updateApproval('${event._id}', 'approved', this)">Approve</button>
          <button class="changes-btn" onclick="updateApproval('${event._id}', 'changes_requested', this)">Request Changes</button>
          <button class="reject-btn" onclick="updateApproval('${event._id}', 'rejected', this)">Reject</button>
        </div>
      </div>
    `;
  }).join('');
}

async function updateApproval(eventId, status, button) {
  const approvalNote = status === 'approved'
    ? 'Approved by Super Admin.'
    : prompt('Enter note for this decision:') || '';

  try {
    setButtonLoading(button, true, 'Updating...');

    await apiRequest(`/events/${eventId}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({
        approvalStatus: status,
        approvalNote: approvalNote
      })
    });

    await loadSuperDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function renderClubEvents(events) {
  if (events.length === 0) {
    clubCalendarList.innerHTML = '<div class="club-calendar-item"><p>No club events found.</p></div>';
    return;
  }

  clubCalendarList.innerHTML = events.map(function (event) {
    const statusLabel = getClubEventStatusText(event);
    const leftClass = getClubEventLeftClass(event);

    let workflowAction = `<span class="status-pill ${event.published ? 'published-pill' : 'pending-pill'}">${statusLabel}</span>`;

    if (event.approvalStatus === 'approved' && !event.published && currentAdmin.role === 'clubadmin') {
      workflowAction = `<button class="publish-btn" onclick="publishEvent('${event._id}', this)">Publish</button>`;
    }

    if ((event.approvalStatus === 'changes_requested' || event.approvalStatus === 'rejected') && currentAdmin.role === 'clubadmin') {
      workflowAction = `<button class="changes-btn" onclick="openEditEventModal('${event._id}')">Edit & Resubmit</button>`;
    }

    const note = event.approvalNote
      ? `<p class="approval-note"><strong>Admin Note:</strong> ${event.approvalNote}</p>`
      : '';

    return `
      <div class="club-calendar-item ${leftClass}">
        <div>
          <h4>${event.title}</h4>
          <p>${event.eventType} • ${formatDisplayDate(event.date)} • ${statusLabel}</p>
          ${note}
        </div>
        <div class="event-admin-actions">
          <a class="report-btn user-page-link" href="event-details-admin.html?eventId=${event._id}">Open Details</a>
          <a class="report-btn user-page-link" href="event-assignments.html?eventId=${event._id}">Assign Tasks</a>
          ${workflowAction}
        </div>
      </div>
    `;
  }).join('');
}

async function publishEvent(eventId, button) {
  try {
    setButtonLoading(button, true, 'Publishing...');
    await apiRequest(`/events/${eventId}/publish`, {
      method: 'PATCH'
    });

    await loadClubDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
}

function openCreateEventModal() {
  editingEventId = null;
  createEventModalTitle.textContent = 'Create New Event';
  createEventModalSubtitle.textContent = 'Club Admin creates an event. Status will be Pending Approval.';
  createEventSubmitBtn.textContent = 'Submit Event for Approval';
  createEventSuccess.classList.add('hidden');
  createEventForm.reset();
  updateTeamSizeFields();
  updatePaymentCreateFields();
  createEventModal.classList.remove('hidden');
}

function openEditEventModal(eventId) {
  const event = clubEvents.find(function (item) {
    return item._id === eventId;
  });

  if (!event) {
    showToast('Event not found.', 'error');
    return;
  }

  editingEventId = eventId;
  createEventModalTitle.textContent = 'Edit Event and Resubmit';
  createEventModalSubtitle.textContent = 'Make the requested changes and resubmit the event for Super Admin approval.';
  createEventSubmitBtn.textContent = 'Update and Resubmit';
  createEventSuccess.classList.add('hidden');

  document.getElementById('eventTitle').value = event.title || '';
  document.getElementById('eventType').value = event.eventType || 'Workshop';
  document.getElementById('eventVenue').value = event.venue || '';
  document.getElementById('eventDate').value = event.date || '';
  document.getElementById('eventStartTime').value = event.startTime || '';
  document.getElementById('eventEndTime').value = event.endTime || '';
  document.getElementById('eventRegistrationType').value = event.registrationType || 'individual';
  document.getElementById('minTeamSize').value = event.minTeamSize || '';
  document.getElementById('maxTeamSize').value = event.maxTeamSize || '';
  document.getElementById('eventPaymentType').value = event.isPaid ? 'paid' : 'free';
  document.getElementById('eventFee').value = event.fee || '';
  document.getElementById('eventUpiId').value = event.upiId || '';
  document.getElementById('eventWhatsapp').value = event.whatsappGroupLink || '';
  document.getElementById('eventContactEmail').value = event.contactEmail || '';
  document.getElementById('eventContactPhone').value = event.contactPhone || '';
  document.getElementById('eventDescription').value = event.description || '';
  document.getElementById('eventRules').value = event.rules || '';

  updateTeamSizeFields();
  updatePaymentCreateFields();
  createEventModal.classList.remove('hidden');
}

function closeCreateEvent() {
  createEventModal.classList.add('hidden');
}

function updateTeamSizeFields() {
  if (eventRegistrationType.value === 'team' || eventRegistrationType.value === 'both') {
    teamSizeFields.classList.remove('hidden');
  } else {
    teamSizeFields.classList.add('hidden');
  }
}

function updatePaymentCreateFields() {
  if (eventPaymentType.value === 'paid') {
    feeField.classList.remove('hidden');
    upiField.classList.remove('hidden');
    eventFee.required = true;
    eventUpiId.required = true;
  } else {
    feeField.classList.add('hidden');
    upiField.classList.add('hidden');
    eventFee.required = false;
    eventUpiId.required = false;
  }
}

async function handleCreateEvent(event) {
  event.preventDefault();
  const submitButton = event.submitter;

  const eventPayload = {
    title: document.getElementById('eventTitle').value.trim(),
    eventType: document.getElementById('eventType').value,
    venue: document.getElementById('eventVenue').value.trim(),
    date: document.getElementById('eventDate').value,
    startTime: document.getElementById('eventStartTime').value,
    endTime: document.getElementById('eventEndTime').value,
    registrationType: document.getElementById('eventRegistrationType').value,
    minTeamSize: Number(document.getElementById('minTeamSize').value) || 1,
    maxTeamSize: Number(document.getElementById('maxTeamSize').value) || 1,
    isPaid: document.getElementById('eventPaymentType').value === 'paid',
    fee: Number(document.getElementById('eventFee').value) || 0,
    upiId: document.getElementById('eventUpiId').value.trim(),
    whatsappGroupLink: document.getElementById('eventWhatsapp').value.trim(),
    contactEmail: document.getElementById('eventContactEmail').value.trim(),
    contactPhone: document.getElementById('eventContactPhone').value.trim(),
    description: document.getElementById('eventDescription').value.trim(),
    rules: document.getElementById('eventRules').value.trim()
  };

  try {
    setButtonLoading(submitButton, true, editingEventId ? 'Updating...' : 'Creating...');

    if (editingEventId) {
      await apiRequest(`/events/${editingEventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventPayload)
      });

      createEventSuccess.textContent = '✅ Event updated and resubmitted for approval.';
    } else {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(eventPayload)
      });

      createEventSuccess.textContent = '✅ Event created successfully as Pending Approval and saved to database.';
    }

    createEventSuccess.classList.remove('hidden');
    createEventForm.reset();
    editingEventId = null;
    createEventModalTitle.textContent = 'Create New Event';
    createEventSubmitBtn.textContent = 'Submit Event for Approval';
    updateTeamSizeFields();
    updatePaymentCreateFields();
    await loadClubDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

function renderRegistrationSummary(registrations) {
  const paymentPending = registrations.filter(function (registration) {
    return registration.payment.status === 'pending';
  }).length;

  const attendanceMarked = registrations.filter(function (registration) {
    return registration.attendance.present === true;
  }).length;

  registrationSummaryList.innerHTML = `
    <div class="summary-row">
      <span>Total Registrations</span>
      <strong>${registrations.length}</strong>
    </div>
    <div class="summary-row">
      <span>Payment Pending</span>
      <strong>${paymentPending}</strong>
    </div>
    <div class="summary-row">
      <span>Attendance Marked</span>
      <strong>${attendanceMarked}</strong>
    </div>
  `;
}

function getEventStatusClass(event) {
  if (event.published) {
    return 'published-cell';
  }

  if (event.approvalStatus === 'approved') {
    return 'approved-cell';
  }

  if (event.approvalStatus === 'rejected' || event.approvalStatus === 'changes_requested') {
    return 'conflict-cell';
  }

  return 'pending-cell';
}

function getClubEventStatusText(event) {
  if (event.published) {
    return 'Published';
  }

  if (event.approvalStatus === 'approved') {
    return 'Approved, Not Published';
  }

  if (event.approvalStatus === 'rejected') {
    return 'Rejected';
  }

  if (event.approvalStatus === 'changes_requested') {
    return 'Changes Requested';
  }

  return 'Pending Approval';
}

function getClubEventLeftClass(event) {
  if (event.published) {
    return 'published-left';
  }

  if (event.approvalStatus === 'approved') {
    return 'approved-left';
  }

  return 'pending-left';
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatShortDate(dateString) {
  const date = new Date(dateString);
  return date.getDate();
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function findVenueConflicts(events) {
  const conflicts = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (
        events[i].date === events[j].date &&
        events[i].venue.toLowerCase() === events[j].venue.toLowerCase() &&
        events[i].startTime < events[j].endTime &&
        events[j].startTime < events[i].endTime
      ) {
        conflicts.push([events[i], events[j]]);
      }
    }
  }

  return conflicts;
}

window.addEventListener('click', function (event) {
  if (event.target === createEventModal) {
    closeCreateEvent();
  }
});

async function initializeAdminPage() {
  updateAdminUI();

  if (adminToken && currentAdmin) {
    await loadDashboardForRole();
  }
}

initializeAdminPage();
