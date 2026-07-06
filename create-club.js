const API_BASE_URL = 'https://campus-connect-a3ga.onrender.com/api';

const clubRequestStatusText = document.getElementById('clubRequestStatusText');
const clubCreationForm = document.getElementById('clubCreationForm');
const clubCreationSuccess = document.getElementById('clubCreationSuccess');
const clubName = document.getElementById('clubName');
const clubEmail = document.getElementById('clubEmail');
const clubPhone = document.getElementById('clubPhone');
const facultyCoordinator = document.getElementById('facultyCoordinator');
const studentCoordinator = document.getElementById('studentCoordinator');
const clubLogoUrl = document.getElementById('clubLogoUrl');
const clubInstagram = document.getElementById('clubInstagram');
const clubWhatsapp = document.getElementById('clubWhatsapp');
const clubDescription = document.getElementById('clubDescription');

let token = localStorage.getItem('campusConnectStudentToken') || localStorage.getItem('campusConnectAdminToken') || '';
let user = JSON.parse(localStorage.getItem('campusConnectStudentUser') || localStorage.getItem('campusConnectAdminUser') || 'null');
const params = new URLSearchParams(window.location.search);
const requestId = params.get('requestId');
let clubRequest = null;

clubCreationForm.addEventListener('submit', submitClubDetails);

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

async function loadClubRequest() {
  if (!token || !user) {
    clubRequestStatusText.textContent = 'Please login first from the public home page.';
    return;
  }

  if (!requestId) {
    clubRequestStatusText.textContent = 'No club request ID found. Open this page from your notification.';
    return;
  }

  try {
    const data = await apiRequest(`/club-requests/${requestId}`);
    clubRequest = data.clubRequest;

    if (!['permission_granted', 'rejected'].includes(clubRequest.status)) {
      clubRequestStatusText.textContent = `This club request status is ${clubRequest.status}. It cannot be edited now.`;
      return;
    }

    clubRequestStatusText.textContent = 'You have permission to submit club details.';
    clubCreationForm.classList.remove('hidden');

    clubName.value = clubRequest.name || '';
    clubEmail.value = clubRequest.email || user.email || '';
    clubPhone.value = clubRequest.phone || user.phone || '';
    facultyCoordinator.value = clubRequest.facultyCoordinator || '';
    studentCoordinator.value = clubRequest.studentCoordinator || user.name || '';
    clubLogoUrl.value = clubRequest.logoUrl || '';
    clubInstagram.value = clubRequest.instagramUrl || '';
    clubWhatsapp.value = clubRequest.whatsappLink || '';
    clubDescription.value = clubRequest.description || '';
  } catch (error) {
    clubRequestStatusText.textContent = error.message;
  }
}

async function submitClubDetails(event) {
  event.preventDefault();
  const submitButton = event.submitter;

  try {
    setButtonLoading(submitButton, true, 'Submitting...');
    await apiRequest(`/club-requests/${requestId}/submit`, {
      method: 'PUT',
      body: JSON.stringify({
        name: clubName.value.trim(),
        email: clubEmail.value.trim(),
        phone: clubPhone.value.trim(),
        facultyCoordinator: facultyCoordinator.value.trim(),
        studentCoordinator: studentCoordinator.value.trim(),
        logoUrl: clubLogoUrl.value.trim(),
        instagramUrl: clubInstagram.value.trim(),
        whatsappLink: clubWhatsapp.value.trim(),
        description: clubDescription.value.trim()
      })
    });

    clubCreationSuccess.classList.remove('hidden');
    clubRequestStatusText.textContent = 'Club details submitted. Waiting for Super Admin approval.';
    clubCreationForm.classList.add('hidden');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

loadClubRequest();
