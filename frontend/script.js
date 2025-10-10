// Dr. Anand's Fitness Art - Enhanced JavaScript with Backend Integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Script loaded successfully');

    // Configuration
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api' 
        : '/api';

    console.log('🌐 API Base URL:', API_BASE_URL);

    // Initialize components
    initNavigation();
    initScrollEffects();
    initCounters();
    initFormHandling();
    initServiceButtons();
    testBackendConnection();

    // Navigation functionality
    function initNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Mobile menu toggle
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function() {
                navMenu.classList.toggle('active');

                // Animate hamburger
                const spans = this.querySelectorAll('span');
                if (navMenu.classList.contains('active')) {
                    spans[0] && (spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)');
                    spans[1] && (spans[1].style.opacity = '0');
                    spans[2] && (spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)');
                } else {
                    spans[0] && (spans[0].style.transform = 'none');
                    spans[1] && (spans[1].style.opacity = '1');
                    spans[2] && (spans[2].style.transform = 'none');
                }
            });
        }

        // Close mobile menu when clicking links
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (navMenu) {
                    navMenu.classList.remove('active');
                    // Reset hamburger
                    if (navToggle) {
                        const spans = navToggle.querySelectorAll('span');
                        spans[0] && (spans[0].style.transform = 'none');
                        spans[1] && (spans[1].style.opacity = '1');
                        spans[2] && (spans[2].style.transform = 'none');
                    }
                }
            });
        });

        // Navbar scroll effects
        const navbar = document.getElementById('navbar');
        if (navbar) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }

        // Active link highlighting
        const sections = document.querySelectorAll('section[id]');
        if (sections.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const currentId = entry.target.getAttribute('id');
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${currentId}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, {
                rootMargin: '-50% 0px -50% 0px'
            });

            sections.forEach(section => {
                observer.observe(section);
            });
        }
    }

    // Smooth scrolling
    function initScrollEffects() {
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    const navbar = document.getElementById('navbar');
                    const offset = navbar ? navbar.offsetHeight + 20 : 70;
                    const targetPosition = target.offsetTop - offset;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Counter animations for stats
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        let hasAnimated = false;

        if (counters.length === 0) return;

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;
                    animateCounters();
                }
            });
        }, {
            threshold: 0.5
        });

        const statsSection = document.querySelector('.stats-grid');
        if (statsSection) {
            counterObserver.observe(statsSection);
        }

        function animateCounters() {
            counters.forEach((counter, index) => {
                const target = parseInt(counter.getAttribute('data-target')) || 0;
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                // Stagger the animations
                setTimeout(() => {
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        counter.textContent = Math.floor(current);
                    }, 16);
                }, index * 200);
            });
        }
    }

    // Enhanced form handling with backend
    function initFormHandling() {
        const form = document.getElementById('contact-form');

        if (!form) {
            console.log('📝 Contact form not found');
            return;
        }

        console.log('📝 Contact form initialized');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📤 Form submitted');

            const formData = new FormData(form);
            const data = {
                name: formData.get('name')?.trim(),
                email: formData.get('email')?.trim(),
                phone: formData.get('phone')?.trim(),
                service: formData.get('service'),
                message: formData.get('message')?.trim()
            };

            console.log('📋 Form data:', data);

            // Validate required fields
            if (!data.name || !data.email || !data.message) {
                showNotification('❌ Please fill in all required fields (Name, Email, Message)', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('❌ Please enter a valid email address', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
            const btnLoader = submitBtn ? submitBtn.querySelector('.btn-loader') : null;

            // Show loading state
            if (submitBtn) {
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
            }
            if (btnLoader) btnLoader.style.display = 'inline-block';
            if (btnText) btnText.style.display = 'none';

            try {
                console.log('🌐 Sending to:', `${API_BASE_URL}/contact`);

                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                console.log('📡 Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('📨 Response:', result);

                if (result.success) {
                    showNotification('✅ ' + result.message, 'success');
                    form.reset();
                } else {
                    showNotification('❌ ' + (result.message || 'Failed to send message'), 'error');
                }

            } catch (error) {
                console.error('❌ Error:', error);
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    showNotification('❌ Unable to connect to server. Please check your connection and try again.', 'error');
                } else {
                    showNotification('❌ Network error: ' + error.message, 'error');
                }
            } finally {
                // Reset button
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
                if (btnLoader) btnLoader.style.display = 'none';
                if (btnText) btnText.style.display = 'inline-block';
            }
        });
    }

    // Service booking buttons
    function initServiceButtons() {
        const serviceButtons = document.querySelectorAll('.service-btn');
        console.log('🔘 Service buttons found:', serviceButtons.length);

        serviceButtons.forEach(button => {
            button.addEventListener('click', function() {
                const serviceName = this.getAttribute('data-service') || this.textContent.trim();
                console.log('🎯 Service clicked:', serviceName);
                showQuickBookingModal(serviceName);
            });
        });
    }

    // Quick booking modal
    function showQuickBookingModal(serviceName) {
        const name = prompt(`Book ${serviceName}\n\nYour Name:`);
        if (!name || !name.trim()) return;

        const email = prompt('Your Email:');
        if (!email || !email.trim()) return;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        const phone = prompt('Your Phone:');
        if (!phone || !phone.trim()) return;

        bookAppointment({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            service: serviceName,
            message: `Quick booking for ${serviceName} service`
        });
    }

    // Book appointment function
    async function bookAppointment(appointmentData) {
        console.log('📅 Booking appointment:', appointmentData);

        try {
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            console.log('📡 Appointment response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📅 Appointment result:', result);

            if (result.success) {
                showNotification('🎉 ' + result.message, 'success');
            } else {
                showNotification('❌ ' + (result.message || 'Failed to book appointment'), 'error');
            }

        } catch (error) {
            console.error('❌ Error booking appointment:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                showNotification('❌ Unable to connect to server. Please try again later.', 'error');
            } else {
                showNotification('❌ Booking failed: ' + error.message, 'error');
            }
        }
    }

    // Enhanced notification system
    function showNotification(message, type = 'info') {
        console.log('🔔 Notification:', type, message);

        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add CSS if not present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    padding: 16px 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    min-width: 300px;
                    max-width: 500px;
                    opacity: 0;
                    transform: translateX(400px);
                    transition: all 0.3s ease;
                }
                .notification.show {
                    opacity: 1;
                    transform: translateX(0);
                }
                .notification.success {
                    border-color: #22c55e;
                    background: #f0fdf4;
                    color: #15803d;
                }
                .notification.error {
                    border-color: #ef4444;
                    background: #fef2f2;
                    color: #dc2626;
                }
                .notification.info {
                    border-color: #3b82f6;
                    background: #eff6ff;
                    color: #1d4ed8;
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .notification-message {
                    flex: 1;
                    font-weight: 500;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .notification-close:hover {
                    opacity: 1;
                    background: rgba(0,0,0,0.1);
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-hide after 7 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 7000);
    }

    // Test backend connection
    async function testBackendConnection() {
        try {
            console.log('🔍 Testing backend connection...');
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Backend connected:', result.message);
            console.log('📊 Database status:', result.database?.status);

            // Show connection status in corner (optional)
            const statusIndicator = document.createElement('div');
            statusIndicator.id = 'connection-status';
            statusIndicator.innerHTML = '🟢 Connected';
            statusIndicator.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#22c55e;color:white;padding:4px 8px;border-radius:12px;font-size:12px;z-index:1000;';
            document.body.appendChild(statusIndicator);

            setTimeout(() => {
                if (statusIndicator.parentNode) {
                    statusIndicator.remove();
                }
            }, 3000);

        } catch (error) {
            console.log('⚠️ Backend connection failed:', error.message);
            console.log('⚠️ Some features may not work properly.');

            // Show disconnected status
            const statusIndicator = document.createElement('div');
            statusIndicator.id = 'connection-status';
            statusIndicator.innerHTML = '🔴 Offline';
            statusIndicator.style.cssText = 'position:fixed;bottom:10px;left:10px;background:#ef4444;color:white;padding:4px 8px;border-radius:12px;font-size:12px;z-index:1000;';
            document.body.appendChild(statusIndicator);

            setTimeout(() => {
                if (statusIndicator.parentNode) {
                    statusIndicator.remove();
                }
            }, 5000);
        }
    }

    // Global functions
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const navbar = document.getElementById('navbar');
            const offset = navbar ? navbar.offsetHeight + 20 : 70;
            const targetPosition = section.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Enhanced service loading
    async function loadServices() {
        try {
            console.log('🔄 Loading services from backend...');
            const response = await fetch(`${API_BASE_URL}/services`);

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && result.data.length > 0) {
                    console.log('🎯 Services loaded:', result.data.length);
                    // Could dynamically update services here
                    return result.data;
                }
            }
        } catch (error) {
            console.log('📋 Using static services (backend not available)');
        }
        return null;
    }

    // Initialize services
    loadServices();

    console.log('🎉 All components initialized successfully');
});