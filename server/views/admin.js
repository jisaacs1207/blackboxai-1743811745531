// Login functionality
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupLoginForm();
    setupLogoutButton();
});

function checkAuthStatus() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.isAuthenticated) {
                showDashboard();
                loadCustomization();
            } else {
                showLoginForm();
            }
        })
        .catch(error => console.error('Error checking auth status:', error));
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                if (data.success) {
                    showDashboard();
                    loadCustomization();
                } else {
                    showToast('Invalid credentials', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed', 'error');
            }
        });
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                showLoginForm();
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

function showLoginForm() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
}

// Default customization values
const defaultCustomization = {
    bannerUrl: '',
    backgroundColor: '#FFFFFF',
    headerColor: '#194A53',
    fontColor: '#333333',
    accentColor: '#F76B1C'
};

// Site customization state initialized with defaults
let siteCustomization = { ...defaultCustomization };

// Initialize color pickers and input fields
async function loadCustomization() {
    try {
        const response = await fetch('/api/customization');
        const data = await response.json();
        
        // Merge with defaults to ensure all properties exist
        siteCustomization = { ...defaultCustomization, ...data };
        
        updateColorInputs();
        updateBannerPreview();
    } catch (error) {
        console.error('Error loading customization:', error);
        
        // Use defaults if loading fails
        siteCustomization = { ...defaultCustomization };
        updateColorInputs();
        
        // Only show error toast if it's not a first-time load
        if (error.message !== 'Failed to fetch') {
            showToast('Error loading customization settings. Using defaults.', 'error');
        }
    }
}

function setupColorPicker(colorId, hexId, rgbId, customizationKey) {
    const colorPicker = document.getElementById(colorId);
    const hexInput = document.getElementById(hexId);
    const rgbInput = document.getElementById(rgbId);

    if (!colorPicker || !hexInput || !rgbInput) return;

    // Set initial values
    colorPicker.value = siteCustomization[customizationKey];
    hexInput.value = siteCustomization[customizationKey];
    rgbInput.value = hexToRgb(siteCustomization[customizationKey]);

    // Color picker change
    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        siteCustomization[customizationKey] = color;
        hexInput.value = color;
        rgbInput.value = hexToRgb(color);
        showPreview();
    });

    // Hex input change
    hexInput.addEventListener('input', (e) => {
        let color = e.target.value;
        if (isValidHex(color)) {
            siteCustomization[customizationKey] = color;
            colorPicker.value = color;
            rgbInput.value = hexToRgb(color);
            showPreview();
        }
    });

    // RGB input change
    rgbInput.addEventListener('input', (e) => {
        const rgb = e.target.value;
        if (isValidRgb(rgb)) {
            const hex = rgbToHex(rgb);
            siteCustomization[customizationKey] = hex;
            colorPicker.value = hex;
            hexInput.value = hex;
            showPreview();
        }
    });
}

function updateColorInputs() {
    setupColorPicker('bg-color', 'bg-color-hex', 'bg-color-rgb', 'backgroundColor');
    setupColorPicker('header-color', 'header-color-hex', 'header-color-rgb', 'headerColor');
    setupColorPicker('font-color', 'font-color-hex', 'font-color-rgb', 'fontColor');
    setupColorPicker('accent-color', 'accent-color-hex', 'accent-color-rgb', 'accentColor');
}

function updateBannerPreview() {
    const bannerImg = document.getElementById('current-banner');
    const bannerInput = document.getElementById('banner-url');
    
    if (bannerImg && bannerInput && siteCustomization.bannerUrl) {
        bannerImg.src = siteCustomization.bannerUrl;
        bannerInput.value = siteCustomization.bannerUrl;
    }
}

function updateBanner() {
    const bannerUrl = document.getElementById('banner-url').value;
    siteCustomization.bannerUrl = bannerUrl;
    updateBannerPreview();
    showPreview();
}

function showPreview() {
    // Create a preview of changes before applying
    const previewStyles = document.createElement('style');
    previewStyles.id = 'preview-styles';
    previewStyles.textContent = `
        :root {
            --bg-color: ${siteCustomization.backgroundColor};
            --header-color: ${siteCustomization.headerColor};
            --font-color: ${siteCustomization.fontColor};
            --accent-color: ${siteCustomization.accentColor};
        }
        
        /* Apply preview styles directly to elements */
        body { background-color: var(--bg-color); }
        header { background-color: var(--header-color); }
        .text-[#333333] { color: var(--font-color); }
        .hover\\:bg-\\[\\#F76B1C\\]:hover { background-color: var(--accent-color); }
        .bg-\\[\\#F76B1C\\] { background-color: var(--accent-color); }
        .bg-\\[\\#194A53\\] { background-color: var(--header-color); }
    `;

    // Remove existing preview if any
    const existingPreview = document.getElementById('preview-styles');
    if (existingPreview) {
        existingPreview.remove();
    }

    document.head.appendChild(previewStyles);
}

async function applyCustomization() {
    try {
        const response = await fetch('/api/customization', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(siteCustomization)
        });

        const data = await response.json();
        if (data.success) {
            showToast('Customization applied successfully!', 'success');
            // Reload the page to apply new styles
            window.location.reload();
        } else {
            showToast('Error applying customization', 'error');
        }
    } catch (error) {
        console.error('Error saving customization:', error);
        showToast('Error applying customization', 'error');
    }
}

// Color conversion utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`
        : '';
}

function rgbToHex(rgb) {
    const values = rgb.match(/\d+/g);
    if (!values || values.length !== 3) return '';
    
    const [r, g, b] = values.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    });
    
    return `#${r}${g}${b}`;
}

function isValidHex(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function isValidRgb(color) {
    return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color);
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Partner Management functionality
function setupPartnerManagement() {
    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        partnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(partnerForm);
            const partnerData = {};
            formData.forEach((value, key) => {
                if (key.includes('.')) {
                    const [parent, child] = key.split('.');
                    if (!partnerData[parent]) partnerData[parent] = {};
                    partnerData[parent][child] = value;
                } else {
                    partnerData[key] = value;
                }
            });

            try {
                const response = await fetch('/api/partners', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(partnerData)
                });

                if (response.ok) {
                    showToast('Partner added successfully!', 'success');
                    closeModal();
                    partnerForm.reset();
                    loadPartners(); // Reload the partners list
                } else {
                    showToast('Error adding partner', 'error');
                }
            } catch (error) {
                console.error('Error saving partner:', error);
                showToast('Error adding partner', 'error');
            }
        });
    }

    const addPartnerBtn = document.getElementById('add-partner-btn');
    if (addPartnerBtn) {
        addPartnerBtn.addEventListener('click', () => {
            const modal = document.getElementById('partner-modal');
            if (modal) {
                modal.classList.add('flex');
                modal.classList.remove('hidden');
            }
        });
    }
}

function closeModal() {
    const modal = document.getElementById('partner-modal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        const form = document.getElementById('partner-form');
        if (form) form.reset();
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

// Function to load partners
async function loadPartners() {
    try {
        const response = await fetch('/api/partners');
        const partners = await response.json();
        
        // Update table
        const partnersTable = document.getElementById('partners-table');
        if (partnersTable) {
            partnersTable.innerHTML = `
                <table class="partners-table w-full">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Location</th>
                            <th>Contact</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${partners.map(partner => `
                            <tr>
                                <td>${partner.name || ''}</td>
                                <td>${partner.location || ''}</td>
                                <td>${partner.contact?.email || ''}</td>
                                <td class="text-right">
                                    <button data-action="edit" data-id="${partner.id}" 
                                            class="btn btn-secondary mr-2">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button data-action="delete" data-id="${partner.id}" 
                                            class="btn btn-secondary text-red-600">
                                        <i class="fas fa-trash-alt"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Add event listeners to table buttons
            partnersTable.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                if (!button) return;

                const action = button.dataset.action;
                const id = button.dataset.id;

                if (action === 'edit') editPartner(id);
                if (action === 'delete') deletePartner(id);
            });
        }

        // Update stats
        const totalPartners = partners.length;
        const activePartners = partners.filter(p => p.active !== false).length;
        const countries = [...new Set(partners.map(p => p.location?.split(',').pop()?.trim() || ''))].length;

        document.getElementById('total-partners').textContent = totalPartners;
        document.getElementById('active-partners').textContent = activePartners;
        document.getElementById('total-countries').textContent = countries;

    } catch (error) {
        console.error('Error loading partners:', error);
        showToast('Error loading partners', 'error');
    }
}

// Edit partner
async function editPartner(partnerId) {
    try {
        const response = await fetch(`/api/partners/${partnerId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch partner data');
        }
        
        const partner = await response.json();
        
        // Get form and modal elements
        const form = document.getElementById('partner-form');
        const modal = document.getElementById('partner-modal');
        const modalTitle = document.getElementById('modal-title');
        
        if (!form || !modal || !modalTitle) {
            throw new Error('Required elements not found');
        }
        
        // Update modal title
        modalTitle.textContent = 'Edit Partner';
        
        // Reset form and populate with partner data
        form.reset();
        
        // Populate form fields
        Object.entries({
            'name': partner.name || '',
            'location': partner.location || '',
            'image': partner.image || '',
            'bio': partner.bio || '',
            'website': partner.website || '',
            'contact.email': partner.contact?.email || '',
            'contact.phone': partner.contact?.phone || '',
            'partnershipDetails': partner.partnershipDetails || ''
        }).forEach(([name, value]) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) field.value = value;
        });
        
        // Store partner ID for submission
        form.dataset.partnerId = partnerId;
        
        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Update form submit handler
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
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
                const updateResponse = await fetch(`/api/partners/${partnerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partnerData)
                });
                
                if (!updateResponse.ok) {
                    throw new Error('Failed to update partner');
                }
                
                showToast('Partner updated successfully', 'success');
                closeModal();
                loadPartners();
            } catch (error) {
                console.error('Error updating partner:', error);
                showToast('Error updating partner', 'error');
            }
        };
    } catch (error) {
        console.error('Error loading partner details:', error);
        showToast('Error loading partner details', 'error');
    }
}

// Delete partner
async function deletePartner(partnerId) {
    // Show delete confirmation modal
    const deleteModal = document.getElementById('delete-modal');
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
    
    // Set up confirm delete handler
    window.confirmDelete = async () => {
        try {
            const response = await fetch(`/api/partners/${partnerId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Partner deleted successfully', 'success');
                closeDeleteModal();
                loadPartners();
            } else {
                showToast('Error deleting partner', 'error');
            }
        } catch (error) {
            console.error('Error deleting partner:', error);
            showToast('Error deleting partner', 'error');
        }
    };
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupLoginForm();
    setupLogoutButton();
    setupPartnerManagement();
    setupModalHandlers();

    // Setup observer for dashboard visibility
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'dashboard-section' && 
                !mutation.target.classList.contains('hidden')) {
                loadPartners();
            }
        });
    });

    const dashboard = document.getElementById('dashboard-section');
    if (dashboard) {
        observer.observe(dashboard, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
});

// Setup modal event handlers
function setupModalHandlers() {
    // Close modal buttons
    document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn')?.addEventListener('click', closeModal);
    document.getElementById('cancel-delete-btn')?.addEventListener('click', closeDeleteModal);
    
    // Confirm delete button
    document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
        if (window.confirmDelete) window.confirmDelete();
    });
}
