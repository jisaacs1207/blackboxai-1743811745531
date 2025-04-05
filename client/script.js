// Sample partner data (will be replaced with API calls)
const samplePartners = [
    {
        id: 1,
        name: "International School of Excellence",
        location: "Seoul, South Korea",
        image: "https://images.pexels.com/photos/2982449/pexels-photo-2982449.jpeg",
        bio: "A leading international school in Seoul with over 20 years of educational excellence.",
        website: "https://example.com",
        contact: {
            email: "partnerships@ise.edu",
            phone: "+82 2 123 4567"
        },
        partnershipDetails: "Established in 2020, this partnership has enabled over 100 students to pursue their dual diploma dreams."
    },
    {
        id: 2,
        name: "Academia Moderna",
        location: "Mexico City, Mexico",
        image: "https://images.pexels.com/photos/2305098/pexels-photo-2305098.jpeg",
        bio: "Pioneering modern education methodologies with a focus on global perspective.",
        website: "https://example.com",
        contact: {
            email: "info@academiamoderna.edu.mx"
        },
        partnershipDetails: "A thriving partnership focusing on STEM education and cultural exchange."
    },
    {
        id: 3,
        name: "European College of Innovation",
        location: "Barcelona, Spain",
        image: "https://images.pexels.com/photos/356065/pexels-photo-356065.jpeg",
        bio: "Combining European educational traditions with innovative teaching methods.",
        website: "https://example.com",
        contact: {
            email: "partnerships@eci.eu",
            phone: "+34 93 123 4567"
        },
        partnershipDetails: "Partnership established in 2021, specializing in technology and entrepreneurship programs."
    }
];

// DOM Elements
const partnersGrid = document.getElementById('partners-grid');
const modal = document.getElementById('partner-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');

// Function to create partner cards
function createPartnerCard(partner) {
    const card = document.createElement('div');
    card.className = 'partner-card bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer';
    card.innerHTML = `
        <img src="${partner.image}" alt="${partner.name}" class="partner-logo">
        <div class="p-6">
            <h3 class="text-xl font-semibold text-[#003057] mb-2">${partner.name}</h3>
            <p class="text-gray-600 mb-4">${partner.location}</p>
            <button class="btn-primary w-full">View Details</button>
        </div>
    `;
    
    card.addEventListener('click', () => showPartnerDetails(partner));
    return card;
}

// Function to show partner details in modal
function showPartnerDetails(partner) {
    modalTitle.textContent = partner.name;
    
    const content = `
        <div class="space-y-6">
            <img src="${partner.image}" alt="${partner.name}" class="w-full h-64 object-cover rounded-lg mb-6">
            
            ${partner.bio ? `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-[#003057] mb-2">About</h4>
                    <p class="text-gray-700">${partner.bio}</p>
                </div>
            ` : ''}
            
            ${partner.website ? `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-[#003057] mb-2">Website</h4>
                    <a href="${partner.website}" target="_blank" class="text-blue-600 hover:text-blue-800 transition">
                        ${partner.website}
                    </a>
                </div>
            ` : ''}
            
            ${partner.contact ? `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold text-[#003057] mb-2">Contact Information</h4>
                    <div class="space-y-2">
                        ${partner.contact.email ? `
                            <p class="flex items-center">
                                <i class="fas fa-envelope text-[#F4B223] mr-2"></i>
                                <a href="mailto:${partner.contact.email}" class="text-blue-600 hover:text-blue-800 transition">
                                    ${partner.contact.email}
                                </a>
                            </p>
                        ` : ''}
                        ${partner.contact.phone ? `
                            <p class="flex items-center">
                                <i class="fas fa-phone text-[#F4B223] mr-2"></i>
                                <a href="tel:${partner.contact.phone}" class="text-blue-600 hover:text-blue-800 transition">
                                    ${partner.contact.phone}
                                </a>
                            </p>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${partner.partnershipDetails ? `
                <div>
                    <h4 class="text-lg font-semibold text-[#003057] mb-2">Partnership Details</h4>
                    <p class="text-gray-700">${partner.partnershipDetails}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Add fade-in animation
    modalContent.parentElement.classList.add('modal-enter');
    setTimeout(() => {
        modalContent.parentElement.classList.remove('modal-enter');
    }, 300);
}

// Function to close modal
function closeModal() {
    // Add fade-out animation
    modalContent.parentElement.classList.add('modal-exit');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modalContent.parentElement.classList.remove('modal-exit');
    }, 300);
}

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
});

// Initialize the page
function initializePage() {
    // Clear existing content
    partnersGrid.innerHTML = '';
    
    // Add loading state
    const loading = document.createElement('div');
    loading.className = 'col-span-full flex justify-center items-center py-12';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    partnersGrid.appendChild(loading);
    
    // Simulate API call delay
    setTimeout(() => {
        // Remove loading state
        partnersGrid.innerHTML = '';
        
        // Add partner cards
        samplePartners.forEach(partner => {
            partnersGrid.appendChild(createPartnerCard(partner));
        });
    }, 1000);
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);