 // Dr. Anand's Fitness Art - Enhanced JavaScript with Backend Integration
document.addEventListener('DOMContentLoaded', function() {
    
    // Configuration
    const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : '/api';
    
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
        navToggle?.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger
            const spans = this.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close mobile menu when clicking links
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                // Reset hamburger
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
        
        // Navbar scroll effects
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Active link highlighting
        const sections = document.querySelectorAll('section[id]');
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
    
    // Smooth scrolling
    function initScrollEffects() {
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const navbar = document.getElementById('navbar');
                    const offset = navbar.offsetHeight + 20;
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
                const target = parseInt(counter.getAttribute('data-target'));
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
        
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    service: formData.get('service'),
                    message: formData.get('message')
                };
                
                const submitBtn = form.querySelector('button[type="submit"]');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                
                // Show loading state
                submitBtn.classList.add('loading');
                submitBtn.disabled = true;
                btnLoader.style.display = 'inline-block';
                btnText.style.display = 'none';
                
                try {
                    const response = await fetch(`${API_BASE_URL}/contact`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showNotification('✅ ' + result.message, 'success');
                        form.reset();
                    } else {
                        showNotification('❌ ' + result.message, 'error');
                    }
                    
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('❌ Network error. Please try again later.', 'error');
                } finally {
                    // Reset button
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                    btnLoader.style.display = 'none';
                    btnText.style.display = 'inline-block';
                }
            });
        }
    }
    
    // Service booking buttons
    function initServiceButtons() {
        const serviceButtons = document.querySelectorAll('.service-btn');
        
        serviceButtons.forEach(button => {
            button.addEventListener('click', function() {
                const serviceName = this.getAttribute('data-service');
                showQuickBookingModal(serviceName);
            });
        });
    }
    
    // Quick booking modal
    function showQuickBookingModal(serviceName) {
        const name = prompt(`Book ${serviceName}\n\nYour Name:`);
        if (!name) return;
        
        const email = prompt('Your Email:');
        if (!email) return;
        
        const phone = prompt('Your Phone:');
        if (!phone) return;
        
        bookAppointment({
            name,
            email,
            phone,
            service: serviceName,
            message: `Interested in ${serviceName} service`
        });
    }
    
    // Book appointment function
    async function bookAppointment(appointmentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('🎉 ' + result.message, 'success');
            } else {
                showNotification('❌ ' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error booking appointment:', error);
            showNotification('❌ Failed to book appointment. Please try again.', 'error');
        }
    }
    
    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    // Test backend connection
    async function testBackendConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            const result = await response.json();
            console.log('✅ Backend connected:', result.message);
        } catch (error) {
            console.log('⚠️ Backend not connected. Some features may not work.');
        }
    }
    
    // Global functions
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const navbar = document.getElementById('navbar');
            const offset = navbar.offsetHeight + 20;
            const targetPosition = section.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };
    
    // Load services from backend (optional enhancement)
    async function loadServices() {
        try {
            const response = await fetch(`${API_BASE_URL}/services`);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                // Could update services dynamically here
                console.log('Services loaded:', result.data.length);
            }
        } catch (error) {
            console.log('Using static services');
        }
    }
    
    loadServices();
});

