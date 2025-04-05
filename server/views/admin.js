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

// Site customization functionality
let siteCustomization = {
    bannerUrl: '',
    backgroundColor: '#FFFFFF',
    headerColor: '#194A53',
    fontColor: '#333333',
    accentColor: '#F76B1C'
};

// Initialize color pickers and input fields
async function loadCustomization() {
    try {
        const response = await fetch('/api/customization');
        const data = await response.json();
        siteCustomization = { ...siteCustomization, ...data };
        updateColorInputs();
        updateBannerPreview();
    } catch (error) {
        console.error('Error loading customization:', error);
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
                modal.style.display = 'flex';
            }
        });
    }
}

function closeModal() {
    const modal = document.getElementById('partner-modal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('partner-form');
        if (form) form.reset();
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Function to load partners
async function loadPartners() {
    try {
        const response = await fetch('/api/partners');
        const partners = await response.json();
        const partnersTable = document.getElementById('partners-table');
        if (partnersTable) {
            // Create table headers
            partnersTable.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${partners.map(partner => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">${partner.name || ''}</td>
                                <td class="px-6 py-4 whitespace-nowrap">${partner.location || ''}</td>
                                <td class="px-6 py-4 whitespace-nowrap">${partner.contact?.email || ''}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                    <button onclick="editPartner('${partner.id}')" 
                                            class="text-[#194A53] hover:text-[#F76B1C] transition-colors mr-4">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button onclick="deletePartner('${partner.id}')" 
                                            class="text-red-600 hover:text-red-800 transition-colors">
                                        <i class="fas fa-trash-alt"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        // Update stats
        const totalPartners = partners.length;
        const activePartners = partners.filter(p => p.active !== false).length;
        const countries = [...new Set(partners.map(p => p.location.split(',').pop().trim()))].length;

        document.querySelector('.stat-value:nth-child(1)').textContent = totalPartners;
        document.querySelector('.stat-value:nth-child(2)').textContent = activePartners;
        document.querySelector('.stat-value:nth-child(3)').textContent = countries;

    } catch (error) {
        console.error('Error loading partners:', error);
        showToast('Error loading partners', 'error');
    }
}

// Edit partner
async function editPartner(partnerId) {
    try {
        // Get partner data
        const response = await fetch(`/api/partners/${partnerId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch partner data');
        }
        
        const partner = await response.json();
        console.log('Editing partner:', partner);
        
        // Get form and validate
        const form = document.getElementById('partner-form');
        if (!form) {
            throw new Error('Partner form not found');
        }
        
        // Populate form fields
        const fields = {
            'name': partner.name || '',
            'location': partner.location || '',
            'image': partner.image || '',
            'bio': partner.bio || '',
            'website': partner.website || '',
            'contact.email': partner.contact?.email || '',
            'contact.phone': partner.contact?.phone || '',
            'partnershipDetails': partner.partnershipDetails || ''
        };
        
        // Set each field value
        Object.entries(fields).forEach(([name, value]) => {
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value;
            }
        });
        
        // Update form metadata
        form.dataset.mode = 'edit';
        form.dataset.partnerId = partnerId;
        
        // Update modal title and show
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Partner';
        }
        
        const modal = document.getElementById('partner-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
        
        // Set up form submission handler
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            try {
                // Validate required fields
                const requiredFields = ['name', 'location', 'bio'];
                const formData = new FormData(form);
                const missingFields = requiredFields.filter(field => !formData.get(field));
                
                if (missingFields.length > 0) {
                    throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
                }
                
                // Prepare partner data
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
                
                // Send update request
                const response = await fetch(`/api/partners/${partnerId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(partnerData)
                });
                
                // Handle response
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.details || 'Failed to update partner');
                }
                
                // Process successful update
                const updatedPartner = await response.json();
                console.log('Partner updated successfully:', updatedPartner);
                
                showToast('Partner updated successfully', 'success');
                closeModal();
                
                // Reload partners list and update stats
                await loadPartners();
                
            } catch (error) {
                console.error('Error updating partner:', error);
                showToast(error.message || 'Error updating partner', 'error');
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
    deleteModal.style.display = 'flex';
    
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
