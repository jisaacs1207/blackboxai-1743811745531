// Load partners data and populate the grid
document.addEventListener('DOMContentLoaded', async () => {
    await loadPartners();
    setupScrollAnimations();
    setupMobileMenu();
    
    // Add click handler for Learn More button
    document.querySelector('a[href="#program"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        const programSection = document.querySelector('#program');
        programSection?.scrollIntoView({ behavior: 'smooth' });
    });
});

async function loadPartners() {
    try {
        console.log('Fetching partners...');
        const response = await fetch('/api/partners');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const partners = await response.json();
        console.log('Loaded partners:', partners);
        
        const partnersGrid = document.getElementById('partners-grid');
        if (!partnersGrid) {
            console.error('Partners grid element not found');
            return;
        }
        
        partnersGrid.innerHTML = partners.map((partner, index) => `
            <div class="partner-card bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300" 
                 onclick="showPartnerDetails('${partner.id}')"
                 style="opacity: 0; animation: fadeIn 0.5s ease forwards; animation-delay: ${index * 0.2}s">
                <div class="relative overflow-hidden h-64">
                    <img src="${partner.image || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                         alt="${partner.name}" 
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                         onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <div class="p-8">
                    <h3 class="text-2xl font-semibold text-[#194A53] mb-3">${partner.name}</h3>
                    <div class="flex items-center mb-4 text-gray-600">
                        <svg class="w-5 h-5 mr-2 text-[#F76B1C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <span class="font-medium">${partner.location}</span>
                    </div>
                    <p class="text-gray-700 line-clamp-3 mb-6">${partner.bio}</p>
                    <div class="flex items-center text-[#F76B1C] font-medium group">
                        <span>Learn More</span>
                        <svg class="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" 
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M9 5l7 7-7 7"/>
                        </svg>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading partners:', error);
    }
}

function showPartnerDetails(partnerId) {
    fetch(`/api/partners/${partnerId}`)
        .then(response => response.json())
        .then(partner => {
            const modal = document.getElementById('partner-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');

            modalTitle.textContent = partner.name;
            modalContent.innerHTML = `
                <div class="space-y-6">
                    <img src="${partner.image}" alt="${partner.name}" class="w-full h-64 object-cover rounded-lg mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="text-lg font-semibold mb-2 text-[#194A53]">Location</h4>
                            <p class="text-[#333333]">${partner.location}</p>
                        </div>
                        <div>
                            <h4 class="text-lg font-semibold mb-2 text-[#194A53]">Contact</h4>
                            <p class="text-[#333333]">${partner.contact?.email || 'N/A'}</p>
                            <p class="text-[#333333]">${partner.contact?.phone || 'N/A'}</p>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-2 text-[#194A53]">About</h4>
                        <p class="text-[#333333] leading-relaxed">${partner.bio}</p>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold mb-2 text-[#194A53]">Partnership Details</h4>
                        <p class="text-[#333333] leading-relaxed">${partner.partnershipDetails}</p>
                    </div>
                    ${partner.website ? `
                        <div class="mt-6">
                            <a href="${partner.website}" target="_blank" 
                               class="inline-flex items-center text-[#194A53] hover:text-[#F76B1C] transition-colors">
                                <span>Visit Website</span>
                                <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                </svg>
                            </a>
                        </div>
                    ` : ''}
                </div>
            `;

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Add fade-in animation
            modalContent.style.opacity = '0';
            modalContent.style.transform = 'scale(0.95)';
            setTimeout(() => {
                modalContent.style.opacity = '1';
                modalContent.style.transform = 'scale(1)';
            }, 10);
        })
        .catch(error => console.error('Error loading partner details:', error));
}

function closeModal() {
    const modal = document.getElementById('partner-modal');
    const modalContent = document.getElementById('modal-content');
    
    // Add fade-out animation
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });

    // Observe all sections and elements with animation classes
    document.querySelectorAll('section, .animate-fade-in').forEach(el => {
        observer.observe(el);
    });
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.md\\:hidden');
    const nav = document.querySelector('.hidden.md\\:flex');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('hidden');
            nav.classList.toggle('flex');
            nav.classList.toggle('flex-col');
            nav.classList.toggle('absolute');
            nav.classList.toggle('top-full');
            nav.classList.toggle('left-0');
            nav.classList.toggle('right-0');
            nav.classList.toggle('bg-[#194A53]');
            nav.classList.toggle('p-4');
        });
    }
}

// Close modal when clicking outside
document.getElementById('partner-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
