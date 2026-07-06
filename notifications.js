const API_BASE_URL = 'http://localhost:5001/api';

const notificationList = document.getElementById('notificationList');
const notificationSubText = document.getElementById('notificationSubText');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const notificationsAdminLink = document.getElementById('notificationsAdminLink');

let token = localStorage.getItem('campusConnectStudentToken') || localStorage.getItem('campusConnectAdminToken') || '';
let user = JSON.parse(localStorage.getItem('campusConnectStudentUser') || localStorage.getItem('campusConnectAdminUser') || 'null');
let notifications = [];

markAllReadBtn.addEventListener('click', markAllNotificationsRead);

if (user && ['superadmin', 'clubadmin', 'coordinator'].includes(user.role)) {
  notificationsAdminLink.classList.remove('hidden');
} else {
  notificationsAdminLink.classList.add('hidden');
}

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

async function loadNotifications() {
  if (!token || !user) {
    notificationSubText.textContent = 'Please login to view notifications.';
    notificationList.innerHTML = '<div class="notification-card"><p>No logged-in user found.</p></div>';
    markAllReadBtn.classList.add('hidden');
    return;
  }

  try {
    const data = await apiRequest('/notifications/my');
    notifications = data.notifications;
    notificationSubText.textContent = `${data.unreadCount} unread notification(s)`;
    renderNotifications();

    if (data.unreadCount > 0) {
      await apiRequest('/notifications/read-all/my', {
        method: 'PATCH'
      });
    }
  } catch (error) {
    notificationList.innerHTML = `<p class="loading-message small-loading">${error.message}</p>`;
  }
}

function renderNotifications() {
  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML = '<div class="notification-card"><p>No notifications available.</p></div>';
    return;
  }

  notificationList.innerHTML = notifications.map(function (notification) {
    return `
      <div class="notification-card ${notification.read ? '' : 'unread-notification'}">
        <div>
          <h3>${notification.title}</h3>
          <p>${notification.message}</p>
          <span>${formatDisplayDate(notification.createdAt)}</span>
        </div>
        <div class="notification-actions">
          ${notification.actionUrl ? `<a class="report-btn" href="${notification.actionUrl}">${notification.actionLabel || 'Open'}</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function markAllNotificationsRead() {
  try {
    await apiRequest('/notifications/read-all/my', {
      method: 'PATCH'
    });

    await loadNotifications();
  } catch (error) {
    alert(error.message);
  }
}

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  });
}

loadNotifications();
