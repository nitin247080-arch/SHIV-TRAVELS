/**
 * SHIV TRAVELS - Luxury Online Travel Booking Platform Client JS
 * B.Tech 3rd Semester Project Implementation
 */

// Global State - ALWAYS DEFAULTS TO TRAVELER PROFILE ON PAGE LOAD / REFRESH
const DEFAULT_TRAVELER_USER = {
    id: 'USR-003',
    name: 'Nitin',
    email: 'nitin@traveler.com',
    role: 'TRAVELER',
    phone: '+91 98333 44556',
    points: 1500,
    features: 'Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points'
};

let currentRole = 'TRAVELER'; // TRAVELER, AGENT, ADMIN
let currentUser = { ...DEFAULT_TRAVELER_USER };

let allListings = [];
let allUsers = [];
let currentCategory = 'ALL';
let activeSelectedListing = null;
let appliedDiscountPercent = 0;
let flightHasReturnTicket = false;

// Rotating Hero Background Images (Using User's Uploaded Photos!)
const heroBackgrounds = [
    '/assets/images/ayodhya_ram_mandir.jpg',
    '/assets/images/swiss_alps.jpg',
    '/assets/images/thailand_phiphi.jpg',
    '/assets/images/manali_snow_peaks.jpg',
    '/assets/images/jaipur_maota_lake.webp',
    '/assets/images/taj_mahal.webp',
    '/assets/images/bali_rice_terraces.jpg',
    '/assets/images/dubai_marina.webp',
    '/assets/images/goa_beach.jpg'
];
let currentBgIdx = 0;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    startHeroSlider();
});

function startHeroSlider() {
    const hero = document.getElementById('heroBanner');
    if (!hero) return;
    setInterval(() => {
        currentBgIdx = (currentBgIdx + 1) % heroBackgrounds.length;
        const nextImg = heroBackgrounds[currentBgIdx];
        hero.style.backgroundImage = `linear-gradient(135deg, rgba(15, 23, 42, 0.72) 0%, rgba(30, 41, 59, 0.85) 100%), url('${nextImg}')`;
    }, 6000);
}

async function initApp() {
    // ALWAYS force default to Traveler profile upon reload/refresh as requested
    currentRole = 'TRAVELER';
    currentUser = { ...DEFAULT_TRAVELER_USER };

    // Activate traveler section and reset other sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const travSec = document.getElementById('travelerSection');
    if (travSec) travSec.classList.add('active');

    // Default traveler tab to listings
    switchTravelerTab('listings');

    updateUserBadge();
    await loadUsers();
    await loadListings();
    await loadTravelerBookings();
    await loadItineraries();
    await loadTravelerMessages();
    await loadTravelerVouchers();
    await loadNotifications();
    await loadStats();

    // Restore traveler's preferred language (defaults to 'en')
    const savedLang = (typeof localStorage !== 'undefined' && localStorage.getItem('voyage_lang')) || 'en';
    selectLanguage(savedLang, false);
}

// ----------------------------------------------------
// ROLE & USER SWITCHING
// ----------------------------------------------------
function switchRole(role, targetUser = null) {
    if (role === 'ADMIN' && (!targetUser && currentUser.role !== 'ADMIN')) {
        showToast('Access Denied: The Administrator Control Center is private and can only be accessed by the Admin (Nitin Chaudhary)!', 'error');
        return;
    }
    if (role === 'AGENT' && (!targetUser && currentUser.role !== 'AGENT' && currentUser.role !== 'ADMIN')) {
        showToast('Access Denied: The Travel Agent Workspace can only be accessed by certified Travel Agents (Aman Sharma)!', 'error');
        return;
    }

    currentRole = role;

    // Switch view sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    if (role === 'TRAVELER') {
        document.getElementById('travelerSection').classList.add('active');
        if (targetUser) {
            currentUser = targetUser;
        } else if (!currentUser || currentUser.role !== 'TRAVELER') {
            currentUser = { id: 'USR-003', name: 'Nitin', email: 'nitin@traveler.com', role: 'TRAVELER', phone: '+91 98333 44556', points: 1500, features: 'Book Flights / Hotels / Cars, View & Export Itinerary, Loyalty Points' };
        }
        updateUserBadge();
        loadListings();
        loadTravelerBookings();
    } else if (role === 'AGENT') {
        document.getElementById('agentSection').classList.add('active');
        if (targetUser) {
            currentUser = targetUser;
        } else if (!currentUser || currentUser.role !== 'AGENT') {
            currentUser = { id: 'USR-002', name: 'Aman Sharma', email: 'agent@travel.com', role: 'AGENT', phone: '+91 98222 33445', features: 'Manage Listings, User Interaction, Track Bookings' };
        }
        updateUserBadge();
        loadAgentData();
    } else if (role === 'ADMIN') {
        document.getElementById('adminSection').classList.add('active');
        if (targetUser) {
            currentUser = targetUser;
        } else if (!currentUser || currentUser.role !== 'ADMIN') {
            currentUser = { id: 'USR-001', name: 'Nitin Chaudhary', email: 'nitin.admin@travel.com', role: 'ADMIN', phone: '+91 98111 22334', features: 'User Management, Listing Approvals, System Settings (GST %, Commission), Revenue & Booking Overview' };
        }
        updateUserBadge();
        loadAdminData();
    }

    // Update nav pills
    document.querySelectorAll('.role-pill').forEach(btn => btn.classList.remove('active'));
    const activePill = document.getElementById(`pill-${role}`);
    if (activePill) activePill.classList.add('active');
}

function updateUserBadge() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRoleBadge').textContent = currentUser.role === 'ADMIN' ? 'Administrator' : (currentUser.role === 'AGENT' ? 'Travel Agent' : 'Traveler');
    
    // Initials avatar
    const parts = currentUser.name.split(' ');
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    // STRICT ROLE ISOLATION:
    // 1. Traveler: Only Traveler portal visible.
    // 2. Travel Agent: Only Travel Agent workspace visible.
    // 3. Admin: Administrator Control Center visible (plus switch preview).
    const travelerPill = document.getElementById('pill-TRAVELER');
    const agentPill = document.getElementById('pill-AGENT');
    const adminPill = document.getElementById('pill-ADMIN');

    if (currentUser.role === 'TRAVELER') {
        if (travelerPill) { travelerPill.style.display = 'inline-flex'; travelerPill.classList.add('active'); }
        if (agentPill) agentPill.style.display = 'none';
        if (adminPill) adminPill.style.display = 'none';
    } else if (currentUser.role === 'AGENT') {
        if (travelerPill) travelerPill.style.display = 'none';
        if (agentPill) { agentPill.style.display = 'inline-flex'; agentPill.classList.add('active'); }
        if (adminPill) adminPill.style.display = 'none';
    } else if (currentUser.role === 'ADMIN') {
        if (travelerPill) travelerPill.style.display = 'inline-flex';
        if (agentPill) agentPill.style.display = 'inline-flex';
        if (adminPill) { adminPill.style.display = 'inline-flex'; }
    }

    // Loyalty badge display for Travelers
    const lb = document.getElementById('loyaltyBadgeDisplay');
    if (lb) {
        if (currentUser.role === 'TRAVELER' && currentUser.points !== undefined) {
            lb.style.display = 'inline-block';
            lb.textContent = `🎁 Loyalty: ${Number(currentUser.points).toLocaleString('en-IN')} pts`;
        } else {
            lb.style.display = 'none';
        }
    }
}

// ----------------------------------------------------
// AUTHENTICATION (LOGIN & SIGN UP / REGISTER)
// ----------------------------------------------------
function openAuthModal(mode = 'login') {
    switchAuthTab(mode);
    openModal('authModal');
}

function switchAuthTab(tab) {
    const btnLogin = document.getElementById('authTabBtnLogin');
    const btnReg = document.getElementById('authTabBtnRegister');
    const paneLogin = document.getElementById('authPaneLogin');
    const paneReg = document.getElementById('authPaneRegister');

    if (tab === 'login') {
        if (btnLogin) btnLogin.classList.add('active');
        if (btnReg) btnReg.classList.remove('active');
        if (paneLogin) paneLogin.style.display = 'block';
        if (paneReg) paneReg.style.display = 'none';
    } else {
        if (btnReg) btnReg.classList.add('active');
        if (btnLogin) btnLogin.classList.remove('active');
        if (paneLogin) paneLogin.style.display = 'none';
        if (paneReg) paneReg.style.display = 'block';
    }
}

function fillQuickLogin(email, password) {
    const e = document.getElementById('loginEmail');
    const p = document.getElementById('loginPassword');
    if (e) e.value = email;
    if (p) p.value = password;
    showToast(`Loaded credentials for ${email}`, 'info');
}

async function submitLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.success && data.user) {
            closeModal('authModal');
            showToast(data.message, 'success');
            // Log in as user
            switchRole(data.user.role, data.user);
            await loadUsers();
        } else {
            showToast(data.message || 'Login failed! Please check credentials.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server communication error during login', 'error');
    }
}

async function submitRegister(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const role = document.getElementById('regRole').value;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, role })
        });
        const data = await res.json();
        if (data.success && data.user) {
            closeModal('authModal');
            showToast(data.message, 'success');
            // Immediately log in as the newly created user!
            switchRole(data.user.role, data.user);
            await loadUsers();
            await loadStats();
        } else {
            showToast(data.message || 'Registration failed!', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server communication error during registration', 'error');
    }
}

async function openSwitchUserModal() {
    const list = document.getElementById('userSelectList');
    if (!list) return;

    // Refresh user list from backend
    if (allUsers.length === 0) {
        await loadUsers();
    }

    const defaultColors = {
        'ADMIN': '#b91c1c',
        'AGENT': '#ea580c',
        'TRAVELER': '#0284c7'
    };

    let html = '';
    // Display all registered users in system
    if (allUsers && allUsers.length > 0) {
        html = allUsers.map(u => {
            const role = u.role || 'TRAVELER';
            const color = defaultColors[role] || '#4f46e5';
            const parts = (u.name || 'User').split(' ');
            const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
            const pwd = u.password || 'pass123';
            const pts = u.loyaltyPoints || 0;
            const feat = u.features || (role === 'ADMIN' ? 'Full System Admin Access' : (role === 'AGENT' ? 'Manage Listings & Chat' : 'Book Flights/Hotels, Points'));

            return `
                <button class="user-item-btn" onclick="selectUser('${u.id}', '${escapeHtml(u.name)}', '${escapeHtml(u.email)}', '${role}', '${escapeHtml(u.phone || '')}', ${pts}, '${escapeHtml(feat)}')">
                    <span class="avatar" style="background:${color}">${initials}</span>
                    <div style="flex:1">
                        <strong>${escapeHtml(u.name)}</strong> <span class="badge" style="background:${color}15;color:${color}">${role}</span>
                        <div style="font-size:0.75rem;color:#64748b">${escapeHtml(u.email)} • 🔑 Password: ${escapeHtml(pwd)}</div>
                        <div style="font-size:0.7rem;color:#059669;margin-top:2px">${escapeHtml(feat)} ${role === 'TRAVELER' ? `(${pts} pts)` : ''}</div>
                    </div>
                </button>
            `;
        }).join('');
    }

    // Add button to sign up new account directly from modal
    html += `
        <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px dashed #cbd5e1; text-align:center;">
            <button class="btn btn-primary btn-sm" onclick="closeModal('switchUserModal'); openAuthModal('register');" style="width:100%; justify-content:center;">
                ✨ + Register New User Account
            </button>
        </div>
    `;

    list.innerHTML = html;
    openModal('switchUserModal');
}

function selectUser(id, name, email, role, phone, points, features) {
    const userObj = { id, name, email, role, phone, points: points || 0, features: features || '' };
    closeModal('switchUserModal');
    switchRole(role, userObj);
    showToast(`Logged in as ${name} (${role})`, 'success');
}

// ----------------------------------------------------
// TRAVELER PORTAL LOGIC
// ----------------------------------------------------
function switchTravelerTab(tab) {
    document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    document.querySelectorAll('#travelerSection .tab-pane').forEach(p => p.classList.remove('active'));
    if (tab === 'listings') document.getElementById('travelerTabListings').classList.add('active');
    if (tab === 'mybookings') {
        document.getElementById('travelerTabBookings').classList.add('active');
        loadTravelerBookings();
    }
    if (tab === 'itineraries') {
        document.getElementById('travelerTabItineraries').classList.add('active');
        loadItineraries();
    }
    if (tab === 'support') {
        document.getElementById('travelerTabSupport').classList.add('active');
        loadTravelerMessages();
    }
    if (tab === 'vouchers') {
        document.getElementById('travelerTabVouchers').classList.add('active');
        loadTravelerVouchers();
    }
    if (tab === 'notifications') {
        document.getElementById('travelerTabNotifications').classList.add('active');
        loadNotifications();
    }
}

async function loadListings() {
    try {
        const res = await fetch('/api/listings?status=APPROVED');
        const data = await res.json();
        if (data.success) {
            allListings = data.listings;
            filterListings();
            document.getElementById('listingsCountBadge').textContent = allListings.length;
        }
    } catch (err) {
        console.error('Error loading listings:', err);
    }
}

function filterCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.st-btn, .fp-btn').forEach(b => {
        if (b.textContent.includes(cat) || (cat === 'ALL' && b.textContent.includes('All'))) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
    filterListings();
}

function quickFilterCity(cityName) {
    document.getElementById('searchInput').value = cityName;
    filterListings();
    document.getElementById('travelerTabListings').scrollIntoView({ behavior: 'smooth' });
}

function filterListings() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const sort = document.getElementById('sortSelect').value;

    let filtered = allListings.filter(item => {
        const matchesCategory = (currentCategory === 'ALL' || item.type === currentCategory);
        const matchesSearch = !search ||
            item.title.toLowerCase().includes(search) ||
            item.location.toLowerCase().includes(search) ||
            item.destination.toLowerCase().includes(search) ||
            item.origin.toLowerCase().includes(search) ||
            item.features.toLowerCase().includes(search);
        return matchesCategory && matchesSearch;
    });

    // Sorting
    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
    else if (sort === 'featured') filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    renderListings(filtered);
}

function renderListings(items) {
    const t = (typeof translations !== 'undefined' && translations[currentLanguage]) ? translations[currentLanguage] : {};
    const container = document.getElementById('listingsContainer');
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;">
                <h3>${t.noListings || '🔍 No travel listings found'}</h3>
                <p style="color: #64748b; margin-top: 0.5rem;">${t.noListingsSub || 'Try adjusting your destination search or selecting "All Deals".'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map(item => {
        const typeEmoji = item.type === 'FLIGHT' ? '✈️ FLIGHT' : (item.type === 'CAR_RENTAL' ? '🚗 CAR RENTAL' : '🏨 LUXURY STAY');
        const unitLabel = item.type === 'FLIGHT' ? (t.unitFlight || '/ passenger') : (item.type === 'CAR_RENTAL' ? (t.unitCar || '/ day') : (t.unitHotel || '/ night'));
        const features = item.features ? item.features.split(',').map(f => `<span class="feat-tag">${f.trim()}</span>`).join('') : '';

        return `
            <div class="listing-card">
                <div class="card-image-box">
                    <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" onerror="this.src='/assets/images/swiss_alps.jpg'">
                    <span class="card-badge">${typeEmoji}</span>
                    <span class="card-rating">★ ${item.rating.toFixed(1)}</span>
                </div>
                <div class="card-body">
                    <span class="card-location">📍 ${escapeHtml(item.location)}</span>
                    <h4 class="card-title">${escapeHtml(item.title)}</h4>
                    <p class="card-desc">${escapeHtml(item.description)}</p>
                    <div class="card-features">${features}</div>
                    <div class="card-footer">
                        <div class="card-price-box">
                            <span class="price-sub">${t.startingFrom || 'Starting from'}</span>
                            <span class="price-val">₹${item.price.toLocaleString('en-IN')} <span style="font-size:0.75rem;font-weight:600;color:#64748b">${unitLabel}</span></span>
                        </div>
                        <button class="btn btn-primary" onclick="openBookingModal('${item.id}')">${t.bookNow || 'Book Now'}</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ----------------------------------------------------
// BOOKING WORKFLOW
// ----------------------------------------------------
function openBookingModal(listingId) {
    const listing = allListings.find(l => l.id === listingId);
    if (!listing) return;
    activeSelectedListing = listing;
    appliedDiscountPercent = 0;
    appliedVoucherDiscount = 0;
    appliedVoucherObj = null;
    flightHasReturnTicket = false; // DEFAULT IS STRICTLY ONE WAY TICKET

    document.getElementById('bmListingId').value = listing.id;
    document.getElementById('bmListingTitle').textContent = `Book ${listing.type}: ${listing.title}`;
    document.getElementById('bmTitle').textContent = listing.title;
    document.getElementById('bmLocation').textContent = `📍 ${listing.location}`;
    document.getElementById('bmImage').src = listing.imageUrl;
    document.getElementById('bmTypeBadge').textContent = listing.type;
    document.getElementById('bmPriceDisplay').textContent = `₹${listing.price.toLocaleString('en-IN')}`;

    const isCarRental = listing.type === 'CAR_RENTAL';
    const isFlight = listing.type === 'FLIGHT';

    const unitDesc = isFlight ? '/ passenger' : (isCarRental ? '/ rental day' : '/ night');
    document.getElementById('bmUnitDesc').textContent = unitDesc;

    const unitsLabel = isFlight ? 'Number of Passengers *' : (isCarRental ? 'Rental Duration (Days) *' : 'Rooms / Guests *');
    document.getElementById('bmUnitsLabel').textContent = unitsLabel;

    // Flight Specific Options (Default One Way)
    const flightOptionsWrap = document.getElementById('bmFlightOptionsWrap');
    if (flightOptionsWrap) {
        flightOptionsWrap.style.display = isFlight ? 'block' : 'none';
        if (isFlight) {
            document.getElementById('bmReturnAddRate').textContent = `₹${listing.price.toLocaleString('en-IN')}`;
            document.getElementById('btnFlightOneWay').classList.add('active');
            document.getElementById('btnFlightRoundTrip').classList.remove('active');
            document.getElementById('bmAddReturnCheckbox').checked = false;
            const badge = document.getElementById('bmReturnTicketStatusBadge');
            if (badge) {
                badge.textContent = 'One Way Selected';
                badge.style.background = '#e2e8f0';
                badge.style.color = '#64748b';
            }
            const notice = document.getElementById('bmReturnNotice');
            if (notice) notice.style.display = 'none';
        }
    }

    // Toggle Car Rental specific fields (Pickup Location & Vehicle Type)
    const carFields = document.getElementById('bmCarRentalFields');
    if (carFields) {
        carFields.style.display = isCarRental ? 'block' : 'none';
        if (isCarRental) {
            const locInput = document.getElementById('bmPickupLocation');
            if (locInput) locInput.value = listing.location || 'Airport Terminal / City Pickup Hub';
        }
    }

    // Dynamic Date Setup
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const dStr = d.toISOString().split('T')[0];
    document.getElementById('bmTravelDate').value = dStr;
    document.getElementById('bmTravelDate').min = new Date().toISOString().split('T')[0];

    const d2 = new Date();
    d2.setDate(d2.getDate() + 9);
    const d2Str = d2.toISOString().split('T')[0];
    document.getElementById('bmReturnDate').value = d2Str;
    document.getElementById('bmReturnDate').min = dStr;

    const travelDateLabel = document.getElementById('bmTravelDateLabel');
    const returnDateLabel = document.getElementById('bmReturnDateLabel');
    const returnDateGroup = document.getElementById('bmReturnDateGroup');
    const returnDateInput = document.getElementById('bmReturnDate');

    if (isFlight) {
        if (travelDateLabel) travelDateLabel.textContent = 'Departure Date *';
        if (returnDateLabel) returnDateLabel.textContent = 'Return Flight Date *';
        // DEFAULT: Return Date group is HIDDEN for One Way Flight!
        if (returnDateGroup) returnDateGroup.style.display = 'none';
        if (returnDateInput) {
            returnDateInput.required = false;
            returnDateInput.value = '';
        }
    } else if (isCarRental) {
        if (travelDateLabel) travelDateLabel.textContent = 'Pickup Date *';
        if (returnDateLabel) returnDateLabel.textContent = 'Return Date *';
        if (returnDateGroup) returnDateGroup.style.display = 'block';
        if (returnDateInput) returnDateInput.required = true;
    } else {
        // Hotel
        if (travelDateLabel) travelDateLabel.textContent = 'Check-In Date *';
        if (returnDateLabel) returnDateLabel.textContent = 'Check-Out Date *';
        if (returnDateGroup) returnDateGroup.style.display = 'block';
        if (returnDateInput) returnDateInput.required = true;
    }

    // Passenger / Traveler Information Setup
    const passWrap = document.getElementById('bmPassengerDetailsWrap');
    const nameInput = document.getElementById('bmTravelerName');
    const ageInput = document.getElementById('bmTravelerAge');
    const phoneInput = document.getElementById('bmTravelerPhone');
    const reqBadge = document.getElementById('bmPassengerRequiredBadge');

    if (nameInput) {
        nameInput.value = (currentUser && currentUser.name) ? currentUser.name : '';
        nameInput.style.borderColor = '#cbd5e1';
    }
    if (ageInput) {
        ageInput.value = '';
        ageInput.style.borderColor = '#cbd5e1';
    }
    if (phoneInput) {
        let defaultPhone = '';
        if (currentUser && currentUser.phone) {
            defaultPhone = currentUser.phone.replace(/\D/g, '').slice(-10);
        }
        phoneInput.value = defaultPhone;
        phoneInput.style.borderColor = '#cbd5e1';
    }

    if (passWrap) {
        if (isFlight) {
            passWrap.style.background = '#f0f9ff';
            passWrap.style.border = '1.5px solid #38bdf8';
            if (reqBadge) {
                reqBadge.textContent = 'Mandatory for Flight Ticket & Boarding Pass';
                reqBadge.style.background = '#e0f2fe';
                reqBadge.style.color = '#0284c7';
            }
        } else {
            passWrap.style.background = '#f8fafc';
            passWrap.style.border = '1.5px solid #cbd5e1';
            if (reqBadge) {
                reqBadge.textContent = 'Primary Contact Details';
                reqBadge.style.background = '#f1f5f9';
                reqBadge.style.color = '#475569';
            }
        }
    }

    // Reset inputs
    document.getElementById('bmUnits').value = 1;
    document.getElementById('bmSpecialReq').value = '';
    document.getElementById('bmPromoCode').value = '';
    document.getElementById('bmDiscountRow').style.display = 'none';

    calculateBookingTotal();
    openModal('bookingModal');
}

function selectFlightJourneyType(isRoundTrip) {
    if (!activeSelectedListing || activeSelectedListing.type !== 'FLIGHT') return;

    flightHasReturnTicket = !!isRoundTrip;

    const btnOneWay = document.getElementById('btnFlightOneWay');
    const btnRound = document.getElementById('btnFlightRoundTrip');
    const chkReturn = document.getElementById('bmAddReturnCheckbox');
    const returnBadge = document.getElementById('bmReturnTicketStatusBadge');
    const returnNotice = document.getElementById('bmReturnNotice');
    const returnDateGroup = document.getElementById('bmReturnDateGroup');
    const returnDateInput = document.getElementById('bmReturnDate');
    const returnDateLabel = document.getElementById('bmReturnDateLabel');

    if (flightHasReturnTicket) {
        if (btnOneWay) btnOneWay.classList.remove('active');
        if (btnRound) btnRound.classList.add('active');
        if (chkReturn) chkReturn.checked = true;
        if (returnBadge) {
            returnBadge.textContent = '✅ Return Added';
            returnBadge.style.background = '#dbeafe';
            returnBadge.style.color = '#1d4ed8';
        }
        if (returnNotice) returnNotice.style.display = 'block';
        if (returnDateGroup) returnDateGroup.style.display = 'block';
        if (returnDateLabel) returnDateLabel.innerHTML = 'Return Flight Date <span style="color:#ef4444;font-weight:700;">* (Mandatory)</span>';
        if (returnDateInput) {
            returnDateInput.required = true;
            if (!returnDateInput.value) {
                const depVal = document.getElementById('bmTravelDate').value;
                if (depVal) {
                    const retD = new Date(depVal);
                    retD.setDate(retD.getDate() + 4);
                    returnDateInput.value = retD.toISOString().split('T')[0];
                }
            }
            returnDateInput.min = document.getElementById('bmTravelDate').value;
        }
        showToast('Return Ticket added! Return flight fare added to total price.', 'info');
    } else {
        if (btnOneWay) btnOneWay.classList.add('active');
        if (btnRound) btnRound.classList.remove('active');
        if (chkReturn) chkReturn.checked = false;
        if (returnBadge) {
            returnBadge.textContent = 'One Way Selected';
            returnBadge.style.background = '#e2e8f0';
            returnBadge.style.color = '#64748b';
        }
        if (returnNotice) returnNotice.style.display = 'none';
        if (returnDateGroup) returnDateGroup.style.display = 'none';
        if (returnDateInput) {
            returnDateInput.required = false;
            returnDateInput.value = '';
        }
        showToast('One Way Flight selected. Return fare removed from total.', 'info');
    }

    calculateBookingTotal();
}

function onBookingTravelDateChange() {
    const depVal = document.getElementById('bmTravelDate').value;
    const retInput = document.getElementById('bmReturnDate');
    if (retInput && depVal) {
        retInput.min = depVal;
        if (retInput.value && retInput.value < depVal) {
            retInput.value = depVal;
        }
    }
}

let appliedVoucherDiscount = 0;
let appliedVoucherObj = null;

async function applyPromo() {
    const code = document.getElementById('bmPromoCode').value.trim().toUpperCase();
    if (!code) {
        showToast('Please enter a voucher code', 'error');
        return;
    }

    if (!activeSelectedListing) return;
    const units = parseInt(document.getElementById('bmUnits').value) || 1;
    let base = units * activeSelectedListing.price;
    if (activeSelectedListing.type === 'FLIGHT' && flightHasReturnTicket) {
        base += (units * activeSelectedListing.price);
    }

    try {
        const res = await fetch('/api/vouchers/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, amount: base, finalize: false })
        });
        const data = await res.json();
        if (data.success) {
            appliedVoucherObj = data;
            appliedVoucherDiscount = data.discountAmount;
            appliedDiscountPercent = 0;
            showToast(`Voucher ${code} applied! Saved ₹${Math.round(data.discountAmount).toLocaleString('en-IN')}`, 'success');
        } else {
            // Local fallback check
            if (code === 'SHIV20' || code === 'VOYAGE20' || code === 'SHIV35' || code === 'VOYAGE35') {
                appliedDiscountPercent = (code.includes('35') ? 0.35 : 0.20);
                appliedVoucherDiscount = base * appliedDiscountPercent;
                appliedVoucherObj = { code: code };
                showToast(`Promo Code Applied! ${appliedDiscountPercent * 100}% Discount Added!`, 'success');
            } else if (code === 'NITIN2026') {
                appliedVoucherDiscount = Math.min(500, base);
                appliedDiscountPercent = 0;
                appliedVoucherObj = { code: 'NITIN2026' };
                showToast('Voucher NITIN2026 Applied! Flat ₹500 Discount!', 'success');
            } else {
                appliedDiscountPercent = 0;
                appliedVoucherDiscount = 0;
                appliedVoucherObj = null;
                showToast(data.message || 'Invalid voucher code.', 'error');
            }
        }
    } catch (err) {
        if (code === 'NITIN2026') {
            appliedVoucherDiscount = Math.min(500, base);
            appliedDiscountPercent = 0;
            appliedVoucherObj = { code: 'NITIN2026' };
            showToast('Voucher NITIN2026 Applied! Flat ₹500 Discount!', 'success');
        } else if (code === 'SHIV20' || code === 'VOYAGE20') {
            appliedDiscountPercent = 0.20;
            appliedVoucherDiscount = base * 0.20;
            appliedVoucherObj = { code: code };
            showToast('Promo Code Applied! 20% Discount!', 'success');
        } else {
            showToast('Invalid or expired voucher code', 'error');
        }
    }
    calculateBookingTotal();
}

function calculateBookingTotal() {
    if (!activeSelectedListing) return;
    const units = parseInt(document.getElementById('bmUnits').value) || 1;
    const unitPrice = activeSelectedListing.price;
    const isFlight = activeSelectedListing.type === 'FLIGHT';

    let base = 0;
    const oneWayRow = document.getElementById('bmOneWayFareRow');
    const returnRow = document.getElementById('bmReturnFareRow');
    const subtotalRow = document.getElementById('bmSubtotalRow');
    const baseRow = document.getElementById('bmBaseFareRow');
    const journeyTypeRow = document.getElementById('bmFlightJourneyTypeRow');
    const journeyTypeSummary = document.getElementById('bmJourneyTypeSummary');

    if (isFlight) {
        const oneWayFare = units * unitPrice;
        let returnFare = 0;

        if (flightHasReturnTicket) {
            returnFare = units * unitPrice;
            base = oneWayFare + returnFare;

            if (journeyTypeRow) journeyTypeRow.style.display = 'flex';
            if (journeyTypeSummary) journeyTypeSummary.innerHTML = '🔄 <strong>Round Trip</strong> (One Way + Return Flight Ticket)';

            if (oneWayRow) {
                oneWayRow.style.display = 'flex';
                document.getElementById('bmOneWayFareLabel').textContent = `One Way Flight Fare (${units} ${units > 1 ? 'passengers' : 'passenger'}):`;
                document.getElementById('bmCalcOneWay').textContent = `₹${oneWayFare.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            }

            if (returnRow) {
                returnRow.style.display = 'flex';
                document.getElementById('bmReturnFareLabel').textContent = `🔄 Return Flight Ticket (${units} ${units > 1 ? 'passengers' : 'passenger'}):`;
                document.getElementById('bmCalcReturn').textContent = `+₹${returnFare.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            }

            if (subtotalRow) {
                subtotalRow.style.display = 'flex';
                document.getElementById('bmCalcSubtotal').textContent = `₹${base.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            }

            if (baseRow) baseRow.style.display = 'none';
        } else {
            // STRICTLY ONE WAY FLIGHT (Default)
            base = oneWayFare;

            if (journeyTypeRow) journeyTypeRow.style.display = 'flex';
            if (journeyTypeSummary) journeyTypeSummary.innerHTML = '➡️ <strong>One-Way Flight</strong> (Normal Fare)';

            if (oneWayRow) {
                oneWayRow.style.display = 'flex';
                document.getElementById('bmOneWayFareLabel').textContent = `One Way Flight Fare (${units} ${units > 1 ? 'passengers' : 'passenger'}):`;
                document.getElementById('bmCalcOneWay').textContent = `₹${oneWayFare.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            }

            if (returnRow) returnRow.style.display = 'none';
            if (subtotalRow) subtotalRow.style.display = 'none';
            if (baseRow) baseRow.style.display = 'none';
        }
    } else {
        // Hotel or Car Rental
        base = units * unitPrice;
        if (journeyTypeRow) journeyTypeRow.style.display = 'none';
        if (oneWayRow) oneWayRow.style.display = 'none';
        if (returnRow) returnRow.style.display = 'none';
        if (subtotalRow) subtotalRow.style.display = 'none';
        if (baseRow) {
            baseRow.style.display = 'flex';
            document.getElementById('bmBaseFareLabel').textContent = 'Base Rate:';
            document.getElementById('bmCalcBase').textContent = `₹${base.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        }
    }

    let discount = 0;
    if (appliedVoucherDiscount > 0) {
        discount = Math.min(appliedVoucherDiscount, base);
    } else if (appliedDiscountPercent > 0) {
        discount = base * appliedDiscountPercent;
    }

    const discountedBase = Math.max(0, base - discount);
    const tax = discountedBase * 0.05; // 5% GST
    const total = discountedBase + tax;

    if (discount > 0) {
        document.getElementById('bmDiscountRow').style.display = 'flex';
        const labelText = appliedVoucherObj ? `Voucher (${appliedVoucherObj.code}):` : `Promo Discount:`;
        const firstSpan = document.querySelector('#bmDiscountRow span:first-child');
        if (firstSpan) firstSpan.textContent = labelText;
        document.getElementById('bmCalcDiscount').textContent = `-₹${discount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    } else {
        document.getElementById('bmDiscountRow').style.display = 'none';
    }

    document.getElementById('bmCalcTax').textContent = `₹${tax.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    document.getElementById('bmCalcTotal').textContent = `₹${total.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

async function submitBooking(event) {
    event.preventDefault();
    if (!activeSelectedListing) return;

    const listingId = document.getElementById('bmListingId').value;
    const travelDate = document.getElementById('bmTravelDate').value;
    const returnDate = document.getElementById('bmReturnDate').value;
    const units = parseInt(document.getElementById('bmUnits').value) || 1;
    let specialRequests = document.getElementById('bmSpecialReq').value.trim();
    const paymentMethod = document.getElementById('bmPaymentMethod').value;

    const isFlight = activeSelectedListing.type === 'FLIGHT';
    const isCarRental = activeSelectedListing.type === 'CAR_RENTAL';

    // Passenger / Traveler Fields Extraction & Validation
    const nameInput = document.getElementById('bmTravelerName');
    const ageInput = document.getElementById('bmTravelerAge');
    const phoneInput = document.getElementById('bmTravelerPhone');

    let travelerName = nameInput ? nameInput.value.trim() : '';
    let travelerAgeStr = ageInput ? ageInput.value.trim() : '';
    let travelerAge = parseInt(travelerAgeStr, 10);
    let travelerPhoneRaw = phoneInput ? phoneInput.value.trim() : '';

    if (nameInput) nameInput.style.borderColor = '#cbd5e1';
    if (ageInput) ageInput.style.borderColor = '#cbd5e1';
    if (phoneInput) phoneInput.style.borderColor = '#cbd5e1';

    // Clean Indian mobile number (extract 10 digits)
    let cleanPhoneDigits = travelerPhoneRaw.replace(/\D/g, '');
    if (cleanPhoneDigits.startsWith('91') && cleanPhoneDigits.length === 12) {
        cleanPhoneDigits = cleanPhoneDigits.substring(2);
    }

    if (isFlight) {
        // Requirement 1 & 2: Mandatory validation for flight tickets & return tickets
        if (!travelerName || travelerName.length === 0) {
            showToast('Full Name is required for flight booking!', 'error');
            if (nameInput) {
                nameInput.focus();
                nameInput.style.borderColor = '#ef4444';
            }
            return;
        }

        if (!travelerAgeStr || isNaN(travelerAge) || travelerAge <= 0) {
            showToast('Age is required and must be a valid positive number!', 'error');
            if (ageInput) {
                ageInput.focus();
                ageInput.style.borderColor = '#ef4444';
            }
            return;
        }

        if (cleanPhoneDigits.length !== 10 || !/^[0-9]{10}$/.test(cleanPhoneDigits)) {
            showToast('Mobile Number must contain exactly 10 digits for Indian mobile numbers!', 'error');
            if (phoneInput) {
                phoneInput.focus();
                phoneInput.style.borderColor = '#ef4444';
            }
            return;
        }
    } else {
        if (!travelerName && currentUser && currentUser.name) {
            travelerName = currentUser.name;
        }
    }

    // Strict validation for Flight Return Ticket
    if (isFlight && flightHasReturnTicket) {
        if (!returnDate || returnDate.trim() === '') {
            showToast('Return Flight Date is mandatory when Return Ticket is selected! Please pick a Return Date.', 'error');
            const retEl = document.getElementById('bmReturnDate');
            if (retEl) {
                retEl.focus();
                retEl.style.borderColor = '#ef4444';
            }
            return;
        }
        if (returnDate < travelDate) {
            showToast('Return Flight Date cannot be earlier than Departure Date!', 'error');
            return;
        }
    }

    const pickupLocation = isCarRental ? (document.getElementById('bmPickupLocation')?.value.trim() || activeSelectedListing.location) : '';
    const vehicleType = isCarRental ? (document.getElementById('bmVehicleType')?.value || 'SUV / 4x4') : '';

    if (isFlight) {
        const journeyNote = flightHasReturnTicket ? '[Round-Trip Flight: Includes Return Ticket]' : '[One-Way Flight Ticket]';
        specialRequests = specialRequests ? `${journeyNote} | ${specialRequests}` : journeyNote;
    }

    const finalPhone = cleanPhoneDigits.length === 10 ? cleanPhoneDigits : (travelerPhoneRaw || currentUser.phone || '');

    const payload = {
        travelerId: currentUser.id,
        travelerName: travelerName || currentUser.name,
        travelerAge: (!isNaN(travelerAge) && travelerAge > 0) ? travelerAge : 0,
        travelerEmail: currentUser.email,
        travelerPhone: finalPhone,
        listingId: listingId,
        travelDate: travelDate,
        returnDate: isFlight ? (flightHasReturnTicket ? returnDate : '') : returnDate,
        hasReturnTicket: isFlight && flightHasReturnTicket,
        units: units,
        pickupLocation: pickupLocation,
        vehicleType: vehicleType,
        specialRequests: specialRequests,
        paymentMethod: paymentMethod
    };

    try {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModal('bookingModal');
            showToast('Booking successfully confirmed!', 'success');
            
            // Show printable receipt ticket with full itemized breakdown
            displayBookingReceipt(data.booking);
            
            // Generate automatic booking confirmation notification
            try {
                const notifTitle = isFlight && flightHasReturnTicket
                    ? `🎟️ Round-Trip Flight Confirmed: ${data.booking.listingTitle}`
                    : `🎟️ Booking Confirmed: ${data.booking.listingTitle}`;
                const notifMsg = isFlight && flightHasReturnTicket
                    ? `Your Round-Trip Flight booking (#${data.booking.id}) for ${data.booking.units} pax (Departure: ${data.booking.travelDate}, Return: ${data.booking.returnDate}) is confirmed with Return Ticket included!`
                    : `Your booking (#${data.booking.id}) for ${data.booking.units} pax on ${data.booking.travelDate} has been confirmed. E-ticket ready!`;

                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: notifTitle,
                        message: notifMsg,
                        category: 'BOOKING',
                        senderRole: 'SYSTEM',
                        senderName: 'SHIV Travels Reservations',
                        targetAudience: 'ALL_TRAVELERS'
                    })
                });
            } catch (ne) {
                console.error('Notification creation error:', ne);
            }

            // Reload bookings & stats
            await loadTravelerBookings();
            await loadAdminBookings();
            await loadNotifications();
            await loadStats();
        } else {
            showToast(data.message || 'Error creating booking', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server communication error', 'error');
    }
}

function displayBookingReceipt(b) {
    if (!b) return;
    document.getElementById('rcBookingId').textContent = b.id;
    document.getElementById('rcBookingDate').textContent = b.bookingDate || new Date().toISOString().split('T')[0];
    document.getElementById('rcPaymentStatus').textContent = `PAID (${b.paymentMethod || 'SIMULATED'})`;
    document.getElementById('rcTravelerName').textContent = b.travelerName || 'Traveler';
    const rcAgeEl = document.getElementById('rcTravelerAge');
    if (rcAgeEl) {
        rcAgeEl.textContent = (b.travelerAge && b.travelerAge > 0) ? `${b.travelerAge} Yrs` : 'N/A';
    }
    document.getElementById('rcTravelerEmail').textContent = b.travelerEmail || '';
    let displayPhone = b.travelerPhone || '+91 98444 55667';
    if (/^[0-9]{10}$/.test(displayPhone)) {
        displayPhone = '+91 ' + displayPhone;
    }
    document.getElementById('rcTravelerPhone').textContent = displayPhone;
    document.getElementById('rcListingTitle').textContent = b.listingTitle;
    
    const isFlight = (b.listingType === 'FLIGHT');
    const isCarRental = (b.listingType === 'CAR_RENTAL');
    const hasReturn = isFlight && (b.hasReturnTicket === true || (b.returnDate && b.returnDate.trim() !== '') || (b.specialRequests && b.specialRequests.includes('Return Ticket')));
    const units = parseInt(b.units) || 1;

    let desc = `${b.destination || ''} | Service: ${b.listingType}`;
    if (isFlight) {
        if (hasReturn) {
            desc = `✈️ Round-Trip Flight | Departure: ${b.travelDate} ➔ Return: ${b.returnDate} (Return Ticket Included)`;
        } else {
            desc = `✈️ One-Way Flight | Departure: ${b.travelDate} (One Way Journey)`;
        }
    } else {
        desc += ` | Travel Date: ${b.travelDate}`;
        if (b.returnDate) desc += ` ➔ Return/Check-Out: ${b.returnDate}`;
        if (b.pickupLocation) desc += ` | Pickup: ${b.pickupLocation}`;
        if (b.vehicleType) desc += ` | Vehicle: ${b.vehicleType}`;
    }
    document.getElementById('rcListingDesc').textContent = desc;

    // Unit badge
    const rcUnitsEl = document.getElementById('rcUnits');
    if (rcUnitsEl) {
        if (isFlight) {
            rcUnitsEl.textContent = `${units} ${units > 1 ? 'Passengers' : 'Passenger'}`;
        } else if (isCarRental) {
            rcUnitsEl.textContent = `${units} ${units > 1 ? 'Vehicles / Days' : 'Vehicle / Day'}`;
        } else {
            rcUnitsEl.textContent = `${units} ${units > 1 ? 'Guests / Rooms' : 'Guest / Room'}`;
        }
    }

    // Precise Fare Calculations for Receipt / Invoice:
    // If Return Ticket selected:
    // One Way Ticket = ₹5,000
    // Return Ticket = ₹5,000
    // Ticket Subtotal = ₹10,000
    // GST/Tax = ₹10,000 के subtotal पर calculate हो (5% = ₹500)
    // Final Grand Total = Ticket Subtotal + GST/Tax (₹10,500)
    // If Return Ticket NOT selected:
    // One Way Ticket = ₹5,000
    // Return Ticket = Hidden / ₹0
    // Ticket Subtotal = ₹5,000
    // GST/Tax = 5% = ₹250
    // Final Grand Total = ₹5,250
    let unitRate = b.pricePerUnit;
    if (!unitRate || unitRate <= 0) {
        if (isFlight && hasReturn) {
            unitRate = (b.totalPrice ? (b.totalPrice / 1.05) / (2 * units) : 0);
        } else {
            unitRate = (b.totalPrice ? (b.totalPrice / 1.05) / units : 0);
        }
    }

    const oneWayAmount = (b.oneWayFare && b.oneWayFare > 0) ? b.oneWayFare : (units * unitRate);
    const returnAmount = hasReturn ? ((b.returnFare && b.returnFare > 0) ? b.returnFare : (units * unitRate)) : 0;
    const subtotal = (b.subtotal && b.subtotal > 0) ? b.subtotal : (hasReturn ? (oneWayAmount + returnAmount) : oneWayAmount);
    const taxAmount = (b.taxAmount && b.taxAmount > 0) ? b.taxAmount : (subtotal * 0.05);
    const grandTotal = (b.totalPrice && b.totalPrice > 0) ? b.totalPrice : (subtotal + taxAmount);

    const oneWayRow = document.getElementById('rcOneWayFareRow');
    const oneWayLabel = document.getElementById('rcOneWayFareLabel');
    const oneWayAmountEl = document.getElementById('rcOneWayFareAmount');
    const returnRow = document.getElementById('rcReturnFareRow');
    const returnLabel = document.getElementById('rcReturnFareLabel');
    const returnAmountEl = document.getElementById('rcReturnFareAmount');
    const subtotalRow = document.getElementById('rcSubtotalRow');
    const subtotalLabel = document.getElementById('rcSubtotalLabel');
    const subtotalAmountEl = document.getElementById('rcSubtotalAmount');
    const taxEl = document.getElementById('rcTax');
    const totalEl = document.getElementById('rcTotal');

    if (isFlight) {
        if (oneWayRow) oneWayRow.style.display = 'flex';
        if (oneWayLabel) oneWayLabel.textContent = `✈️ One Way Flight Fare (${units} ${units > 1 ? 'Pax' : 'Pax'}):`;
        if (oneWayAmountEl) oneWayAmountEl.textContent = `₹${oneWayAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

        if (hasReturn) {
            if (returnRow) returnRow.style.display = 'flex';
            if (returnLabel) returnLabel.textContent = `🔄 Return Flight Ticket (${units} ${units > 1 ? 'Pax' : 'Pax'}):`;
            if (returnAmountEl) returnAmountEl.textContent = `+₹${returnAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            if (subtotalRow) subtotalRow.style.display = 'flex';
            if (subtotalLabel) subtotalLabel.textContent = 'Ticket Subtotal (One Way + Return):';
            if (subtotalAmountEl) subtotalAmountEl.textContent = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        } else {
            if (returnRow) returnRow.style.display = 'none';
            if (subtotalRow) subtotalRow.style.display = 'flex';
            if (subtotalLabel) subtotalLabel.textContent = 'Ticket Subtotal (One Way):';
            if (subtotalAmountEl) subtotalAmountEl.textContent = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        }
    } else {
        if (oneWayRow) oneWayRow.style.display = 'flex';
        if (oneWayLabel) oneWayLabel.textContent = isCarRental ? `🚗 Vehicle Rental Fare (${units} Days/Vehicles):` : `🏨 Hotel Stay Base Rate (${units} Rooms/Nights):`;
        if (oneWayAmountEl) oneWayAmountEl.textContent = `₹${oneWayAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        if (returnRow) returnRow.style.display = 'none';
        if (subtotalRow) subtotalRow.style.display = 'flex';
        if (subtotalLabel) subtotalLabel.textContent = 'Service Subtotal:';
        if (subtotalAmountEl) subtotalAmountEl.textContent = `₹${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    }

    if (taxEl) taxEl.textContent = `₹${taxAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    if (totalEl) totalEl.textContent = `₹${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    openModal('receiptModal');
}

// ----------------------------------------------------
// TRAVELER BOOKINGS & ITINERARIES
// ----------------------------------------------------
let allTravelerBookings = [];
let currentTravelerBookingFilter = 'ALL';

async function loadTravelerBookings() {
    try {
        const res = await fetch(`/api/bookings?travelerId=${currentUser.id}`);
        const data = await res.json();
        if (data.success) {
            allTravelerBookings = data.bookings || [];

            // Sort reverse chronologically (latest bookings at top)
            allTravelerBookings.sort((a, b) => {
                const timeA = new Date(a.bookingDate).getTime();
                const timeB = new Date(b.bookingDate).getTime();
                if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
                const numA = parseInt((a.id || '').replace(/\D/g, '')) || 0;
                const numB = parseInt((b.id || '').replace(/\D/g, '')) || 0;
                return numB - numA;
            });

            const confirmedCount = allTravelerBookings.filter(b => b.status === 'CONFIRMED').length;
            const pendingCount = allTravelerBookings.filter(b => b.status === 'PENDING').length;
            const cancelledCount = allTravelerBookings.filter(b => b.status === 'CANCELLED').length;

            if (document.getElementById('myBookingsCount')) document.getElementById('myBookingsCount').textContent = allTravelerBookings.length;
            if (document.getElementById('trvBkgCountAll')) document.getElementById('trvBkgCountAll').textContent = allTravelerBookings.length;
            if (document.getElementById('trvBkgCountConfirmed')) document.getElementById('trvBkgCountConfirmed').textContent = confirmedCount;
            if (document.getElementById('trvBkgCountPending')) document.getElementById('trvBkgCountPending').textContent = pendingCount;
            if (document.getElementById('trvBkgCountCancelled')) document.getElementById('trvBkgCountCancelled').textContent = cancelledCount;

            renderTravelerBookings();
        }
    } catch (err) {
        console.error(err);
    }
}

function filterTravelerBookings(filter) {
    currentTravelerBookingFilter = filter || 'ALL';
    ['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].forEach(st => {
        const btn = document.getElementById(`trv-bkg-filter-${st}`);
        if (btn) {
            if (st === currentTravelerBookingFilter) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderTravelerBookings();
}

function renderTravelerBookings() {
    const tbody = document.getElementById('myBookingsBody');
    if (!tbody) return;

    let filtered = allTravelerBookings;
    if (currentTravelerBookingFilter && currentTravelerBookingFilter !== 'ALL') {
        filtered = allTravelerBookings.filter(b => b.status === currentTravelerBookingFilter);
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2.5rem;color:#64748b;">
            <div style="font-size:2rem;margin-bottom:0.4rem;">🎟️</div>
            <strong>No bookings found under filter: "${currentTravelerBookingFilter}"</strong>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => {
        let statusBadge = '';
        if (b.status === 'CONFIRMED') {
            statusBadge = '<span class="badge badge-approved" style="background:#dcfce7;color:#15803d;font-weight:700;">✅ CONFIRMED</span>';
        } else if (b.status === 'PENDING') {
            statusBadge = '<span class="badge badge-pending" style="background:#fef3c7;color:#b45309;font-weight:700;border:1px solid #f59e0b;">⏳ PENDING</span>';
        } else if (b.status === 'CANCELLED') {
            statusBadge = '<span class="badge badge-rejected" style="background:#fee2e2;color:#b91c1c;font-weight:700;">❌ CANCELLED</span>';
        } else {
            statusBadge = `<span class="badge">${b.status}</span>`;
        }

        let serviceDesc = `<strong>${escapeHtml(b.listingTitle)}</strong>`;
        if (b.travelerName) {
            const ageTxt = b.travelerAge ? ` (Age: ${b.travelerAge} Yrs)` : '';
            const phoneTxt = b.travelerPhone ? ` • 📱 +91 ${escapeHtml(b.travelerPhone.replace(/^(\+91|91)/, ''))}` : '';
            serviceDesc += `<br><small style="color:#0f172a;font-weight:600;display:inline-block;margin-top:2px;">👤 Passenger: <span style="color:#0284c7;">${escapeHtml(b.travelerName)}</span>${ageTxt}${phoneTxt}</small>`;
        }
        if (b.vehicleType) {
            serviceDesc += `<br><small style="color:#0284c7;font-weight:700;">🚗 Vehicle: ${escapeHtml(b.vehicleType)}</small>`;
        }

        let destDisplay = `📍 ${escapeHtml(b.destination)}`;
        if (b.pickupLocation) {
            destDisplay += `<br><small style="color:#64748b;">Pickup: ${escapeHtml(b.pickupLocation)}</small>`;
        }

        const dateRange = `${b.travelDate}${b.returnDate ? ` ➔ ${b.returnDate}` : ''}`;

        return `
            <tr>
                <td><strong>${b.id}</strong></td>
                <td>${serviceDesc}</td>
                <td><span class="badge" style="background:#e0f2fe;color:#0284c7">${b.listingType}</span></td>
                <td>${destDisplay}</td>
                <td>📅 ${dateRange}</td>
                <td>${b.units}</td>
                <td><strong>₹${(b.totalPrice || 0).toLocaleString('en-IN')}</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick='displayBookingReceipt(${JSON.stringify(b)})'>🎟️ Voucher</button>
                    ${b.status !== 'CANCELLED' ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

async function cancelBooking(id) {
    if (!confirm(`Are you sure you want to cancel booking ${id}?`)) return;
    try {
        const res = await fetch('/api/bookings/cancel', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadTravelerBookings();
            await loadAdminBookings();
            await loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadItineraries() {
    try {
        const res = await fetch(`/api/itineraries?travelerId=${currentUser.id}`);
        const data = await res.json();
        if (data.success) {
            const list = data.itineraries;
            document.getElementById('itineraryCount').textContent = list.length;
            const container = document.getElementById('itinerariesContainer');

            if (list.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <h4>No itineraries planned yet</h4>
                        <p style="color: #64748b; margin-top: 0.5rem;">Click '+ Create New Itinerary' to build a custom travel plan!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = list.map(it => `
                <div class="itinerary-card">
                    <div class="itn-header">
                        <div>
                            <h4>${escapeHtml(it.tripTitle)}</h4>
                            <span class="itn-dates">📍 ${escapeHtml(it.destination)} | 📅 ${it.startDate} to ${it.endDate}</span>
                        </div>
                        <span class="badge badge-approved">${it.status}</span>
                    </div>
                    <div class="itn-plan">
                        <strong>Daily Schedule:</strong><br>
                        ${escapeHtml(it.planDetails)}
                    </div>
                    <div class="itn-footer">
                        <div>
                            Budget: <strong>₹${it.estimatedBudget.toLocaleString('en-IN')}</strong>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteItinerary('${it.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

function openNewItineraryModal() {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    document.getElementById('itStartDate').value = d.toISOString().split('T')[0];
    const d2 = new Date();
    d2.setDate(d2.getDate() + 16);
    document.getElementById('itEndDate').value = d2.toISOString().split('T')[0];
    openModal('itineraryModal');
}

async function submitItinerary(event) {
    event.preventDefault();
    const payload = {
        travelerId: currentUser.id,
        travelerName: currentUser.name,
        tripTitle: document.getElementById('itTitle').value,
        destination: document.getElementById('itDestination').value,
        startDate: document.getElementById('itStartDate').value,
        endDate: document.getElementById('itEndDate').value,
        estimatedBudget: parseFloat(document.getElementById('itBudget').value) || 50000,
        totalCost: parseFloat(document.getElementById('itBudget').value) * 0.9,
        planDetails: document.getElementById('itPlan').value
    };

    try {
        const res = await fetch('/api/itineraries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModal('itineraryModal');
            showToast('Itinerary planned successfully!', 'success');
            await loadItineraries();
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteItinerary(id) {
    if (!confirm('Delete this itinerary plan?')) return;
    try {
        const res = await fetch(`/api/itineraries?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadItineraries();
        }
    } catch (err) {
        console.error(err);
    }
}

// ----------------------------------------------------
// TRAVEL AGENT DASHBOARD LOGIC
// ----------------------------------------------------
let allAgentListings = [];
let currentAgentListingFilter = 'ALL';

let allAgentMessages = [];
let currentAgentMessageFilter = 'ALL';

function switchAgentTab(tab) {
    document.querySelectorAll('.agent-tabs-wrap .sc-btn').forEach(b => b.classList.remove('active'));
    const tabBtn = document.getElementById(`at-tab-${tab}`);
    if (tabBtn) tabBtn.classList.add('active');

    document.querySelectorAll('#agentSection .tab-pane').forEach(p => p.classList.remove('active'));
    if (tab === 'listings') {
        const el = document.getElementById('agentTabListings');
        if (el) el.classList.add('active');
    }
    if (tab === 'messages') {
        const el = document.getElementById('agentTabMessages');
        if (el) el.classList.add('active');
    }
    if (tab === 'bookings') {
        const el = document.getElementById('agentTabBookings');
        if (el) el.classList.add('active');
    }
    if (tab === 'broadcast') {
        const el = document.getElementById('agentTabBroadcast');
        if (el) el.classList.add('active');
    }
}

function navigateAgentStat(type, filter = 'ALL') {
    if (type === 'listings') {
        switchAgentTab('listings');
        filterAgentListings(filter || 'ALL');
        const el = document.getElementById('agentTabListings');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (filter === 'APPROVED') {
            showToast('Showing Approved & Live Travel Packages', 'info');
        } else if (filter === 'PENDING') {
            showToast('Showing Packages Awaiting Admin Approval', 'info');
        } else {
            showToast('Showing All Travel Listings', 'info');
        }
    } else if (type === 'messages') {
        switchAgentTab('messages');
        filterAgentMessages(filter || 'ALL');
        const el = document.getElementById('agentTabMessages');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (filter === 'UNREAD') {
            showToast('Showing Unread Customer Messages', 'info');
        } else {
            showToast('Showing Customer Messages Desk', 'info');
        }
    }
}

async function loadAgentData() {
    try {
        const res = await fetch('/api/listings?status=ALL');
        const data = await res.json();
        if (data.success) {
            allAgentListings = data.listings || [];
            const approved = allAgentListings.filter(l => l.status === 'APPROVED').length;
            const pending = allAgentListings.filter(l => l.status === 'PENDING').length;
            
            if (document.getElementById('agentTotalListings')) document.getElementById('agentTotalListings').textContent = allAgentListings.length;
            if (document.getElementById('agentApprovedListings')) document.getElementById('agentApprovedListings').textContent = approved;
            if (document.getElementById('agentPendingListings')) document.getElementById('agentPendingListings').textContent = pending;

            // Filter button counts
            if (document.getElementById('agtCountAll')) document.getElementById('agtCountAll').textContent = allAgentListings.length;
            if (document.getElementById('agtCountApproved')) document.getElementById('agtCountApproved').textContent = approved;
            if (document.getElementById('agtCountPending')) document.getElementById('agtCountPending').textContent = pending;

            renderAgentListings();
        }

        // Load Messages
        const msgRes = await fetch('/api/messages');
        const msgData = await msgRes.json();
        if (msgData.success) {
            allAgentMessages = msgData.messages || [];
            const unread = allAgentMessages.filter(m => m.status === 'UNREAD').length;
            const replied = allAgentMessages.filter(m => m.status === 'REPLIED').length;
            
            if (document.getElementById('agentMessagesCount')) document.getElementById('agentMessagesCount').textContent = allAgentMessages.length;
            if (document.getElementById('agentUnreadCount')) document.getElementById('agentUnreadCount').textContent = unread;

            // Filter button counts
            if (document.getElementById('agtMsgCountAll')) document.getElementById('agtMsgCountAll').textContent = allAgentMessages.length;
            if (document.getElementById('agtMsgCountUnread')) document.getElementById('agtMsgCountUnread').textContent = unread;
            if (document.getElementById('agtMsgCountReplied')) document.getElementById('agtMsgCountReplied').textContent = replied;

            renderAgentMessages();
        }

        // Load Tracker Bookings
        const bkgRes = await fetch('/api/bookings');
        const bkgData = await bkgRes.json();
        if (bkgData.success) {
            const bookings = bkgData.bookings || [];
            const tb = document.getElementById('agentTrackerTableBody');
            if (tb) {
                tb.innerHTML = bookings.map(b => `
                    <tr>
                        <td><strong>${b.id}</strong></td>
                        <td><strong>${escapeHtml(b.travelerName || '')}</strong></td>
                        <td>${escapeHtml(b.travelerEmail || '')}</td>
                        <td>${escapeHtml(b.listingTitle || '')}</td>
                        <td>📅 ${b.travelDate || ''}</td>
                        <td>${b.units || 1}</td>
                        <td><strong>₹${(b.totalPrice || 0).toLocaleString('en-IN')}</strong></td>
                        <td><span class="badge badge-approved">${b.paymentMethod || 'PAID'}</span></td>
                        <td><span class="badge ${b.status === 'CONFIRMED' ? 'badge-approved' : 'badge-rejected'}">${b.status}</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error(err);
    }
}

function filterAgentListings(status) {
    currentAgentListingFilter = status || 'ALL';
    ['ALL', 'APPROVED', 'PENDING'].forEach(st => {
        const btn = document.getElementById(`agt-list-filter-${st}`);
        if (btn) {
            if (st === currentAgentListingFilter) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderAgentListings();
}

function renderAgentListings() {
    const tbody = document.getElementById('agentListingsTableBody');
    if (!tbody) return;

    let filtered = allAgentListings;
    if (currentAgentListingFilter && currentAgentListingFilter !== 'ALL') {
        filtered = allAgentListings.filter(l => l.status === currentAgentListingFilter);
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2.5rem;color:#64748b;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">📦</div>
            <strong>No listings found with status: "${currentAgentListingFilter}"</strong>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(l => {
        const isPending = l.status === 'PENDING';
        let badge = '<span class="badge badge-pending" style="font-weight:700;animation:pulse 2s infinite;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;">⏳ PENDING</span>';
        if (l.status === 'APPROVED') badge = '<span class="badge badge-approved">✅ APPROVED & LIVE</span>';
        else if (l.status === 'REJECTED') badge = '<span class="badge badge-rejected">❌ REJECTED</span>';

        const rowStyle = isPending ? 'background:#fffbeb;' : '';

        return `
            <tr style="${rowStyle}">
                <td><strong>${l.id}</strong></td>
                <td><img class="table-thumb" src="${l.imageUrl}" alt="thumb" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td>
                <td>
                    <strong>${escapeHtml(l.title)}</strong>
                    ${isPending ? `<div style="font-size:0.75rem;color:#b45309;font-weight:700;margin-top:2px;">⚠️ Pending Admin Approval</div>` : ''}
                </td>
                <td><span class="badge" style="background:#e0f2fe;color:#0284c7">${l.type}</span></td>
                <td>📍 ${escapeHtml(l.location)}</td>
                <td><strong>₹${l.price.toLocaleString('en-IN')}</strong></td>
                <td>${l.availableUnits}</td>
                <td>${badge}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteListing('${l.id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterAgentMessages(status) {
    currentAgentMessageFilter = status || 'ALL';
    ['ALL', 'UNREAD', 'REPLIED'].forEach(st => {
        const btn = document.getElementById(`agt-msg-filter-${st}`);
        if (btn) {
            if (st === currentAgentMessageFilter) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderAgentMessages();
}

function renderAgentMessages() {
    const tb = document.getElementById('agentMessagesTableBody');
    if (!tb) return;

    let filtered = allAgentMessages;
    if (currentAgentMessageFilter && currentAgentMessageFilter !== 'ALL') {
        filtered = allAgentMessages.filter(m => m.status === currentAgentMessageFilter);
    }

    if (!filtered || filtered.length === 0) {
        tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:#64748b;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">💬</div>
            <strong>No messages found for filter: "${currentAgentMessageFilter}"</strong>
        </td></tr>`;
        return;
    }

    tb.innerHTML = filtered.map(m => {
        const isUnread = m.status === 'UNREAD';
        const rowStyle = isUnread ? 'background:#fffbeb;font-weight:600;' : '';

        return `
            <tr style="${rowStyle}">
                <td><strong>${m.id}</strong></td>
                <td>
                    <strong>${escapeHtml(m.senderName || 'Traveler')}</strong>
                    ${isUnread ? `<span class="badge" style="background:#fef3c7;color:#b45309;font-size:0.68rem;margin-left:4px;">NEW</span>` : ''}
                </td>
                <td><strong>${escapeHtml(m.subject || '')}</strong></td>
                <td>${m.listingReference || 'General'}</td>
                <td>${m.timestamp || ''}</td>
                <td><span class="badge ${m.status === 'REPLIED' ? 'badge-approved' : 'badge-pending'}">${m.status}</span></td>
                <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.messageText || '')}</td>
                <td>
                    ${m.status === 'UNREAD' ? `<button class="btn btn-primary btn-sm" onclick="replyMessage('${m.id}')">Mark Replied</button>` : '<span style="color:#059669;font-weight:600;">✔ Replied</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

function openNewListingModal() {
    previewSelectedImage();
    openModal('newListingModal');
}

function previewSelectedImage() {
    const sel = document.getElementById('nlImageSelect').value;
    document.getElementById('nlImagePreview').src = sel;
}

function updateListingFormFields() {
    const t = document.getElementById('nlType').value;
    const og = document.getElementById('nlOriginGroup');
    if (t === 'HOTEL') {
        og.style.display = 'none';
    } else {
        og.style.display = 'block';
    }
}

async function submitNewListing(event) {
    event.preventDefault();
    const payload = {
        title: document.getElementById('nlTitle').value,
        type: document.getElementById('nlType').value,
        location: document.getElementById('nlLocation').value,
        origin: document.getElementById('nlOrigin').value || '',
        destination: document.getElementById('nlLocation').value,
        price: parseFloat(document.getElementById('nlPrice').value) || 1000,
        rating: parseFloat(document.getElementById('nlRating').value) || 4.9,
        imageUrl: document.getElementById('nlImageSelect').value,
        agentId: currentUser.id,
        agentName: currentUser.name,
        description: document.getElementById('nlDescription').value,
        features: document.getElementById('nlFeatures').value,
        availableUnits: parseInt(document.getElementById('nlUnits').value) || 10,
        featured: false
    };

    try {
        const res = await fetch('/api/listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModal('newListingModal');
            showToast(data.message, 'success');
            await loadAgentData();
            await loadListings();
            await loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteListing(id) {
    if (!confirm(`Delete listing ${id}?`)) return;
    try {
        const res = await fetch(`/api/listings?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadAgentData();
            await loadListings();
            await loadStats();
        }
    } catch (err) {
        console.error(err);
    }
}

async function replyMessage(id) {
    try {
        const res = await fetch('/api/messages/reply', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Message marked as replied!', 'success');
            await loadAgentData();
            await loadStats();
        }
    } catch (err) {
        console.error(err);
    }
}

// ----------------------------------------------------
// ADMINISTRATOR DASHBOARD LOGIC
// ----------------------------------------------------
function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tabs-wrap .sc-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.getElementById(`adm-tab-${tab}`);
    if (targetBtn) targetBtn.classList.add('active');

    document.querySelectorAll('#adminSection .tab-pane').forEach(p => p.classList.remove('active'));
    if (tab === 'users') {
        const p = document.getElementById('adminTabUsers');
        if (p) p.classList.add('active');
        loadUsers();
        loadStats();
    }
    if (tab === 'pending') {
        const p = document.getElementById('adminTabPending');
        if (p) p.classList.add('active');
        loadAdminListings();
        loadStats();
    }
    if (tab === 'listings') {
        const p = document.getElementById('adminTabListings');
        if (p) p.classList.add('active');
        loadAdminListings();
        loadStats();
    }
    if (tab === 'bookings') {
        const p = document.getElementById('adminTabBookings');
        if (p) p.classList.add('active');
        loadAdminBookings();
        loadStats();
    }
    if (tab === 'settings') {
        document.getElementById('adminTabSettings').classList.add('active');
        loadSystemSettings();
    }
    if (tab === 'vouchers') {
        document.getElementById('adminTabVouchers').classList.add('active');
        loadAdminVouchers();
    }
    if (tab === 'feedback') {
        document.getElementById('adminTabFeedback').classList.add('active');
        loadAdminFeedback();
    }
    if (tab === 'broadcast') {
        document.getElementById('adminTabBroadcast').classList.add('active');
        loadNotifications();
    }
}

async function loadAdminData() {
    await loadUsers();
    await loadAdminListings();
    await loadAdminBookings();
    await loadAdminVouchers();
    await loadAdminFeedback();
    await loadStats();
}

async function loadUsers() {
    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success) {
            allUsers = data.users;
            document.getElementById('adminTotalUsers').textContent = allUsers.length;

            const tb = document.getElementById('adminUsersTableBody');
            tb.innerHTML = allUsers.map(u => {
                let roleColor = '#0284c7';
                let roleLabel = u.role;
                if (u.role === 'ADMIN') {
                    roleColor = '#b91c1c';
                    roleLabel = 'ADMINISTRATOR';
                } else if (u.role === 'AGENT') {
                    roleColor = '#ea580c';
                    roleLabel = 'TRAVEL AGENT';
                } else if (u.role === 'TRAVELER') {
                    roleLabel = 'TRAVELER';
                }

                const pwd = u.password || (u.role === 'ADMIN' ? 'admin123' : (u.role === 'AGENT' ? 'agent123' : 'pass123'));
                const feat = u.features || (u.role === 'ADMIN' ? 'User Management, Listing Approvals, System Settings, Revenue & Booking Overview' : (u.role === 'AGENT' ? 'Manage Listings, User Interaction, Track Bookings' : 'Bookings, Itinerary, Loyalty Points'));
                const pts = (u.loyaltyPoints !== undefined && u.loyaltyPoints !== null) ? u.loyaltyPoints : (u.id === 'USR-003' ? 1500 : (u.id === 'USR-004' ? 450 : (u.id === 'USR-005' ? 600 : 0)));

                return `
                    <tr>
                        <td><strong>${u.id}</strong></td>
                        <td>
                            <strong>${escapeHtml(u.name)}</strong>
                            ${u.role === 'TRAVELER' ? `<div style="font-size:0.75rem;color:#059669;font-weight:600;margin-top:2px;">🎁 ${pts} Loyalty Pts</div>` : ''}
                        </td>
                        <td>
                            <div>${escapeHtml(u.email)}</div>
                            <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">🔑 Pass: <code>${escapeHtml(pwd)}</code></div>
                        </td>
                        <td><span class="badge" style="background:${roleColor}22;color:${roleColor};font-weight:700;">${roleLabel}</span></td>
                        <td>${escapeHtml(u.phone)}</td>
                        <td><span class="badge ${u.status === 'ACTIVE' ? 'badge-approved' : 'badge-rejected'}">${u.status}</span></td>
                        <td>
                            <div style="font-size:0.75rem;max-width:240px;line-height:1.3;color:#334155;">
                                ${escapeHtml(feat)}
                            </div>
                        </td>
                        <td>
                            <button class="btn btn-secondary btn-sm" onclick='openEditUserModal(${JSON.stringify(u)})'>Edit</button>
                            ${u.id !== 'USR-001' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')">Delete</button>` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

function openNewUserModal() {
    document.getElementById('umModalTitle').textContent = 'Add New User Account';
    document.getElementById('umUserId').value = '';
    document.getElementById('umName').value = '';
    document.getElementById('umEmail').value = '';
    document.getElementById('umPhone').value = '';
    document.getElementById('umRole').value = 'TRAVELER';
    document.getElementById('umStatusGroup').style.display = 'none';
    document.getElementById('umSubmitBtn').textContent = 'Create User';
    openModal('userModal');
}

function openEditUserModal(user) {
    document.getElementById('umModalTitle').textContent = `Edit User: ${user.name}`;
    document.getElementById('umUserId').value = user.id;
    document.getElementById('umName').value = user.name;
    document.getElementById('umEmail').value = user.email;
    document.getElementById('umPhone').value = user.phone;
    document.getElementById('umRole').value = user.role;
    document.getElementById('umStatusGroup').style.display = 'block';
    document.getElementById('umStatus').value = user.status;
    document.getElementById('umSubmitBtn').textContent = 'Update User';
    openModal('userModal');
}

async function submitUserForm(event) {
    event.preventDefault();
    const id = document.getElementById('umUserId').value;
    const isEdit = !!id;

    const payload = {
        id: id,
        name: document.getElementById('umName').value,
        email: document.getElementById('umEmail').value,
        role: document.getElementById('umRole').value,
        phone: document.getElementById('umPhone').value,
        status: isEdit ? document.getElementById('umStatus').value : 'ACTIVE'
    };

    try {
        const res = await fetch('/api/users', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModal('userModal');
            showToast(data.message, 'success');
            await loadUsers();
            await loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteUser(id) {
    if (!confirm(`Are you sure you want to delete user account ${id}?`)) return;
    try {
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadUsers();
            await loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// ----------------------------------------------------
// ADMIN STAT QUICK-NAVIGATION
// ----------------------------------------------------
function navigateAdminStat(type, filter = 'ALL') {
    if (type === 'users') {
        switchAdminTab('users');
        const el = document.getElementById('adminTabUsers');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Navigated to User Accounts Directory', 'info');
    } else if (type === 'pending') {
        const section = document.getElementById('adminDashboardPendingSection');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            section.style.transition = 'box-shadow 0.3s ease';
            section.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.6)';
            setTimeout(() => { section.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.12)'; }, 1500);
        } else {
            switchAdminTab('pending');
        }
        showToast('Viewing Pending Approvals section', 'info');
    } else if (type === 'listings') {
        if (filter === 'PENDING') {
            switchAdminTab('pending');
            const el = document.getElementById('adminTabPending') || document.getElementById('adminTabListings');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Viewing Pending Listings awaiting Admin Approval', 'info');
        } else {
            switchAdminTab('listings');
            filterAdminListings(filter || 'ALL');
            const el = document.getElementById('adminTabListings');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Viewing All Travel Listings Catalog', 'info');
        }
    } else if (type === 'bookings') {
        switchAdminTab('bookings');
        filterAdminBookings(filter || 'ALL');
        const el = document.getElementById('adminTabBookings');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (filter === 'CONFIRMED') {
            showToast('Viewing Confirmed Bookings (Latest at top)', 'info');
        } else if (filter === 'PENDING') {
            showToast('Viewing Pending Bookings (Latest at top)', 'info');
        } else if (filter === 'CANCELLED') {
            showToast('Viewing Cancelled Bookings (Latest at top)', 'info');
        } else {
            showToast('Viewing Master Booking Ledger (Latest at top, oldest at bottom)', 'info');
        }
    }
}

// ----------------------------------------------------
// ADMIN LISTINGS APPROVAL & MODERATION
// ----------------------------------------------------
let allAdminListings = [];
let currentAdminListingFilter = 'ALL';

async function loadAdminListings() {
    try {
        const res = await fetch('/api/listings?status=ALL');
        const data = await res.json();
        if (data.success) {
            allAdminListings = data.listings || [];
            const total = allAdminListings.length;
            const pending = allAdminListings.filter(l => l.status === 'PENDING').length;
            
            if (document.getElementById('adminTotalListings')) {
                document.getElementById('adminTotalListings').textContent = total;
            }
            if (document.getElementById('adminPendingApprovals')) {
                document.getElementById('adminPendingApprovals').textContent = pending;
            }
            if (document.getElementById('admPendingFilterCount')) {
                document.getElementById('admPendingFilterCount').textContent = pending;
            }
            if (document.getElementById('admPendingTabCount')) {
                document.getElementById('admPendingTabCount').textContent = pending;
            }
            if (document.getElementById('adminPendingSectionCountBadge')) {
                document.getElementById('adminPendingSectionCountBadge').textContent = `${pending} Pending`;
            }

            const banner = document.getElementById('adminPendingAlertBanner');
            if (banner) {
                if (pending > 0) {
                    banner.style.display = 'flex';
                    const titleEl = document.getElementById('adminPendingAlertTitle');
                    if (titleEl) {
                        titleEl.textContent = `⚡ Action Required: ${pending} Pending Listing${pending > 1 ? 's' : ''} Awaiting Approval`;
                    }
                } else {
                    banner.style.display = 'none';
                }
            }

            renderAdminPendingViews();
            renderAdminListings();
        }
    } catch (err) {
        console.error(err);
    }
}

function renderAdminPendingViews() {
    const pendingListings = allAdminListings.filter(l => l.status === 'PENDING');

    // 1. Render Cards in Dashboard Pending Section
    const cardsContainer = document.getElementById('adminDashboardPendingCardsContainer');
    if (cardsContainer) {
        if (pendingListings.length === 0) {
            cardsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 2rem; background: white; border-radius: 12px; border: 1.5px dashed #86efac; color: #166534;">
                    <span style="font-size:2.2rem;">🎉</span>
                    <h4 style="margin:0.5rem 0 0.2rem 0; font-size:1.05rem;">All Travel Listings Approved & Live!</h4>
                    <p style="margin:0; font-size:0.85rem; color:#475569;">No travel packages currently awaiting admin review.</p>
                </div>
            `;
        } else {
            cardsContainer.innerHTML = pendingListings.map(l => `
                <div style="background: white; border-radius: 12px; border: 1.5px solid #fde68a; overflow: hidden; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08); display: flex; flex-direction: column;">
                    <div style="height: 140px; overflow: hidden; position: relative;">
                        <img src="${escapeHtml(l.imageUrl || '/images/default.jpg')}" alt="${escapeHtml(l.title)}" style="width: 100%; height: 100%; object-fit: cover;">
                        <span class="badge" style="position: absolute; top: 10px; left: 10px; background: #0284c7; color: white; font-weight: 700;">${l.type}</span>
                        <span class="badge" style="position: absolute; top: 10px; right: 10px; background: #fef3c7; color: #92400e; font-weight: 700; border: 1px solid #f59e0b;">⏳ PENDING</span>
                    </div>
                    <div style="padding: 1rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">ID: ${l.id} • Agent: ${escapeHtml(l.agentName || 'Certified Agent')}</div>
                            <h5 style="margin: 0.35rem 0; font-size: 0.98rem; color: #0f172a; line-height: 1.3;">${escapeHtml(l.title)}</h5>
                            <div style="font-size: 0.82rem; color: #475569; margin-bottom: 0.5rem;">📍 ${escapeHtml(l.location)}</div>
                            <div style="font-size: 1.05rem; font-weight: 800; color: #0284c7;">₹${l.price.toLocaleString('en-IN')} <span style="font-size:0.75rem; font-weight:400; color:#64748b;">/ base</span></div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 0.8rem;">
                            <button class="btn btn-success btn-sm" onclick="setListingStatus('${l.id}', 'APPROVED')" style="flex:1; font-weight:700;">✔ Approve</button>
                            <button class="btn btn-danger btn-sm" onclick="setListingStatus('${l.id}', 'REJECTED')" style="flex:1; font-weight:700;">✖ Reject</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // 2. Render Table in Dedicated Pending Tab
    const tabTableBody = document.getElementById('adminPendingTabTableBody');
    if (tabTableBody) {
        if (pendingListings.length === 0) {
            tabTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 3rem; color: #166534;">
                <div style="font-size:2.2rem; margin-bottom:0.4rem;">🎉</div>
                <strong>All travel listings are approved! No pending approvals at this time.</strong>
            </td></tr>`;
        } else {
            tabTableBody.innerHTML = pendingListings.map(l => `
                <tr style="background:#fffbeb;">
                    <td><strong>${l.id}</strong></td>
                    <td><strong>${escapeHtml(l.title)}</strong></td>
                    <td><span class="badge" style="background:#e0f2fe;color:#0284c7">${l.type}</span></td>
                    <td>📍 ${escapeHtml(l.location)}</td>
                    <td><strong>₹${l.price.toLocaleString('en-IN')}</strong></td>
                    <td>${escapeHtml(l.agentName || 'Agent')}</td>
                    <td><span class="badge badge-pending" style="background:#fef3c7; color:#92400e; font-weight:700; border:1px solid #f59e0b;">⏳ PENDING</span></td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="setListingStatus('${l.id}', 'APPROVED')">✔ Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="setListingStatus('${l.id}', 'REJECTED')">✖ Reject</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function filterAdminListings(status) {
    currentAdminListingFilter = status || 'ALL';
    ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].forEach(st => {
        const btn = document.getElementById(`adm-list-filter-${st}`);
        if (btn) {
            if (st === currentAdminListingFilter) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderAdminListings();
}

function renderAdminListings() {
    const tb = document.getElementById('adminListingsTableBody');
    if (!tb) return;

    let filtered = allAdminListings;
    if (currentAdminListingFilter && currentAdminListingFilter !== 'ALL') {
        filtered = allAdminListings.filter(l => l.status === currentAdminListingFilter);
    }

    if (!filtered || filtered.length === 0) {
        tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:#64748b;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">📋</div>
            <strong>No listings found under filter: "${currentAdminListingFilter}"</strong>
        </td></tr>`;
        return;
    }

    tb.innerHTML = filtered.map(l => {
        const isPending = l.status === 'PENDING';
        let badge = '<span class="badge badge-pending" style="font-weight:700;animation:pulse 2s infinite;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;">⏳ PENDING</span>';
        if (l.status === 'APPROVED') badge = '<span class="badge badge-approved">✅ APPROVED</span>';
        else if (l.status === 'REJECTED') badge = '<span class="badge badge-rejected">❌ REJECTED</span>';

        const rowStyle = isPending ? 'background:#fffbeb;font-weight:500;' : '';

        return `
            <tr style="${rowStyle}">
                <td><strong>${l.id}</strong></td>
                <td>
                    <strong>${escapeHtml(l.title)}</strong>
                    ${isPending ? `<div style="font-size:0.75rem;color:#b45309;font-weight:700;margin-top:2px;">⚠️ Pending Approval</div>` : ''}
                </td>
                <td><span class="badge" style="background:#e0f2fe;color:#0284c7">${l.type}</span></td>
                <td>📍 ${escapeHtml(l.location)}</td>
                <td><strong>₹${l.price.toLocaleString('en-IN')}</strong></td>
                <td>${escapeHtml(l.agentName || 'Agent')}</td>
                <td>${badge}</td>
                <td>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                        ${l.status === 'PENDING' ? `
                            <button class="btn btn-success btn-sm" onclick="setListingStatus('${l.id}', 'APPROVED')" style="box-shadow:0 2px 6px rgba(16,185,129,0.3);font-weight:600;" title="Approve and make visible to travelers">
                                ✔ Approve
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="setListingStatus('${l.id}', 'REJECTED')" style="box-shadow:0 2px 6px rgba(239,68,68,0.3);font-weight:600;" title="Disapprove / Reject this listing">
                                ✖ Disapprove
                            </button>
                        ` : `
                            <button class="btn btn-sm ${l.status === 'APPROVED' ? 'btn-danger' : 'btn-success'}" onclick="setListingStatus('${l.id}', '${l.status === 'APPROVED' ? 'REJECTED' : 'APPROVED'}')">
                                ${l.status === 'APPROVED' ? '✖ Disapprove / Reject' : '✔ Re-Approve'}
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function approveAllPendingListings() {
    const pendingListings = allAdminListings.filter(l => l.status === 'PENDING');
    if (pendingListings.length === 0) {
        showToast('No pending listings to approve.', 'info');
        return;
    }

    if (!confirm(`Are you sure you want to approve all ${pendingListings.length} pending travel listings?`)) {
        return;
    }

    let successCount = 0;
    for (const item of pendingListings) {
        try {
            const res = await fetch('/api/listings/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, status: 'APPROVED' })
            });
            const data = await res.json();
            if (data.success) successCount++;
        } catch (e) {
            console.error(e);
        }
    }

    showToast(`Successfully approved ${successCount} listings! All now visible to travelers.`, 'success');
    await loadAdminListings();
    await loadListings();
    await loadStats();
}

async function setListingStatus(id, newStatus) {
    try {
        const res = await fetch('/api/listings/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            const actionText = newStatus === 'APPROVED' ? 'Approved and published' : 'Disapproved / Rejected';
            showToast(`Listing ${id} ${actionText}!`, 'success');
            await loadAdminListings();
            await loadListings();
            await loadStats();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// ----------------------------------------------------
// ADMIN BOOKING OVERVIEW & REVERSE CHRONOLOGICAL SORTING
// ----------------------------------------------------
let allAdminBookings = [];
let currentAdminBookingFilter = 'ALL';

async function loadAdminBookings() {
    try {
        const res = await fetch('/api/bookings');
        const data = await res.json();
        if (data.success) {
            allAdminBookings = data.bookings || [];

            // Sort in reverse chronological order:
            // 1. Last (most recent) booked at the TOP
            // 2. First (oldest) booked at the MOST DOWN (bottom)
            // 3. Others sorted by timestamp between
            allAdminBookings.sort((a, b) => {
                const timeA = new Date(a.bookingDate).getTime();
                const timeB = new Date(b.bookingDate).getTime();
                if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
                    return timeB - timeA;
                }
                if (a.bookingDate && b.bookingDate && a.bookingDate !== b.bookingDate) {
                    return b.bookingDate.localeCompare(a.bookingDate);
                }
                const numA = parseInt((a.id || '').replace(/\D/g, '')) || 0;
                const numB = parseInt((b.id || '').replace(/\D/g, '')) || 0;
                return numB - numA;
            });

            const confirmed = allAdminBookings.filter(b => b.status === 'CONFIRMED').length;
            const pending = allAdminBookings.filter(b => b.status === 'PENDING').length;
            const cancelled = allAdminBookings.filter(b => b.status === 'CANCELLED').length;
            if (document.getElementById('adminTotalBookings')) document.getElementById('adminTotalBookings').textContent = allAdminBookings.length;
            if (document.getElementById('adminConfirmedBookings')) document.getElementById('adminConfirmedBookings').textContent = confirmed;
            if (document.getElementById('adminPendingBookings')) document.getElementById('adminPendingBookings').textContent = pending;
            if (document.getElementById('adminCancelledBookings')) document.getElementById('adminCancelledBookings').textContent = cancelled;
            const rev = allAdminBookings.filter(b => b.status !== 'CANCELLED').reduce((acc, cur) => acc + (cur.totalPrice || 0), 0);
            if (document.getElementById('adminTotalRevenue')) document.getElementById('adminTotalRevenue').textContent = `₹${rev.toLocaleString('en-IN')}`;

            renderAdminBookings();
        }
    } catch (err) {
        console.error(err);
    }
}

function filterAdminBookings(status) {
    currentAdminBookingFilter = status || 'ALL';
    ['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].forEach(st => {
        const btn = document.getElementById(`adm-bkg-filter-${st}`);
        if (btn) {
            if (st === currentAdminBookingFilter) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    renderAdminBookings();
}

function renderAdminBookings() {
    const tb = document.getElementById('adminBookingsTableBody');
    if (!tb) return;

    let filtered = allAdminBookings;
    if (currentAdminBookingFilter && currentAdminBookingFilter !== 'ALL') {
        filtered = allAdminBookings.filter(b => b.status === currentAdminBookingFilter);
    }

    if (!filtered || filtered.length === 0) {
        tb.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2.5rem;color:#64748b;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">🎟️</div>
            <strong>No bookings found under filter: "${currentAdminBookingFilter}"</strong>
        </td></tr>`;
        return;
    }

    tb.innerHTML = filtered.map((b, idx) => {
        const isLatest = idx === 0;
        const isOldest = idx === filtered.length - 1 && filtered.length > 1;
        const rowStyle = isLatest ? 'background: #f0fdf4; border-left: 4px solid #10b981;' : '';

        let bkgBadge = '<span class="badge badge-approved" style="background:#dcfce7;color:#15803d;font-weight:700;">✅ CONFIRMED</span>';
        if (b.status === 'PENDING') {
            bkgBadge = '<span class="badge badge-pending" style="background:#fef3c7;color:#b45309;font-weight:700;border:1px solid #f59e0b;">⏳ PENDING</span>';
        } else if (b.status === 'CANCELLED') {
            bkgBadge = '<span class="badge badge-rejected" style="background:#fee2e2;color:#b91c1c;font-weight:700;">❌ CANCELLED</span>';
        }

        let titleDisplay = escapeHtml(b.listingTitle || '');
        if (b.vehicleType) {
            titleDisplay += `<br><small style="color:#0284c7;font-weight:700;">🚗 ${escapeHtml(b.vehicleType)}</small>`;
        }
        if (b.pickupLocation) {
            titleDisplay += `<br><small style="color:#64748b;">Pickup: ${escapeHtml(b.pickupLocation)}</small>`;
        }

        return `
            <tr style="${rowStyle}">
                <td>
                    <strong>${b.id}</strong>
                    ${isLatest ? `<span class="badge" style="background:#dcfce7;color:#15803d;font-size:0.7rem;margin-left:5px;font-weight:700;">✨ LATEST</span>` : ''}
                    ${isOldest ? `<span class="badge" style="background:#f1f5f9;color:#64748b;font-size:0.7rem;margin-left:5px;">⏳ OLDEST</span>` : ''}
                </td>
                <td>
                    <strong>${escapeHtml(b.travelerName || 'Traveler')}</strong>
                    ${b.travelerAge ? `<div style="font-size:0.75rem;color:#0284c7;font-weight:600;">Age: ${b.travelerAge} yrs</div>` : ''}
                    ${(b.travelerPhone || b.contactPhone) ? `<div style="font-size:0.75rem;color:#64748b;">📞 ${escapeHtml(b.travelerPhone || b.contactPhone)}</div>` : ''}
                </td>
                <td>${titleDisplay}</td>
                <td><span class="badge" style="background:#e0f2fe;color:#0284c7">${b.listingType || ''}</span></td>
                <td>📅 ${b.travelDate || ''}</td>
                <td>${b.units || 1}</td>
                <td><strong>₹${(b.totalPrice || 0).toLocaleString('en-IN')}</strong></td>
                <td>${bkgBadge}</td>
                <td>
                    <div style="font-weight:600;font-size:0.85rem;">🕒 ${b.bookingDate || 'N/A'}</div>
                    <div style="font-size:0.7rem;color:#64748b;">
                        Order #${idx + 1} (${isLatest ? 'Most Recent (Top)' : (isOldest ? 'Oldest (Bottom)' : 'Middle Order')})
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadSystemSettings() {
    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.success) {
            const s = data.settings;
            document.getElementById('cfgPlatformName').value = s.platformName;
            document.getElementById('cfgCurrencySymbol').value = s.currencySymbol;
            document.getElementById('cfgCurrencyCode').value = s.currencyCode;
            document.getElementById('cfgDefaultTax').value = s.defaultTaxRate;
            document.getElementById('cfgContactEmail').value = s.contactEmail;
            document.getElementById('cfgSupportPhone').value = s.supportPhone;
            document.getElementById('cfgMaxBookings').value = s.maxBookingsPerUser;
            document.getElementById('cfgAllowAgentReg').checked = s.allowAgentRegistration;
            document.getElementById('cfgMaintenanceMode').checked = s.maintenanceMode;
            document.getElementById('cfgTerms').value = s.termsAndConditions;
        }
    } catch (err) {
        console.error(err);
    }
}

async function saveSystemSettings(event) {
    event.preventDefault();
    const payload = {
        platformName: document.getElementById('cfgPlatformName').value,
        currencySymbol: document.getElementById('cfgCurrencySymbol').value,
        currencyCode: document.getElementById('cfgCurrencyCode').value,
        defaultTaxRate: parseFloat(document.getElementById('cfgDefaultTax').value),
        contactEmail: document.getElementById('cfgContactEmail').value,
        supportPhone: document.getElementById('cfgSupportPhone').value,
        maxBookingsPerUser: parseInt(document.getElementById('cfgMaxBookings').value),
        allowAgentRegistration: document.getElementById('cfgAllowAgentReg').checked,
        maintenanceMode: document.getElementById('cfgMaintenanceMode').checked,
        termsAndConditions: document.getElementById('cfgTerms').value
    };

    try {
        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            const successMsg = 'System settings updated successfully.';
            showToast(successMsg, 'success');
            const banner = document.getElementById('settingsSuccessBanner');
            if (banner) {
                banner.style.display = 'flex';
                const msgSpan = document.getElementById('settingsSuccessMessage');
                if (msgSpan) msgSpan.textContent = successMsg;
                banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(() => { banner.style.display = 'none'; }, 4500);
            }
        } else {
            showToast('Failed to update settings', 'error');
        }
    } catch (err) {
        console.error(err);
    }
}

// ----------------------------------------------------
// MESSAGES & INQUIRIES LOGIC
// ----------------------------------------------------
async function loadTravelerMessages() {
    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        if (data.success) {
            const msgs = data.messages;
            const container = document.getElementById('travelerMessagesContainer');
            if (msgs.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2.5rem; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                        <h4>No messages or inquiries</h4>
                        <p style="color: #64748b; margin-top: 0.5rem;">Have questions about a hotel, tour, or flight? Send a message to our travel agents.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = msgs.map(m => `
                <div class="message-item">
                    <div class="message-top">
                        <span class="message-sender">${escapeHtml(m.senderName)} <span style="font-size:0.75rem;color:#64748b">(${m.senderRole})</span></span>
                        <span class="message-time">📅 ${m.timestamp}</span>
                    </div>
                    <div class="message-subj">Topic: ${escapeHtml(m.subject)} ${m.listingReference ? `<span class="badge" style="background:#e0f2fe;color:#0284c7">Ref: ${m.listingReference}</span>` : ''}</div>
                    <p class="message-text">${escapeHtml(m.messageText)}</p>
                    <div style="display:flex;justify-content:flex-end;">
                        <span class="badge ${m.status === 'REPLIED' ? 'badge-approved' : 'badge-pending'}">${m.status}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

function openNewMessageModal() {
    openModal('messageModal');
}

async function submitMessage(event) {
    event.preventDefault();
    const payload = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId: document.getElementById('msgRecipient').value,
        recipientName: document.getElementById('msgRecipient').selectedOptions[0].text,
        subject: document.getElementById('msgSubject').value,
        messageText: document.getElementById('msgText').value,
        listingReference: document.getElementById('msgListingRef').value
    };

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModal('messageModal');
            showToast('Message sent to travel agent!', 'success');
            await loadTravelerMessages();
        }
    } catch (err) {
        console.error(err);
    }
}

// ----------------------------------------------------
// STATS & UTILS
// ----------------------------------------------------
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
            const rev = `₹${data.totalRevenue.toLocaleString('en-IN')}`;
            if (document.getElementById('adminTotalUsers')) document.getElementById('adminTotalUsers').textContent = data.totalUsers;
            if (document.getElementById('adminTotalListings')) document.getElementById('adminTotalListings').textContent = data.totalListings;
            if (document.getElementById('adminPendingApprovals')) document.getElementById('adminPendingApprovals').textContent = data.pendingListings;
            if (document.getElementById('admPendingFilterCount') && data.pendingListings !== undefined) {
                document.getElementById('admPendingFilterCount').textContent = data.pendingListings;
            }
            if (document.getElementById('admPendingTabCount') && data.pendingListings !== undefined) {
                document.getElementById('admPendingTabCount').textContent = data.pendingListings;
            }
            if (document.getElementById('adminPendingSectionCountBadge') && data.pendingListings !== undefined) {
                document.getElementById('adminPendingSectionCountBadge').textContent = `${data.pendingListings} Pending`;
            }
            if (document.getElementById('adminTotalBookings')) document.getElementById('adminTotalBookings').textContent = data.totalBookings;
            if (document.getElementById('adminConfirmedBookings') && data.confirmedBookings !== undefined) {
                document.getElementById('adminConfirmedBookings').textContent = data.confirmedBookings;
            }
            if (document.getElementById('adminPendingBookings') && data.pendingBookings !== undefined) {
                document.getElementById('adminPendingBookings').textContent = data.pendingBookings;
            }
            if (document.getElementById('adminCancelledBookings') && data.cancelledBookings !== undefined) {
                document.getElementById('adminCancelledBookings').textContent = data.cancelledBookings;
            }
            if (document.getElementById('adminTotalRevenue')) document.getElementById('adminTotalRevenue').textContent = rev;

            const banner = document.getElementById('adminPendingAlertBanner');
            if (banner && data.pendingListings !== undefined) {
                if (data.pendingListings > 0) {
                    banner.style.display = 'flex';
                    const titleEl = document.getElementById('adminPendingAlertTitle');
                    if (titleEl) {
                        titleEl.textContent = `Pending Listings Awaiting Admin Approval (${data.pendingListings} Pending)`;
                    }
                } else {
                    banner.style.display = 'none';
                }
            }
        }
    } catch (err) {}
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// ----------------------------------------------------
// VOUCHER MANAGEMENT & REDEMPTION SYSTEM
// ----------------------------------------------------
async function loadAdminVouchers() {
    try {
        const res = await fetch('/api/vouchers');
        const data = await res.json();
        if (data.success) {
            const list = data.vouchers;
            const tb = document.getElementById('adminVouchersTableBody');
            if (!tb) return;

            if (list.length === 0) {
                tb.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#64748b;">No vouchers generated yet. Click "+ Generate New Voucher" to create one!</td></tr>`;
                return;
            }

            tb.innerHTML = list.map(v => {
                const isFlat = v.discountType === 'FLAT';
                const discText = isFlat ? `₹${Number(v.discountValue).toLocaleString('en-IN')} FLAT OFF` : `${v.discountValue}% PERCENT OFF`;
                const isExhausted = v.status === 'EXHAUSTED' || (v.timesUsed >= v.usageLimit);
                const statusBadge = v.status === 'ACTIVE' 
                    ? '<span class="badge badge-approved">ACTIVE</span>' 
                    : (isExhausted ? '<span class="badge" style="background:#fef3c7;color:#b45309">EXHAUSTED</span>' : '<span class="badge badge-rejected">DISABLED</span>');

                return `
                    <tr>
                        <td><strong>${v.id}</strong></td>
                        <td>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <code style="font-size:0.95rem;font-weight:800;color:#0284c7;background:#e0f2fe;padding:2px 6px;border-radius:4px;">${escapeHtml(v.code)}</code>
                                <button class="btn btn-outline-sm" style="padding:2px 6px;font-size:0.7rem;" onclick="navigator.clipboard.writeText('${escapeHtml(v.code)}');showToast('Code copied: ${escapeHtml(v.code)}', 'info')">📋</button>
                            </div>
                        </td>
                        <td><strong>${discText}</strong></td>
                        <td>₹${Number(v.minAmount).toLocaleString('en-IN')}</td>
                        <td>
                            <div>${v.timesUsed} / ${v.usageLimit}</div>
                            <div style="width:70px;background:#e2e8f0;height:4px;border-radius:2px;overflow:hidden;margin-top:3px;">
                                <div style="width:${Math.min(100, Math.round((v.timesUsed / v.usageLimit) * 100))}%;background:#0284c7;height:100%;"></div>
                            </div>
                        </td>
                        <td>📅 ${v.expiryDate}</td>
                        <td>${statusBadge}</td>
                        <td><div style="font-size:0.75rem;max-width:200px;line-height:1.3;color:#475569;">${escapeHtml(v.description || '')}</div></td>
                        <td>
                            <div style="display:flex;gap:4px;">
                                <button class="btn btn-secondary btn-sm" onclick="toggleVoucherStatus('${v.id}', '${v.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'}')">
                                    ${v.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteVoucher('${v.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadAdminFeedback() {
    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        if (data.success) {
            const list = data.messages;
            const tb = document.getElementById('adminFeedbackTableBody');
            if (!tb) return;

            if (list.length === 0) {
                tb.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#64748b;">No traveler feedback, ratings, or complaints logged yet.</td></tr>`;
                return;
            }

            tb.innerHTML = list.map(m => {
                const isReplied = m.status === 'REPLIED';
                const statusBadge = isReplied 
                    ? '<span class="badge badge-approved">RESOLVED / REPLIED</span>' 
                    : '<span class="badge badge-pending">PENDING INQUIRY</span>';

                return `
                    <tr>
                        <td><strong>${m.id}</strong></td>
                        <td>
                            <strong>${escapeHtml(m.senderName)}</strong>
                            <div style="font-size:0.75rem;color:#64748b;">${escapeHtml(m.senderEmail || 'traveler@travel.com')}</div>
                        </td>
                        <td><span class="badge" style="background:#e0f2fe;color:#0284c7;font-weight:700;">${escapeHtml(m.subject)}</span></td>
                        <td>${escapeHtml(m.listingReference || 'General Service')}</td>
                        <td>📅 ${m.timestamp}</td>
                        <td>${statusBadge}</td>
                        <td><div style="font-size:0.8rem;max-width:280px;line-height:1.4;color:#334155;">${escapeHtml(m.messageText)}</div></td>
                        <td>
                            ${!isReplied ? `
                                <button class="btn btn-primary btn-sm" onclick="replyMessage('${m.id}')">Resolve & Reply</button>
                            ` : `
                                <span style="font-size:0.75rem;color:#059669;font-weight:700;">✔ Resolved</span>
                            `}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

function openNewVoucherModal() {
    autoGenerateVoucherCode();
    document.getElementById('vmDiscountType').value = 'FLAT';
    updateVoucherTypeDisplay();
    document.getElementById('vmDiscountValue').value = 500;
    document.getElementById('vmMinAmount').value = 1000;
    document.getElementById('vmUsageLimit').value = 50;

    const exp = new Date();
    exp.setDate(exp.getDate() + 90);
    document.getElementById('vmExpiryDate').value = exp.toISOString().split('T')[0];
    document.getElementById('vmDescription').value = 'Exclusive Promo Voucher generated by Administrator Nitin Chaudhary';

    openModal('newVoucherModal');
}

function updateVoucherTypeDisplay() {
    const type = document.getElementById('vmDiscountType').value;
    const label = document.getElementById('vmDiscountLabel');
    const valInput = document.getElementById('vmDiscountValue');
    if (type === 'PERCENTAGE') {
        label.textContent = 'Discount Percentage (%) *';
        valInput.max = 90;
        if (parseInt(valInput.value) > 90) valInput.value = 20;
    } else {
        label.textContent = 'Discount Value (₹) *';
        valInput.max = 50000;
        if (parseInt(valInput.value) < 100) valInput.value = 500;
    }
}

function autoGenerateVoucherCode() {
    const prefixes = ['NITIN', 'SHIV', 'EXPLORE', 'TRAVEL', 'HOLIDAY', 'SUMMER', 'WINTER', 'DIWALI'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    document.getElementById('vmCode').value = `${prefix}${num}`;
}

async function submitVoucherForm(event) {
    event.preventDefault();
    const payload = {
        code: document.getElementById('vmCode').value.trim().toUpperCase(),
        discountType: document.getElementById('vmDiscountType').value,
        discountValue: parseFloat(document.getElementById('vmDiscountValue').value) || 0,
        minAmount: parseFloat(document.getElementById('vmMinAmount').value) || 0,
        usageLimit: parseInt(document.getElementById('vmUsageLimit').value) || 50,
        expiryDate: document.getElementById('vmExpiryDate').value,
        description: document.getElementById('vmDescription').value.trim()
    };

    try {
        const res = await fetch('/api/vouchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeModal('newVoucherModal');
            showToast(`Voucher ${payload.code} created & published!`, 'success');
            await loadAdminVouchers();
            await loadTravelerVouchers();
        } else {
            showToast(data.message || 'Failed to create voucher', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error creating voucher', 'error');
    }
}

async function toggleVoucherStatus(id, newStatus) {
    try {
        const res = await fetch('/api/vouchers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Voucher updated to ${newStatus}`, 'success');
            await loadAdminVouchers();
            await loadTravelerVouchers();
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteVoucher(id) {
    if (!confirm(`Are you sure you want to delete voucher ${id}?`)) return;
    try {
        const res = await fetch(`/api/vouchers?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadAdminVouchers();
            await loadTravelerVouchers();
        }
    } catch (err) {
        console.error(err);
    }
}

// Traveler Voucher Redemption Logic
async function loadTravelerVouchers() {
    try {
        const res = await fetch('/api/vouchers');
        const data = await res.json();
        if (data.success) {
            const list = data.vouchers.filter(v => v.status === 'ACTIVE');
            const grid = document.getElementById('travelerVouchersGrid');
            if (!grid) return;

            if (list.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:2rem; color:#64748b;">No active vouchers currently. Check back soon!</div>`;
                return;
            }

            grid.innerHTML = list.map(v => {
                const isFlat = v.discountType === 'FLAT';
                const tagColor = isFlat ? '#0284c7' : '#7c3aed';
                const discText = isFlat ? `₹${Number(v.discountValue).toLocaleString('en-IN')} OFF` : `${v.discountValue}% OFF`;

                return `
                    <div style="background:white; border-radius:14px; padding:1.25rem; border:1.5px dashed #cbd5e1; box-shadow:0 3px 10px rgba(0,0,0,0.03); position:relative; overflow:hidden;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                            <span class="badge" style="background:${tagColor}15; color:${tagColor}; font-weight:800; font-size:0.75rem;">
                                ${v.discountType} DISCOUNT
                            </span>
                            <span style="font-size:0.75rem; color:#94a3b8;">Exp: ${v.expiryDate}</span>
                        </div>
                        <div style="font-size:1.5rem; font-weight:900; color:#1e293b; margin-bottom:0.25rem;">
                            ${discText}
                        </div>
                        <p style="font-size:0.85rem; color:#64748b; margin-bottom:1rem; line-height:1.4;">
                            ${escapeHtml(v.description || 'Special platform discount offer.')}
                            <br><small style="color:#059669; font-weight:600;">Min booking spend: ₹${Number(v.minAmount).toLocaleString('en-IN')}</small>
                        </p>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <code style="flex:1; padding:0.5rem; background:#f1f5f9; border-radius:6px; font-weight:800; text-align:center; color:#0284c7; letter-spacing:1px;">
                                ${escapeHtml(v.code)}
                            </code>
                            <button class="btn btn-primary btn-sm" onclick="copyAndUseVoucher('${escapeHtml(v.code)}')">
                                📋 Copy & Apply
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error(err);
    }
}

async function redeemTravelerVoucher() {
    const input = document.getElementById('voucherRedeemInput');
    const feedback = document.getElementById('voucherRedeemFeedback');
    const code = (input ? input.value : '').trim().toUpperCase();

    if (!code) {
        showToast('Please type a voucher code to redeem', 'error');
        return;
    }

    try {
        const res = await fetch('/api/vouchers/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code, amount: 2500, finalize: false })
        });
        const data = await res.json();

        if (feedback) {
            feedback.style.display = 'block';
            if (data.success) {
                feedback.style.background = '#ecfdf5';
                feedback.style.border = '1.5px solid #10b981';
                feedback.style.color = '#065f46';
                const discStr = data.discountType === 'FLAT' ? `Flat ₹${data.discountValue}` : `${data.discountValue}% Off`;
                feedback.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span style="font-size:1.8rem;">🎉</span>
                        <div>
                            <strong style="font-size:1.05rem;">Voucher Code '${data.code}' Successfully Verified!</strong>
                            <div style="font-size:0.85rem; margin-top:2px;">
                                You unlocked <strong>${discStr}</strong> on your travel bookings! (Min spend: ₹${data.voucher.minAmount}).
                            </div>
                            <div style="margin-top:8px;">
                                <button class="btn btn-success btn-sm" onclick="switchTravelerTab('listings'); showToast('Select any flight, hotel or tour package to book with voucher applied!', 'info');">
                                    ✈️ Browse Packages & Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                showToast(`Voucher ${data.code} is valid and active!`, 'success');
            } else {
                feedback.style.background = '#fef2f2';
                feedback.style.border = '1.5px solid #ef4444';
                feedback.style.color = '#991b1b';
                feedback.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span style="font-size:1.8rem;">❌</span>
                        <div>
                            <strong>Unable to Redeem Voucher</strong>
                            <div style="font-size:0.85rem; margin-top:2px;">${escapeHtml(data.message)}</div>
                        </div>
                    </div>
                `;
                showToast(data.message, 'error');
            }
        }
    } catch (err) {
        console.error(err);
        showToast('Error validating voucher', 'error');
    }
}

function copyAndUseVoucher(code) {
    navigator.clipboard.writeText(code);
    const input = document.getElementById('voucherRedeemInput');
    if (input) input.value = code;
    showToast(`Copied voucher code ${code}! Applying...`, 'success');
    redeemTravelerVoucher();
}

// ----------------------------------------------------
// LIVE REAL-TIME DATA SYNC & AUTO-REFRESH
// ----------------------------------------------------
let lastKnownBookingsCount = -1;

async function syncRealtimeStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
            const currentBookings = data.totalBookings;
            // Update metrics cards
            await loadStats();

            // If bookings count changed and admin is active, reload table
            if (lastKnownBookingsCount !== -1 && currentBookings !== lastKnownBookingsCount) {
                if (currentRole === 'ADMIN') {
                    await loadAdminBookings();
                } else if (currentRole === 'AGENT') {
                    await loadAgentData();
                } else if (currentRole === 'TRAVELER') {
                    await loadTravelerBookings();
                }
            }
            lastKnownBookingsCount = currentBookings;
        }
    } catch (e) {
        // network or server idle
    }
}

// Auto-poll every 3 seconds for seamless multi-tab & multi-user updates
setInterval(() => {
    syncRealtimeStats();
    loadNotificationsSilent();
}, 3000);

// Immediate refresh whenever user switches back to this browser tab
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        syncRealtimeStats();
        loadNotifications();
        if (currentRole === 'ADMIN') {
            loadAdminBookings();
        } else if (currentRole === 'TRAVELER') {
            loadTravelerBookings();
        }
    }
});

// ----------------------------------------------------
// NOTIFICATION SYSTEM (TRAVELER BELL, HUB & SENDER DASHBOARDS)
// ----------------------------------------------------
let allNotifications = [];
let currentNotifFilter = 'ALL';
let currentTravelerHubFilter = 'ALL';

async function loadNotifications() {
    try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
            allNotifications = data.notifications;
            updateNotificationUI();
        }
    } catch (err) {
        console.error('Error loading notifications:', err);
    }
}

// Silent background polling version that doesn't trigger scroll or toast
async function loadNotificationsSilent() {
    try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
            const prevCount = allNotifications.length;
            allNotifications = data.notifications;
            updateNotificationUI();
            if (prevCount > 0 && allNotifications.length > prevCount) {
                // Play subtle chime or toast if new notification arrived
                const newest = allNotifications[0];
                showToast(`🔔 New notification: ${newest.title}`, 'info');
            }
        }
    } catch (e) {}
}

function updateNotificationUI() {
    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    // 1. Header Bell Badge
    const badge = document.getElementById('notifBadgeCount');
    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'inline-flex';
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            badge.style.display = 'none';
        }
    }

    // 2. Dropdown Header Badge
    const unreadBadge = document.getElementById('notifUnreadBadge');
    if (unreadBadge) {
        unreadBadge.textContent = `${unreadCount} Unread`;
        unreadBadge.style.background = unreadCount > 0 ? '#fee2e2' : '#f1f5f9';
        unreadBadge.style.color = unreadCount > 0 ? '#ef4444' : '#64748b';
    }

    // 3. Traveler Tab Sub-Badge
    const tabCount = document.getElementById('tabNotifCount');
    if (tabCount) {
        tabCount.textContent = unreadCount > 0 ? unreadCount : allNotifications.length;
    }

    // 4. Traveler Hub Category Badges
    const cAll = document.getElementById('thCountAll');
    const cBook = document.getElementById('thCountBooking');
    const cPromo = document.getElementById('thCountPromo');
    const cApp = document.getElementById('thCountApp');
    const cAds = document.getElementById('thCountAds');

    if (cAll) cAll.textContent = allNotifications.length;
    if (cBook) cBook.textContent = allNotifications.filter(n => n.category === 'BOOKING').length;
    if (cPromo) cPromo.textContent = allNotifications.filter(n => n.category === 'PROMOTION').length;
    if (cApp) cApp.textContent = allNotifications.filter(n => n.category === 'APP_UPDATE').length;
    if (cAds) cAds.textContent = allNotifications.filter(n => n.category === 'ADS').length;

    // 5. Render Views
    renderNotificationDropdown();
    renderTravelerHubNotifications();
    renderAdminNotificationLedger();
}

// Toggle Dropdown
function toggleNotificationDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    if (dd.style.display === 'none' || !dd.style.display) {
        dd.style.display = 'block';
        renderNotificationDropdown();
    } else {
        dd.style.display = 'none';
    }
}

// Click outside to close dropdown
document.addEventListener('click', (e) => {
    const dd = document.getElementById('notifDropdown');
    const btn = document.getElementById('notifBellBtn');
    if (dd && btn && dd.style.display === 'block') {
        if (!dd.contains(e.target) && !btn.contains(e.target)) {
            dd.style.display = 'none';
        }
    }
});

function filterNotificationsCategory(cat, btn) {
    currentNotifFilter = cat;
    document.querySelectorAll('.notif-pill').forEach(b => b.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    } else {
        const targetBtn = document.getElementById(`np-${cat}`);
        if (targetBtn) targetBtn.classList.add('active');
    }
    renderNotificationDropdown();
}

function renderNotificationDropdown() {
    const container = document.getElementById('notifListContainer');
    if (!container) return;

    let filtered = allNotifications;
    if (currentNotifFilter !== 'ALL') {
        filtered = allNotifications.filter(n => n.category === currentNotifFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="padding: 2.2rem 1.2rem; text-align: center; color: #64748b;">
                <div style="font-size: 2.2rem; margin-bottom: 0.4rem;">📭</div>
                <strong style="color: #0f172a; display: block; font-size: 0.95rem;">No Notifications Found</strong>
                <p style="font-size: 0.8rem; margin-top: 0.2rem; color: #94a3b8;">
                    ${currentNotifFilter === 'ALL' ? 'You have no alerts at this moment.' : `No notifications under category "${currentNotifFilter}".`}
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(n => {
        const catBadgeStyle = getNotifCategoryStyle(n.category);
        const unreadClass = n.isRead ? '' : 'unread';
        const senderLabel = n.senderRole === 'ADMIN' ? '🛡️ Admin' : (n.senderRole === 'AGENT' ? '✈️ Agent' : '🤖 System');

        return `
            <div class="notif-item ${unreadClass}" onclick="markNotificationAsRead('${n.id}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:1.15rem;">${n.icon || '🔔'}</span>
                        <span class="badge" style="${catBadgeStyle}">${escapeHtml(n.category)}</span>
                        <span style="font-size:0.7rem; color:#64748b; font-weight:600;">${senderLabel} • ${escapeHtml(n.senderName || '')}</span>
                    </div>
                    <span style="font-size:0.7rem; color:#94a3b8; white-space:nowrap;">${escapeHtml(n.timestamp)}</span>
                </div>
                <div class="notif-title" style="margin-top:5px; font-weight:700; color:#0f172a; font-size:0.87rem;">
                    ${escapeHtml(n.title)}
                </div>
                <div class="notif-message" style="margin-top:2px; color:#475569; font-size:0.8rem; line-height:1.4;">
                    ${escapeHtml(n.message)}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:0.72rem;">
                    <span style="color:#0284c7; font-weight:600;">
                        ${n.isRead ? '✓ Read' : '● New (Click to mark read)'}
                    </span>
                    ${getNotifQuickActionHtml(n)}
                </div>
            </div>
        `;
    }).join('');
}

function getNotifCategoryStyle(cat) {
    switch (cat) {
        case 'BOOKING':
            return 'background:#e0f2fe; color:#0284c7; font-weight:700; font-size:0.65rem;';
        case 'PROMOTION':
            return 'background:#fef3c7; color:#d97706; font-weight:700; font-size:0.65rem;';
        case 'APP_UPDATE':
            return 'background:#dcfce7; color:#16a34a; font-weight:700; font-size:0.65rem;';
        case 'ADS':
            return 'background:#fce7f3; color:#db2777; font-weight:700; font-size:0.65rem;';
        default:
            return 'background:#f1f5f9; color:#475569; font-weight:700; font-size:0.65rem;';
    }
}

function getNotifQuickActionHtml(n) {
    if (n.category === 'PROMOTION') {
        return `<span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:700;">🎁 Promo Offer</span>`;
    }
    if (n.category === 'BOOKING') {
        return `<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:700;">🎟️ View Trips</span>`;
    }
    return '';
}

async function markNotificationAsRead(id) {
    try {
        const res = await fetch('/api/notifications/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        if (data.success) {
            // Update local memory
            const item = allNotifications.find(n => n.id === id);
            if (item) item.isRead = true;
            updateNotificationUI();
        }
    } catch (err) {
        console.error('Error marking notification read:', err);
    }
}

async function markAllNotificationsAsRead() {
    try {
        const res = await fetch('/api/notifications/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'all' })
        });
        const data = await res.json();
        if (data.success) {
            allNotifications.forEach(n => n.isRead = true);
            updateNotificationUI();
            showToast('All notifications marked as read', 'info');
        }
    } catch (err) {
        console.error(err);
    }
}

function openAllNotificationsView() {
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.style.display = 'none';

    // Ensure we are viewing Traveler Section
    if (currentRole !== 'TRAVELER') {
        const travUser = registeredUsers.find(u => u.role === 'TRAVELER') || DEFAULT_TRAVELER_USER;
        switchRole('TRAVELER', travUser);
    }

    switchTravelerTab('notifications');
    const hubSec = document.getElementById('travelerTabNotifications');
    if (hubSec) hubSec.scrollIntoView({ behavior: 'smooth' });
}

function filterTravelerHubNotifs(cat) {
    currentTravelerHubFilter = cat;
    document.querySelectorAll('#travelerTabNotifications .sc-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`th-filter-${cat}`);
    if (btn) btn.classList.add('active');
    renderTravelerHubNotifications();
}

function renderTravelerHubNotifications() {
    const container = document.getElementById('travelerNotifHubList');
    if (!container) return;

    let filtered = allNotifications;
    if (currentTravelerHubFilter !== 'ALL') {
        filtered = allNotifications.filter(n => n.category === currentTravelerHubFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="background: white; border-radius: 14px; padding: 3rem; text-align: center; border: 1px dashed #cbd5e1;">
                <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">🔔</div>
                <h4 style="color: #0f172a;">No Notifications in this Category</h4>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.3rem;">
                    Check back soon or select "All" to browse system updates, deals, and booking notices.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(n => {
        const catBadgeStyle = getNotifCategoryStyle(n.category);
        const unreadBorder = n.isRead ? 'border: 1px solid #e2e8f0;' : 'border: 1.5px solid #0284c7; background: #f0f9ff;';
        const senderBadge = n.senderRole === 'ADMIN' ? '🛡️ Admin Nitin Chaudhary' : (n.senderRole === 'AGENT' ? '✈️ Agent Aman Sharma' : '✈️ SHIV Travels System');

        return `
            <div class="card" style="padding: 1.25rem; border-radius: 14px; ${unreadBorder} transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.4rem;">${n.icon || '🔔'}</span>
                        <div>
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                                <span class="badge" style="${catBadgeStyle}">${escapeHtml(n.category)}</span>
                                <span class="badge" style="background:#f8fafc; color:#475569; border:1px solid #e2e8f0;">${escapeHtml(senderBadge)}</span>
                                ${!n.isRead ? '<span class="badge" style="background:#fee2e2; color:#ef4444; font-weight:700;">● NEW</span>' : '<span class="badge" style="background:#f1f5f9; color:#64748b;">✓ Read</span>'}
                            </div>
                            <h4 style="margin: 0.35rem 0 0.15rem 0; color: #0f172a; font-size: 1.05rem;">
                                ${escapeHtml(n.title)}
                            </h4>
                        </div>
                    </div>
                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">
                        🕒 ${escapeHtml(n.timestamp)}
                    </div>
                </div>

                <div style="margin-top: 0.8rem; color: #334155; font-size: 0.92rem; line-height: 1.55; background: white; padding: 0.85rem 1rem; border-radius: 10px; border: 1px solid #f1f5f9;">
                    ${escapeHtml(n.message)}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.9rem; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${!n.isRead ? `
                            <button class="btn btn-secondary btn-sm" onclick="markNotificationAsRead('${n.id}')">
                                ✓ Mark as Read
                            </button>
                        ` : ''}
                        ${n.category === 'PROMOTION' ? `
                            <button class="btn btn-primary btn-sm" onclick="switchTravelerTab('vouchers')">
                                🎁 Redeem Voucher Codes
                            </button>
                        ` : ''}
                        ${n.category === 'BOOKING' ? `
                            <button class="btn btn-primary btn-sm" onclick="switchTravelerTab('mybookings')">
                                🎟️ View My Bookings
                            </button>
                        ` : ''}
                    </div>

                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:0.75rem; color:#64748b;">Need help?</span>
                        <a href="tel:18001238692" style="font-size:0.78rem; color:#0284c7; font-weight:700; text-decoration:none;">📞 1800-123-8692</a>
                        <a href="https://wa.me/919876543210" target="_blank" style="font-size:0.78rem; color:#16a34a; font-weight:700; text-decoration:none;">💬 WhatsApp</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ----------------------------------------------------
// ADMIN NOTIFICATION BROADCAST & LEDGER
// ----------------------------------------------------
async function sendAdminNotification(event) {
    event.preventDefault();
    const title = document.getElementById('admNotifTitle').value.trim();
    const category = document.getElementById('admNotifCategory').value;
    const targetAudience = document.getElementById('admNotifAudience').value;
    const message = document.getElementById('admNotifMessage').value.trim();

    if (!title || !message) {
        showToast('Please provide both notification title and message.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                message,
                category,
                senderRole: 'ADMIN',
                senderName: (currentUser && currentUser.name) ? currentUser.name : 'Admin Nitin Chaudhary',
                targetAudience
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Broadcast notification delivered to all Travelers instantly!', 'success');
            document.getElementById('adminBroadcastForm').reset();
            await loadNotifications();
        } else {
            showToast(data.message || 'Error sending notification', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server communication error sending notification', 'error');
    }
}

async function deleteAdminNotification(id) {
    if (!confirm('Are you sure you want to remove this notification from travelers\' bells?')) {
        return;
    }
    try {
        const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            showToast('Notification deleted successfully', 'info');
            await loadNotifications();
        } else {
            showToast(data.message || 'Error deleting notification', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server error while deleting notification', 'error');
    }
}

function renderAdminNotificationLedger() {
    const tbody = document.getElementById('adminNotifTableBody');
    if (!tbody) return;

    if (allNotifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #64748b; padding: 2rem;">
                    No broadcast notifications logged.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = allNotifications.map(n => {
        const catStyle = getNotifCategoryStyle(n.category);
        return `
            <tr>
                <td>
                    <span style="font-size: 1.1rem; margin-right: 4px;">${n.icon || '🔔'}</span>
                    <span class="badge" style="${catStyle}">${escapeHtml(n.category)}</span>
                </td>
                <td>
                    <strong style="color: #0f172a; display: block;">${escapeHtml(n.title)}</strong>
                    <div style="font-size: 0.78rem; color: #64748b; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(n.message)}
                    </div>
                </td>
                <td>
                    <strong>${escapeHtml(n.senderName || 'Admin')}</strong>
                    <div style="font-size: 0.72rem; color: #64748b;">${escapeHtml(n.senderRole || 'ADMIN')}</div>
                </td>
                <td>
                    <span class="badge" style="background: #e2e8f0; color: #334155;">${escapeHtml(n.targetAudience || 'ALL_TRAVELERS')}</span>
                </td>
                <td style="font-size: 0.8rem; color: #64748b;">
                    ${escapeHtml(n.timestamp)}
                </td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="deleteAdminNotification('${n.id}')" style="color: #ef4444; border-color: #fee2e2;" title="Delete notification">
                        🗑️ Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ----------------------------------------------------
// TRAVEL AGENT NOTIFICATION BROADCAST
// ----------------------------------------------------
async function sendAgentNotification(event) {
    event.preventDefault();
    const title = document.getElementById('agNotifTitle').value.trim();
    const category = document.getElementById('agNotifCategory').value;
    const targetAudience = document.getElementById('agNotifAudience').value;
    const message = document.getElementById('agNotifMessage').value.trim();

    if (!title || !message) {
        showToast('Please provide both notification title and message.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                message,
                category,
                senderRole: 'AGENT',
                senderName: (currentUser && currentUser.name) ? currentUser.name : 'Travel Agent Aman Sharma',
                targetAudience
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('✅ Notification broadcast delivered to all Travelers!', 'success');
            document.getElementById('agentBroadcastForm').reset();
            await loadNotifications();
        } else {
            showToast(data.message || 'Error sending notification', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Server communication error sending notification', 'error');
    }
}

// ----------------------------------------------------
// MULTI-LANGUAGE TRANSLATION SYSTEM (TRAVELER PORTAL)
// ----------------------------------------------------
let currentLanguage = 'en';

const translations = {
    'en': {
        name: 'English',
        flag: '🇬🇧',
        announcement: '✨ <strong>WINTER SPECIAL:</strong> Flat 20% OFF on Swiss Alps, Thailand, Manali & Luxury Packages! Use Code <strong>SHIV20</strong>',
        hl1: '📞 Helpline 1 (Toll-Free):',
        hl2: '💬 Helpline 2 (WhatsApp):',
        portal: 'Portal:',
        roleTraveler: 'Traveler',
        heroBadge1: '⭐ Top-Rated Travel Platform',
        heroBadge2: '100% Verified Stays & Flights',
        heroTitle: 'Where Luxury Meets Adventure.',
        heroDesc: 'Book authentic stays, direct flights & open-top rentals across Ayodhya Ram Mandir, Swiss Alps, Thailand, Manali, Jaipur, Taj Mahal, Bali & Dubai.',
        stAll: '✨ All Experiences',
        stHotel: '🏨 Luxury Hotels & Villas',
        stFlight: '✈️ Direct Flights',
        stCar: '🚗 4x4 & Supercars',
        whereTo: 'Where To?',
        searchPlaceholder: 'Search destination (e.g. Ayodhya, Swiss Alps, Manali, Thailand, Jaipur, Goa, Dubai, Agra)',
        checkIn: 'Check-in / Date',
        sortOffers: 'Sort Offers',
        optFeatured: 'Featured First',
        optPriceAsc: 'Price: Low to High',
        optPriceDesc: 'Price: High to Low',
        optRating: 'Top Rated (★ 4.9+)',
        searchBtn: '🔍 Search Deals',
        tabListings: '🏷️ Available Packages',
        tabBookings: '🎟️ My Bookings & Vouchers',
        tabItineraries: '🗺️ Travel Itineraries',
        tabSupport: '💬 Agent Inquiries & Chat',
        tabVouchers: '🎁 Redeem Voucher',
        tabNotif: '🔔 Notification Hub',
        showcaseTitle: 'Exclusive Handcrafted Packages',
        showcaseSubtitle: 'Luxury lakeside chalets, overwater ocean villas, mountain safaris, and direct flights.',
        fpAll: 'All Deals',
        fpHotel: '🏨 Hotels & Stays',
        fpFlight: '✈️ Flights',
        fpCar: '🚗 4x4 & Rentals',
        startingFrom: 'Starting from',
        bookNow: 'Book Now',
        unitFlight: '/ passenger',
        unitHotel: '/ night',
        unitCar: '/ day',
        noListings: '🔍 No travel listings found',
        noListingsSub: 'Try adjusting your destination search or selecting "All Deals".',
        cardHlTitle: '🆘 24/7 Dedicated Traveler Helpline Numbers (Problem & Issue Resolution)',
        cardHlDesc: 'Need urgent assistance with reservations, luggage, flight changes or emergency support? Contact our 24/7 desks:',
        toastLangChanged: 'Language set to English.'
    },
    'hi': {
        name: 'हिन्दी',
        flag: '🇮🇳',
        announcement: '✨ <strong>शीतकालीन विशेष:</strong> स्विस आल्प्स, थाईलैंड, मनाली और लक्जरी पैकेजों पर 20% की फ्लैट छूट! कोड <strong>SHIV20</strong> लगाएं',
        hl1: '📞 हेल्पलाइन 1 (टोल-फ्री):',
        hl2: '💬 हेल्पलाइन 2 (व्हाट्सएप):',
        portal: 'पोर्टल:',
        roleTraveler: 'यात्री (Traveler)',
        heroBadge1: '⭐ शीर्ष मूल्यांकित यात्रा मंच',
        heroBadge2: '100% सत्यापित होटल एवं उड़ानें',
        heroTitle: 'जहाँ विलासिता और रोमांच का संगम होता है।',
        heroDesc: 'अयोध्या राम मंदिर, स्विस आल्प्स, थाईलैंड, मनाली, जयपुर, ताजमहल, बाली और दुबई के लिए प्रामाणिक होटल, सीधी उड़ानें और कार रेंटल बुक करें।',
        stAll: '✨ सभी अनुभव',
        stHotel: '🏨 लक्जरी होटल एवं विला',
        stFlight: '✈️ सीधी उड़ानें',
        stCar: '🚗 4x4 एवं कार रेंटल',
        whereTo: 'कहाँ जाना है?',
        searchPlaceholder: 'गंतव्य खोजें (उदा. अयोध्या, स्विस आल्प्स, मनाली, थाईलैंड, जयपुर, गोवा, दुबई, आगरा)',
        checkIn: 'चेक-इन / तारीख',
        sortOffers: 'ऑफ़र क्रमबद्ध करें',
        optFeatured: 'सुझाए गए पहले',
        optPriceAsc: 'कीमत: कम से अधिक',
        optPriceDesc: 'कीमत: अधिक से कम',
        optRating: 'उच्चतम रेटिंग (★ 4.9+)',
        searchBtn: '🔍 यात्रा खोजें',
        tabListings: '🏷️ उपलब्ध पैकेज',
        tabBookings: '🎟️ मेरी बुकिंग्स एवं टिकट',
        tabItineraries: '🗺️ यात्रा कार्यक्रम',
        tabSupport: '💬 सहायता एवं पूछताछ',
        tabVouchers: '🎁 वाउचर रिडीम करें',
        tabNotif: '🔔 नोटिफिकेशन हब',
        showcaseTitle: 'विशेष चुनिंदा यात्रा पैकेज',
        showcaseSubtitle: 'लक्जरी रिसॉर्ट्स, समुद्र तट विला, पर्वतीय सफारी और सीधी उड़ानें।',
        fpAll: 'सभी डील',
        fpHotel: '🏨 होटल एवं आवास',
        fpFlight: '✈️ उड़ानें',
        fpCar: '🚗 कार एवं रेंटल',
        startingFrom: 'प्रारंभिक मूल्य',
        bookNow: 'अभी बुक करें',
        unitFlight: '/ यात्री',
        unitHotel: '/ रात',
        unitCar: '/ दिन',
        noListings: '🔍 कोई यात्रा पैकेज नहीं मिला',
        noListingsSub: 'कृपया अपना गंतव्य नाम बदलें या "सभी डील" चुनें।',
        cardHlTitle: '🆘 24/7 समर्पित यात्री हेल्पलाइन नंबर (समस्या समाधान एवं सहायता)',
        cardHlDesc: 'आरक्षण, लगेज, उड़ान परिवर्तन या आपातकालीन सहायता के लिए हमारे 24/7 डेस्क से संपर्क करें:',
        toastLangChanged: 'भाषा बदलकर "हिन्दी" कर दी गई है।'
    },
    'bn': {
        name: 'বাংলা',
        flag: '🇮🇳',
        announcement: '✨ <strong>শীতকালীন অফার:</strong> সুইস আল্পস, থাইল্যান্ড, মানালি ও লাক্সারি প্যাকেজে ২০% ছাড়! কোড <strong>SHIV20</strong> ব্যবহার করুন',
        hl1: '📞 হেল্পলাইন ১ (টোল-ফ্রি):',
        hl2: '💬 হেল্পলাইন ২ (হোয়াটসঅ্যাপ):',
        portal: 'পোর্টাল:',
        roleTraveler: 'ভ্রমণকারী',
        heroBadge1: '⭐ শীর্ষ রেটযুক্ত ভ্রমণ প্ল্যাটফর্ম',
        heroBadge2: '১০০% যাচাইকৃত হোটেল ও ফ্লাইট',
        heroTitle: 'যেখানে বিলাসিতা ও অভিযানের মিলন ঘটে।',
        heroDesc: 'অযোধ্যা রাম মন্দির, সুইস আল্পস, থাইল্যান্ড, মানালি, জয়পুর, তাজমহল, বালি ও দুবাইয়ের জন্য সেরা হোটেল, ফ্লাইট ও গাড়ি বুক করুন।',
        stAll: '✨ সব অভিজ্ঞতা',
        stHotel: '🏨 লাক্সারি হোটেল ও রিসর্ট',
        stFlight: '✈️ সরাসরি ফ্লাইট',
        stCar: '🚗 ৪x৪ ও গাড়ি ভাড়া',
        whereTo: 'কোথায় যাবেন?',
        searchPlaceholder: 'গন্তব্য খুঁজুন (যেমন অযোধ্যা, কাশ্মীর, মানালি, থাইল্যান্ড, গোয়া, দুবাই)',
        checkIn: 'চেক-ইন / তারিখ',
        sortOffers: 'অফার সাজান',
        optFeatured: 'সেরা অফার প্রথমে',
        optPriceAsc: 'মূল্য: কম থেকে বেশি',
        optPriceDesc: 'মূল্য: বেশি থেকে কম',
        optRating: 'সেরা রেটিং (★ ৪.৯+)',
        searchBtn: '🔍 প্যাকেজ খুঁজুন',
        tabListings: '🏷️ উপলব্ধ প্যাকেজ',
        tabBookings: '🎟️ আমার বুকিং ও ভাউচার',
        tabItineraries: '🗺️ ভ্রমণ পরিকল্পনা',
        tabSupport: '💬 সহায়তা ও চ্যাট',
        tabVouchers: '🎁 ভাউচার ব্যবহার করুন',
        tabNotif: '🔔 নোটিফিকেশন হাব',
        showcaseTitle: 'নির্বাচিত বিশেষ ভ্রমণ প্যাকেজ',
        showcaseSubtitle: 'লেকের ধারের ভিলা, সমুদ্র রিসর্ট, পাহাড়ি সাফারি এবং সরাসরি ফ্লাইট।',
        fpAll: 'সকল ডিল',
        fpHotel: '🏨 হোটেল',
        fpFlight: '✈️ ফ্লাইট',
        fpCar: '🚗 গাড়ি ভাড়া',
        startingFrom: 'শুরুর মূল্য',
        bookNow: 'এখন বুক করুন',
        unitFlight: '/ যাত্রী',
        unitHotel: '/ রাত',
        unitCar: '/ দিন',
        noListings: '🔍 কোনো প্যাকেজ পাওয়া যায়নি',
        noListingsSub: 'অনুগ্রহ করে অন্য গন্তব্য দিয়ে চেষ্টা করুন বা "সকল ডিল" বেছে নিন।',
        cardHlTitle: '🆘 ২৪/৭ নিবেদিত ভ্রমণকারী হেল্পলাইন (জরুরি সমাধান)',
        cardHlDesc: 'টিকিট, ফ্লাইট পরিবর্তন বা জরুরি সহায়তার জন্য আমাদের ২৪/৭ ডেস্কে যোগাযোগ করুন:',
        toastLangChanged: 'ভাষা "বাংলা"-তে পরিবর্তিত হয়েছে।'
    },
    'mr': {
        name: 'मराठी',
        flag: '🇮🇳',
        announcement: '✨ <strong>हिवाळी विशेष:</strong> स्विस आल्प्स, थायलंड, मनाली आणि लक्झरी पॅकेजेसवर २०% थेट सूट! कोड <strong>SHIV20</strong> वापरा',
        hl1: '📞 हेल्पलाइन १ (टोल-फ्री):',
        hl2: '💬 हेल्पलाइन २ (व्हॉट्सॲप):',
        portal: 'पोर्टल:',
        roleTraveler: 'प्रवासी (Traveler)',
        heroBadge1: '⭐ सर्वोच्च दर्जाचे ट्रॅव्हल प्लॅटफॉर्म',
        heroBadge2: '१००% सत्यापित हॉटेल्स आणि उड्डाणे',
        heroTitle: 'जेथे भव्यता आणि साहसाचा संगम होतो.',
        heroDesc: 'अयोध्या राम मंदिर, स्विस आल्प्स, थायलंड, मनाली, जयपूर, ताजमहाल, बाली आणि दुबईसाठी खात्रीशीर हॉटेल्स आणि उड्डाणे बुक करा.',
        stAll: '✨ सर्व अनुभव',
        stHotel: '🏨 लक्झरी हॉटेल्स व व्हिला',
        stFlight: '✈️ थेट विमाने',
        stCar: '🚗 ४x४ आणि कार भाडे',
        whereTo: 'कुठे जायचे आहे?',
        searchPlaceholder: 'गंतव्यस्थान शोधा (उदा. अयोध्या, मनाली, थायलंड, जयपूर, गोवा, दुबई)',
        checkIn: 'चेक-इन / तारीख',
        sortOffers: 'ऑफर क्रमवारी',
        optFeatured: 'वैशिष्ट्यीकृत प्रथम',
        optPriceAsc: 'किंमत: कमी ते जास्त',
        optPriceDesc: 'किंमत: जास्त ते कमी',
        optRating: 'सर्वोत्कृष्ट रेटिंग (★ ४.९+)',
        searchBtn: '🔍 पॅकेजेस शोधा',
        tabListings: '🏷️ उपलब्ध पॅकेजेस',
        tabBookings: '🎟️ माझी बुकिंग्स व तिकिटे',
        tabItineraries: '🗺️ प्रवास योजना',
        tabSupport: '💬 मदत व चौकशी',
        tabVouchers: '🎁 व्हाउचर रिडीम करा',
        tabNotif: '🔔 सूचना केंद्र',
        showcaseTitle: 'खास निवडक टूर पॅकेजेस',
        showcaseSubtitle: 'लक्झरी रिसॉर्ट्स, समुद्रकिनाऱ्यावरील व्हिला आणि थेट विमाने.',
        fpAll: 'सर्व डील्स',
        fpHotel: '🏨 हॉटेल्स',
        fpFlight: '✈️ विमाने',
        fpCar: '🚗 कार भाडे',
        startingFrom: 'किंमत सुरु',
        bookNow: 'आता बुक करा',
        unitFlight: '/ प्रवासी',
        unitHotel: '/ रात्र',
        unitCar: '/ दिवस',
        noListings: '🔍 कोणतेही पॅकेज आढळले नाही',
        noListingsSub: 'कृपया वेगळे नाव टाकून पुन्हा शोधा किंवा "सर्व डील्स" निवडा.',
        cardHlTitle: '🆘 २४/७ प्रवासी हेल्पलाइन क्रमांक (समस्या निवारण)',
        cardHlDesc: 'आरक्षण, उड्डाण बदल किंवा आपत्कालीन मदतीसाठी आमच्या २४/७ क्रमांकांवर संपर्क साधा:',
        toastLangChanged: 'भाषा "मराठी" मध्ये बदलली आहे.'
    },
    'gu': {
        name: 'ગુજરાતી',
        flag: '🇮🇳',
        announcement: '✨ <strong>વિન્ટર સ્પેશિયલ:</strong> સ્વિસ આલ્પ્સ, થાઇલેન્ડ, મનાલી અને લક્ઝરી પેકેજો પર ફ્લેટ ૨૦% છૂટ! કોડ <strong>SHIV20</strong> વાપરો',
        hl1: '📞 હેલ્પલાઇન ૧ (ટોલ-ફ્રી):',
        hl2: '💬 હેલ્પલાઇન ૨ (વોટ્સએપ):',
        portal: 'પોર્ટલ:',
        roleTraveler: 'મુસાફર (Traveler)',
        heroBadge1: '⭐ શ્રેષ્ઠ પ્રવાસ પ્લેટફોર્મ',
        heroBadge2: '૧૦૦% ચકાસાયેલ હોટલ અને ફ્લાઇટ્સ',
        heroTitle: 'જ્યાં લક્ઝરી અને સાહસનું મિલન થાય છે.',
        heroDesc: 'અયોધ્યા રામ મંદિર, સ્વિસ આલ્પ્સ, થાઇલેન્ડ, મનાલી, જયપુર, તાજમહેલ, બાલી અને દુબઈ માટે શ્રેષ્ઠ હોટેલ અને ફ્લાઇટ બુક કરો.',
        stAll: '✨ તમામ અનુભવો',
        stHotel: '🏨 લક્ઝરી હોટેલ્સ અને વિલા',
        stFlight: '✈️ સીધી ફ્લાઇટ્સ',
        stCar: '🚗 ૪x૪ અને કાર રેન્ટલ',
        whereTo: 'ક્યાં જવું છે?',
        searchPlaceholder: 'સ્થળ શોધો (દા.ત. અયોધ્યા, મનાલી, થાઇલેન્ડ, જયપુર, ગોવા, દુબઈ)',
        checkIn: 'ચેક-ઇન / તારીખ',
        sortOffers: 'ઓફર ક્રમ',
        optFeatured: 'ખાસ ઓફરો પ્રથમ',
        optPriceAsc: 'કિંમત: ઓછી થી વધુ',
        optPriceDesc: 'કિંમત: વધુ થી ઓછી',
        optRating: 'ટોપ રેટેડ (★ ૪.૯+)',
        searchBtn: '🔍 ડીલ્સ શોધો',
        tabListings: '🏷️ ઉપલબ્ધ પેકેજો',
        tabBookings: '🎟️ મારી બુકિંગ્સ અને ટિકિટ',
        tabItineraries: '🗺️ પ્રવાસ યોજના',
        tabSupport: '💬 સહાય અને પૂછપરછ',
        tabVouchers: '🎁 વાઉચર રિડીમ કરો',
        tabNotif: '🔔 નોટિફિકેશન હબ',
        showcaseTitle: 'ખાસ પસંદ કરેલા ટૂર પેકેજ',
        showcaseSubtitle: 'સુંદર રિસોર્ટ્સ, બીચ વિલા અને ડાયરેક્ટ ફ્લાઇટ્સ.',
        fpAll: 'તમામ ડીલ',
        fpHotel: '🏨 હોટેલ્સ',
        fpFlight: '✈️ ફ્લાઇટ્સ',
        fpCar: '🚗 કાર રેન્ટલ',
        startingFrom: 'શરૂઆતી કિંમત',
        bookNow: 'હમણાં બુક કરો',
        unitFlight: '/ મુસાફર',
        unitHotel: '/ રાત્રિ',
        unitCar: '/ દિવસ',
        noListings: '🔍 કોઈ પેકેજ મળ્યું નથી',
        noListingsSub: 'કૃપા કરીને અલગ સ્થળ દાખલ કરો અથવા "તમામ ડીલ" પસંદ કરો.',
        cardHlTitle: '🆘 ૨૪/૭ સમર્પિત હેલ્પલાઇન નંબરો (સમસ્યા નિવારણ)',
        cardHlDesc: 'ટિકિટ, ફ્લાઇટ ફેરફાર કે ઇમરજન્સી સપોર્ટ માટે અમારા ૨૪/૭ ડેસ્કનો સંપર્ક કરો:',
        toastLangChanged: 'ભાષા "ગુજરાતી" માં બદલાઈ ગઈ છે.'
    },
    'es': {
        name: 'Español',
        flag: '🇪🇸',
        announcement: '✨ <strong>ESPECIAL DE INVIERNO:</strong> ¡20% de descuento en Alpes Suizos, Tailandia y paquetes de lujo! Código <strong>SHIV20</strong>',
        hl1: '📞 Línea 1 (Gratis):',
        hl2: '💬 Línea 2 (WhatsApp):',
        portal: 'Portal:',
        roleTraveler: 'Viajero',
        heroBadge1: '⭐ Plataforma de Viajes Mejor Valorada',
        heroBadge2: '100% Hoteles y Vuelos Verificados',
        heroTitle: 'Donde el lujo se une a la aventura.',
        heroDesc: 'Reserve alojamientos auténticos, vuelos directos y alquileres en Ayodhya, Alpes Suizos, Tailandia, Jaipur, Bali y Dubái.',
        stAll: '✨ Todas las Experiencias',
        stHotel: '🏨 Hoteles y Villas de Lujo',
        stFlight: '✈️ Vuelos Directos',
        stCar: '🚗 4x4 y Alquiler de Autos',
        whereTo: '¿A dónde va?',
        searchPlaceholder: 'Buscar destino (ej. Ayodhya, Alpes Suizos, Tailandia, Jaipur, Dubái)',
        checkIn: 'Fecha / Entrada',
        sortOffers: 'Ordenar Ofertas',
        optFeatured: 'Destacados Primero',
        optPriceAsc: 'Precio: Menor a Mayor',
        optPriceDesc: 'Precio: Mayor a Menor',
        optRating: 'Mejor Calificados (★ 4.9+)',
        searchBtn: '🔍 Buscar Ofertas',
        tabListings: '🏷️ Paquetes Disponibles',
        tabBookings: '🎟️ Mis Reservas y Billetes',
        tabItineraries: '🗺️ Itinerarios de Viaje',
        tabSupport: '💬 Chat y Soporte con Agente',
        tabVouchers: '🎁 Canjear Cupón',
        tabNotif: '🔔 Centro de Notificaciones',
        showcaseTitle: 'Paquetes Exclusivos Seleccionados',
        showcaseSubtitle: 'Chalets junto al lago, villas sobre el agua, safaris y vuelos directos.',
        fpAll: 'Todas las Ofertas',
        fpHotel: '🏨 Hoteles',
        fpFlight: '✈️ Vuelos',
        fpCar: '🚗 Autos',
        startingFrom: 'Desde',
        bookNow: 'Reservar Ahora',
        unitFlight: '/ pasajero',
        unitHotel: '/ noche',
        unitCar: '/ día',
        noListings: '🔍 No se encontraron viajes',
        noListingsSub: 'Intente ajustar su búsqueda de destino o elija "Todas las Ofertas".',
        cardHlTitle: '🆘 Líneas Telefónicas de Emergencia 24/7 (Resolución de Problemas)',
        cardHlDesc: '¿Necesita ayuda con reservas, vuelos o emergencias? Comuníquese con nuestras líneas:',
        toastLangChanged: 'Idioma cambiado a Español.'
    },
    'fr': {
        name: 'Français',
        flag: '🇫🇷',
        announcement: '✨ <strong>SPÉCIAL HIVER :</strong> -20% sur les Alpes suisses, Thaïlande et forfaits de luxe ! Code <strong>SHIV20</strong>',
        hl1: '📞 Assistance 1 (Gratuit) :',
        hl2: '💬 Assistance 2 (WhatsApp) :',
        portal: 'Portail :',
        roleTraveler: 'Voyageur',
        heroBadge1: '⭐ Plateforme de Voyage Mieux Notée',
        heroBadge2: '100% Séjours & Vols Vérifiés',
        heroTitle: 'Où le luxe rencontre l\'aventure.',
        heroDesc: 'Réservez des séjours exclusifs, vols directs et locations de voitures à Ayodhya, Alpes suisses, Thaïlande, Bali et Dubaï.',
        stAll: '✨ Toutes les Expériences',
        stHotel: '🏨 Hôtels & Villas de Luxe',
        stFlight: '✈️ Vols Directs',
        stCar: '🚗 4x4 & Voitures de Luxe',
        whereTo: 'Où allez-vous ?',
        searchPlaceholder: 'Rechercher une destination (ex. Alpes suisses, Thaïlande, Dubaï...)',
        checkIn: 'Arrivée / Date',
        sortOffers: 'Trier les Offres',
        optFeatured: 'En Vedette',
        optPriceAsc: 'Prix : Croissant',
        optPriceDesc: 'Prix : Décroissant',
        optRating: 'Mieux Notés (★ 4.9+)',
        searchBtn: '🔍 Rechercher',
        tabListings: '🏷️ Forfaits Disponibles',
        tabBookings: '🎟️ Mes Réservations & Billets',
        tabItineraries: '🗺️ Itinéraires',
        tabSupport: '💬 Support & Questions',
        tabVouchers: '🎁 Utiliser un Bon',
        tabNotif: '🔔 Centre de Notifications',
        showcaseTitle: 'Séjours & Expériences Exclusives',
        showcaseSubtitle: 'Chalets en montagne, villas sur l\'eau et vols directs vers les plus belles destinations.',
        fpAll: 'Toutes les Offres',
        fpHotel: '🏨 Hôtels',
        fpFlight: '✈️ Vols',
        fpCar: '🚗 Voitures',
        startingFrom: 'À partir de',
        bookNow: 'Réserver',
        unitFlight: '/ passager',
        unitHotel: '/ nuit',
        unitCar: '/ jour',
        noListings: '🔍 Aucun forfait trouvé',
        noListingsSub: 'Essayez de modifier votre recherche ou sélectionnez "Toutes les Offres".',
        cardHlTitle: '🆘 Assistance Voyageur Dédiée 24/7 (Résolution de Problèmes)',
        cardHlDesc: 'Besoin d\'aide avec vos réservations ou en cas d\'urgence ? Contactez nos équipes 24/7 :',
        toastLangChanged: 'Langue changée en Français.'
    },
    'de': {
        name: 'Deutsch',
        flag: '🇩🇪',
        announcement: '✨ <strong>WINTER-SPEZIAL:</strong> 20% Rabatt auf Schweizer Alpen, Thailand und Luxus-Pakete! Code <strong>SHIV20</strong>',
        hl1: '📞 Hotline 1 (Gebührenfrei):',
        hl2: '💬 Hotline 2 (WhatsApp):',
        portal: 'Portal:',
        roleTraveler: 'Reisender',
        heroBadge1: '⭐ Bestbewertete Reiseplattform',
        heroBadge2: '100% Verifizierte Hotels & Flüge',
        heroTitle: 'Wo Luxus auf Abenteuer trifft.',
        heroDesc: 'Buchen Sie authentische Unterkünfte, Direktflüge und Mietwagen in den Schweizer Alpen, Thailand, Jaipur, Bali und Dubai.',
        stAll: '✨ Alle Erlebnisse',
        stHotel: '🏨 Luxushotels & Villen',
        stFlight: '✈️ Direktflüge',
        stCar: '🚗 4x4 & Mietwagen',
        whereTo: 'Wohin soll es gehen?',
        searchPlaceholder: 'Zielort suchen (z.B. Schweizer Alpen, Thailand, Manali, Dubai...)',
        checkIn: 'Check-in / Datum',
        sortOffers: 'Angebote Sortieren',
        optFeatured: 'Beliebteste Zuerst',
        optPriceAsc: 'Preis: Aufsteigend',
        optPriceDesc: 'Preis: Absteigend',
        optRating: 'Bestbewertet (★ 4.9+)',
        searchBtn: '🔍 Angebote Suchen',
        tabListings: '🏷️ Verfügbare Pakete',
        tabBookings: '🎟️ Meine Buchungen & Tickets',
        tabItineraries: '🗺️ Reiserouten',
        tabSupport: '💬 Support & Chat',
        tabVouchers: '🎁 Gutschein Einlösen',
        tabNotif: '🔔 Benachrichtigungszentrum',
        showcaseTitle: 'Exklusive Handverlesene Reisepakete',
        showcaseSubtitle: 'Luxus-Chalets am See, Überwasservillen und Direktflüge weltweit.',
        fpAll: 'Alle Angebote',
        fpHotel: '🏨 Hotels',
        fpFlight: '✈️ Flüge',
        fpCar: '🚗 Mietwagen',
        startingFrom: 'Ab',
        bookNow: 'Jetzt Buchen',
        unitFlight: '/ Passagier',
        unitHotel: '/ Nacht',
        unitCar: '/ Tag',
        noListings: '🔍 Keine Angebote gefunden',
        noListingsSub: 'Passen Sie Ihre Suche an oder wählen Sie "Alle Angebote".',
        cardHlTitle: '🆘 24/7 Notfall-Hotline für Reisende (Soforthilfe)',
        cardHlDesc: 'Dringende Hilfe bei Buchungen, Flügen oder Notfällen? Unser Team ist 24/7 für Sie da:',
        toastLangChanged: 'Sprache auf Deutsch umgestellt.'
    }
};

function toggleLanguageDropdown() {
    const dd = document.getElementById('langDropdown');
    if (!dd) return;
    if (dd.style.display === 'none' || !dd.style.display) {
        dd.style.display = 'block';
    } else {
        dd.style.display = 'none';
    }
}

// Click outside to close language dropdown
document.addEventListener('click', (e) => {
    const dd = document.getElementById('langDropdown');
    const btn = document.getElementById('langBtn');
    if (dd && btn && dd.style.display === 'block') {
        if (!dd.contains(e.target) && !btn.contains(e.target)) {
            dd.style.display = 'none';
        }
    }
});

function selectLanguage(lang, showToastMsg = true) {
    if (!translations[lang]) lang = 'en';
    currentLanguage = lang;
    try {
        localStorage.setItem('voyage_lang', lang);
    } catch (e) {}

    // Update active dropdown items
    document.querySelectorAll('.lang-opt-item').forEach(b => b.classList.remove('active'));
    const activeOpt = document.getElementById(`lang-opt-${lang}`);
    if (activeOpt) activeOpt.classList.add('active');

    // Update active quick pills
    document.querySelectorAll('.quick-lang-pill').forEach(b => b.classList.remove('active'));
    const activePill = document.getElementById(`qlp-${lang}`);
    if (activePill) activePill.classList.add('active');

    // Close dropdown
    const dd = document.getElementById('langDropdown');
    if (dd) dd.style.display = 'none';

    // Apply translations across DOM
    applyTranslations();

    // Re-render listings with translated labels (Book Now / Starting from / units)
    if (allListings && allListings.length > 0) {
        filterListings();
    }

    if (showToastMsg) {
        const t = translations[currentLanguage];
        showToast(t.toastLangChanged || `Language changed to ${t.name}`, 'success');
    }
}

function applyTranslations() {
    const t = translations[currentLanguage] || translations['en'];

    // Header & Announcement
    const ann = document.getElementById('topAnnouncementText');
    if (ann && t.announcement) ann.innerHTML = t.announcement;

    const hl1 = document.getElementById('hl1Label');
    if (hl1 && t.hl1) hl1.textContent = t.hl1;
    const hl2 = document.getElementById('hl2Label');
    if (hl2 && t.hl2) hl2.textContent = t.hl2;

    const portal = document.getElementById('portalRoleLabel');
    if (portal && t.portal) portal.textContent = t.portal;
    const rTrav = document.getElementById('lblRoleTraveler');
    if (rTrav && t.roleTraveler) rTrav.textContent = t.roleTraveler;

    // Current Lang Label
    const curLang = document.getElementById('currentLangLabel');
    if (curLang) curLang.textContent = t.name;

    // Hero
    const hb1 = document.getElementById('heroBadgeText1');
    if (hb1 && t.heroBadge1) hb1.textContent = t.heroBadge1;
    const hb2 = document.getElementById('heroBadgeText2');
    if (hb2 && t.heroBadge2) hb2.textContent = t.heroBadge2;
    const ht = document.getElementById('heroTitle');
    if (ht && t.heroTitle) ht.textContent = t.heroTitle;
    const hd = document.getElementById('heroDesc');
    if (hd && t.heroDesc) hd.textContent = t.heroDesc;

    // Search Tabs
    const sbAll = document.getElementById('stBtnAll');
    if (sbAll && t.stAll) sbAll.textContent = t.stAll;
    const sbHot = document.getElementById('stBtnHotel');
    if (sbHot && t.stHotel) sbHot.textContent = t.stHotel;
    const sbFli = document.getElementById('stBtnFlight');
    if (sbFli && t.stFlight) sbFli.textContent = t.stFlight;
    const sbCar = document.getElementById('stBtnCar');
    if (sbCar && t.stCar) sbCar.textContent = t.stCar;

    // Search Inputs
    const lblWhere = document.getElementById('lblWhereTo');
    if (lblWhere && t.whereTo) lblWhere.textContent = t.whereTo;
    const sInput = document.getElementById('searchInput');
    if (sInput && t.searchPlaceholder) sInput.placeholder = t.searchPlaceholder;
    const lblCheck = document.getElementById('lblCheckIn');
    if (lblCheck && t.checkIn) lblCheck.textContent = t.checkIn;
    const lblSort = document.getElementById('lblSortOffers');
    if (lblSort && t.sortOffers) lblSort.textContent = t.sortOffers;

    // Sort Options
    const optFeat = document.getElementById('optSortFeatured');
    if (optFeat && t.optFeatured) optFeat.textContent = t.optFeatured;
    const optAsc = document.getElementById('optSortPriceAsc');
    if (optAsc && t.optPriceAsc) optAsc.textContent = t.optPriceAsc;
    const optDesc = document.getElementById('optSortPriceDesc');
    if (optDesc && t.optPriceDesc) optDesc.textContent = t.optPriceDesc;
    const optRat = document.getElementById('optSortRating');
    if (optRat && t.optRating) optRat.textContent = t.optRating;

    // Search Button
    const btnSearch = document.getElementById('btnSearchDeals');
    if (btnSearch && t.searchBtn) btnSearch.textContent = t.searchBtn;

    // Sub-Tabs
    const tList = document.getElementById('txtTabListings');
    if (tList && t.tabListings) tList.textContent = t.tabListings;
    const tBook = document.getElementById('txtTabBookings');
    if (tBook && t.tabBookings) tBook.textContent = t.tabBookings;
    const tItin = document.getElementById('txtTabItineraries');
    if (tItin && t.tabItineraries) tItin.textContent = t.tabItineraries;
    const tSupp = document.getElementById('txtTabSupport');
    if (tSupp && t.tabSupport) tSupp.textContent = t.tabSupport;
    const tVouc = document.getElementById('txtTabVouchers');
    if (tVouc && t.tabVouchers) tVouc.textContent = t.tabVouchers;
    const tNoti = document.getElementById('txtTabNotif');
    if (tNoti && t.tabNotif) tNoti.textContent = t.tabNotif;

    // Showcase
    const scTitle = document.getElementById('showcaseTitle');
    if (scTitle && t.showcaseTitle) scTitle.textContent = t.showcaseTitle;
    const scSub = document.getElementById('showcaseSubtitle');
    if (scSub && t.showcaseSubtitle) scSub.textContent = t.showcaseSubtitle;

    // Filter Pills
    const fpAll = document.getElementById('fpBtnAll');
    if (fpAll && t.fpAll) fpAll.textContent = t.fpAll;
    const fpHot = document.getElementById('fpBtnHotel');
    if (fpHot && t.fpHotel) fpHot.textContent = t.fpHotel;
    const fpFli = document.getElementById('fpBtnFlight');
    if (fpFli && t.fpFlight) fpFli.textContent = t.fpFlight;
    const fpCar = document.getElementById('fpBtnCar');
    if (fpCar && t.fpCar) fpCar.textContent = t.fpCar;

    // Helpline Cards
    const cardTitle = document.getElementById('cardHelplineTitle');
    if (cardTitle && t.cardHlTitle) cardTitle.textContent = t.cardHlTitle;
    const cardDesc = document.getElementById('cardHelplineDesc');
    if (cardDesc && t.cardHlDesc) cardDesc.textContent = t.cardHlDesc;
    const ch1 = document.getElementById('cardHl1Text');
    if (ch1 && t.hl1) ch1.textContent = t.hl1;
    const ch2 = document.getElementById('cardHl2Text');
    if (ch2 && t.hl2) ch2.textContent = t.hl2;
}


