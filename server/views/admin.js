// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const addPartnerBtn = document.getElementById('add-partner-btn');
const partnerModal = document.getElementById('partner-modal');
const deleteModal = document.getElementById('delete-modal');
const partnerForm = document.getElementById('partner-form');
const partnersTable = document.getElementById('partners-table');

let currentPartnerId = null;
let partners = [];

// Authentication Functions
async function login(credentials) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        showDashboard();
        loadPartners();
        showToast('Logged in successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        showLogin();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        showToast('Error logging out', 'error');
    }
}

// UI Functions
function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
}

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Trigger reflow to enable animation
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Partner Management Functions
async function loadPartners() {
    try {
        const response = await fetch('/api/partners', {
            credentials: 'include'
        });
        partners = await response.json();
        renderPartnersTable();
    } catch (error) {
        showToast('Error loading partners', 'error');
    }
}

function renderPartnersTable() {
    partnersTable.innerHTML = `
        <table class="partners-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Website</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${partners.map(partner => `
                    <tr>
                        <td class="font-medium">${partner.name}</td>
                        <td>${partner.location || '-'}</td>
                        <td>
                            ${partner.website ? 
                                `<a href="${partner.website}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                    ${new URL(partner.website).hostname}
                                </a>` : 
                                '-'
                            }
                        </td>
                        <td>
                            <div class="flex space-x-2">
                                <button onclick="editPartner(${partner.id})" 
                                        class="text-blue-600 hover:text-blue-800">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="showDeleteConfirmation(${partner.id})" 
                                        class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showPartnerModal(isEdit = false) {
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = isEdit ? 'Edit Partner' : 'Add New Partner';
    partnerModal.classList.remove('hidden');
    partnerModal.classList.add('flex');
}

function closeModal() {
    partnerModal.classList.remove('flex');
    partnerModal.classList.add('hidden');
    partnerForm.reset();
    currentPartnerId = null;
}

function showDeleteConfirmation(partnerId) {
    currentPartnerId = partnerId;
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
}

function closeDeleteModal() {
    deleteModal.classList.remove('flex');
    deleteModal.classList.add('hidden');
    currentPartnerId = null;
}

async function editPartner(partnerId) {
    currentPartnerId = partnerId;
    const partner = partners.find(p => p.id === partnerId);
    if (partner) {
        Object.entries(partner).forEach(([key, value]) => {
            if (typeof value === 'object') {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    const input = partnerForm.querySelector(`[name="${key}.${subKey}"]`);
                    if (input) input.value = subValue || '';
                });
            } else {
                const input = partnerForm.querySelector(`[name="${key}"]`);
                if (input) input.value = value || '';
            }
        });
        showPartnerModal(true);
    }
}

async function savePartner(formData) {
    const partnerData = {
        name: formData.get('name'),
        location: formData.get('location'),
        image: formData.get('image'),
        bio: formData.get('bio'),
        website: formData.get('website'),
        contact: {
            email: formData.get('contact.email'),
            phone: formData.get('contact.phone')
        },
        partnershipDetails: formData.get('partnershipDetails')
    };

    try {
        const url = currentPartnerId ? 
            `/api/partners/${currentPartnerId}` : 
            '/api/partners';
        
        const response = await fetch(url, {
            method: currentPartnerId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partnerData),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error saving partner');
        }

        closeModal();
        loadPartners();
        showToast(`Partner ${currentPartnerId ? 'updated' : 'added'} successfully`, 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function confirmDelete() {
    if (!currentPartnerId) return;

    try {
        const response = await fetch(`/api/partners/${currentPartnerId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error deleting partner');
        }

        closeDeleteModal();
        loadPartners();
        showToast('Partner deleted successfully', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    await login({
        username: formData.get('username'),
        password: formData.get('password')
    });
});

logoutBtn.addEventListener('click', logout);

addPartnerBtn.addEventListener('click', () => {
    partnerForm.reset();
    showPartnerModal(false);
});

partnerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(partnerForm);
    await savePartner(formData);
});

// Close modals when clicking outside
partnerModal.addEventListener('click', (e) => {
    if (e.target === partnerModal) closeModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Close modals on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});

// Initialize empty partners.json if it doesn't exist
fetch('/api/partners', { credentials: 'include' })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Not authenticated');
    })
    .then(() => {
        showDashboard();
        loadPartners();
    })
    .catch(() => {
        showLogin();
    });