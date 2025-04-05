// Load site customization and partners on page load
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/customization')
        .then(response => response.json())
        .then(customization => {
            applyCustomization(customization);
        })
        .catch(error => {
            console.error('Error loading customization:', error);
        });

    loadPartners();
});

// Apply customization to the site
function applyCustomization(customization) {
    // Update banner image if provided
    if (customization.bannerUrl) {
        const bannerImg = document.querySelector('header img');
        if (bannerImg) {
            bannerImg.src = customization.bannerUrl;
        }
    }

    // Create or update style element
    let styleEl = document.getElementById('custom-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-styles';
        document.head.appendChild(styleEl);
    }

    // Apply all styles at once
    styleEl.textContent = `
        header, .bg-\\[\\#194A53\\] { background-color: ${customization.headerColor} !important; }
        .bg-\\[\\#F76B1C\\] { background-color: ${customization.accentColor} !important; }
        .text-\\[\\#333333\\] { color: ${customization.fontColor} !important; }
        .text-\\[\\#F76B1C\\] { color: ${customization.accentColor} !important; }
        .hover\\:text-\\[\\#F76B1C\\]:hover { color: ${customization.accentColor} !important; }
        .hover\\:bg-\\[\\#F76B1C\\]:hover { background-color: ${customization.accentColor} !important; }
        button.bg-\\[\\#194A53\\] { background-color: ${customization.headerColor} !important; }
        button.hover\\:bg-\\[\\#F76B1C\\]:hover { background-color: ${customization.accentColor} !important; }
    `;

    // Force a repaint
    document.body.style.display = 'none';
    document.body.offsetHeight;
    document.body.style.display = '';
}

// Partner card functionality
let partners = [];

// Load partners on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPartners();
});

// Function to load partners
async function loadPartners() {
    try {
        const response = await fetch('/api/partners');
        partners = await response.json();
        displayPartners();
    } catch (error) {
        console.error('Error loading partners:', error);
    }
}

// Function to display partners
function displayPartners() {
    const grid = document.getElementById('partners-grid');
    if (!grid) return;

    if (!partners || partners.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-500">No partners available.</p>';
        return;
    }

    grid.innerHTML = partners.map(partner => `
        <div class="partner-card bg-white rounded-lg shadow-lg overflow-hidden">
            <img src="${partner.image || 'https://via.placeholder.com/300x200'}" 
                 alt="${partner.name}" 
                 class="w-full h-48 object-cover"
                 onerror="this.src='https://via.placeholder.com/300x200'">
            <div class="p-6">
                <h3 class="text-xl font-bold mb-2 text-[#333333]">${partner.name}</h3>
                <p class="text-gray-600 mb-4">${partner.location}</p>
                <button onclick="showPartnerDetails('${partner.id}')"
                        class="bg-[#194A53] text-white px-4 py-2 rounded-md hover:bg-[#F76B1C] transition">
                    Learn More
                </button>
            </div>
        </div>
    `).join('');
}

// Function to load partners
async function loadPartners() {
    try {
        const response = await fetch('/api/partners');
        if (!response.ok) {
            throw new Error('Failed to load partners');
        }
        partners = await response.json();
        displayPartners();
    } catch (error) {
        console.error('Error loading partners:', error);
        const grid = document.getElementById('partners-grid');
        if (grid) {
            grid.innerHTML = '<p class="col-span-full text-center text-red-500">Error loading partners. Please try again later.</p>';
        }
    }
}

// Function to show partner details
function showPartnerDetails(partnerId) {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;

    const modal = document.getElementById('partner-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = partner.name;
    modalContent.innerHTML = `
        <div class="space-y-4">
            <img src="${partner.image || 'https://via.placeholder.com/600x400'}" 
                 alt="${partner.name}" 
                 class="w-full h-64 object-cover rounded-lg mb-4">
            <div class="space-y-2">
                <p class="text-lg"><strong>Location:</strong> ${partner.location}</p>
                <p class="text-lg"><strong>Website:</strong> 
                    <a href="${partner.website}" target="_blank" class="text-[var(--accent-color)] hover:underline">
                        ${partner.website}
                    </a>
                </p>
                <div class="mt-4">
                    <h4 class="text-lg font-bold mb-2">About</h4>
                    <p>${partner.bio || 'No description available.'}</p>
                </div>
                <div class="mt-4">
                    <h4 class="text-lg font-bold mb-2">Partnership Details</h4>
                    <p>${partner.partnershipDetails || 'No details available.'}</p>
                </div>
                <div class="mt-4">
                    <h4 class="text-lg font-bold mb-2">Contact Information</h4>
                    <p><strong>Email:</strong> ${partner.contact?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${partner.contact?.phone || 'N/A'}</p>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Function to close partner details modal
function closeModal() {
    const modal = document.getElementById('partner-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('partner-modal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});