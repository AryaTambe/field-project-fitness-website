const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory storage (temporary until MongoDB is set up)
let appointments = [];
let contacts = [];

console.log('🏥 =======================================');
console.log('🏥 DR. ANAND\'S FITNESS ART - RUNNING');
console.log('🏥 Simple Version - Working Perfectly');
console.log('🏥 =======================================');

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'Dr. Anand\'s Fitness Art is running perfectly! ✨', 
        timestamp: new Date().toISOString(),
        database: {
            status: 'In-Memory Storage',
            appointments: appointments.length,
            contacts: contacts.length
        },
        features: ['Website Live', 'Contact Forms Working', 'Appointment Booking Active']
    });
});

// Get business info
app.get('/api/info', (req, res) => {
    res.json({
        business: {
            name: 'Dr. Anand\'s Fitness Art',
            tagline: 'Fitness, Nutrition & Healing',
            phone: '+91-99999-99999',
            email: 'info@dranandfitness.com',
            address: '123 Fitness Street, Health City',
            hours: 'Mon-Fri: 5AM-10PM, Sat-Sun: 6AM-8PM'
        }
    });
});

// Get appointments (admin)
app.get('/api/appointments', (req, res) => {
    res.json({ 
        success: true, 
        count: appointments.length, 
        data: appointments 
    });
});

// Create appointment
app.post('/api/appointments', (req, res) => {
    const { name, email, phone, service, date, time, message } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and phone are required'
        });
    }

    const appointment = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        service: service || 'General Consultation',
        preferred_date: date || null,
        preferred_time: time || null,
        message: message || '',
        status: 'pending',
        created_at: new Date().toISOString()
    };

    appointments.push(appointment);
    console.log('✅ Appointment created:', appointment.name);

    res.status(201).json({
        success: true,
        message: 'Appointment request submitted successfully! 🎉',
        data: {
            id: appointment.id,
            name: appointment.name,
            service: appointment.service
        }
    });
});

// Contact form
app.post('/api/contact', (req, res) => {
    const { name, email, phone, service, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and message are required'
        });
    }

    const contact = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        service: service || null,
        message: message.trim(),
        created_at: new Date().toISOString()
    };

    contacts.push(contact);
    console.log('✅ Contact saved:', contact.name);

    res.json({
        success: true,
        message: 'Thank you for your message! We\'ll get back to you within 24 hours. 📧'
    });
});

// Get contacts (admin)
app.get('/api/contacts', (req, res) => {
    res.json({ 
        success: true, 
        count: contacts.length, 
        data: contacts 
    });
});

// Simple admin panel
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin - Dr. Anand's Fitness Art</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 font-sans">
            <header class="bg-yellow-500 text-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 py-6">
                    <h1 class="text-3xl font-bold flex items-center">
                        <span class="mr-2">🏥</span>
                        Dr. Anand's Fitness Art - Admin Dashboard
                    </h1>
                    <p class="text-yellow-100 mt-1">Simple Version - Working Perfectly!</p>
                </div>
            </header>

            <div class="max-w-7xl mx-auto px-4 py-8">
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Appointments</p>
                                <p class="text-3xl font-bold text-gray-900">${appointments.length}</p>
                            </div>
                            <div class="text-yellow-500 text-4xl">📅</div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Contacts</p>
                                <p class="text-3xl font-bold text-gray-900">${contacts.length}</p>
                            </div>
                            <div class="text-blue-500 text-4xl">📧</div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Website Status</p>
                                <p class="text-lg font-semibold text-green-600">✅ Live & Working</p>
                            </div>
                            <div class="text-green-500 text-4xl">🌐</div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Server</p>
                                <p class="text-lg font-semibold text-green-600">✅ Active</p>
                            </div>
                            <div class="text-green-500 text-4xl">⚡</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- Recent Appointments -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h2 class="text-lg font-semibold text-gray-900">📅 Recent Appointments</h2>
                        </div>
                        <div class="p-6">
                            ${appointments.length > 0 ? 
                                appointments.slice(-5).map(apt => 
                                    `<div class="mb-4 p-4 bg-gray-50 rounded-lg">
                                        <h3 class="font-semibold text-gray-900">${apt.name}</h3>
                                        <p class="text-sm text-gray-600">${apt.service}</p>
                                        <p class="text-sm text-gray-600">📧 ${apt.email} | 📱 ${apt.phone}</p>
                                        <p class="text-xs text-gray-500 mt-2">${new Date(apt.created_at).toLocaleString()}</p>
                                    </div>`
                                ).join('') 
                                : '<p class="text-gray-500">No appointments yet. Try booking one from the main website!</p>'
                            }
                        </div>
                    </div>

                    <!-- Recent Contacts -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h2 class="text-lg font-semibold text-gray-900">📧 Recent Contacts</h2>
                        </div>
                        <div class="p-6">
                            ${contacts.length > 0 ? 
                                contacts.slice(-5).map(contact => 
                                    `<div class="mb-4 p-4 bg-gray-50 rounded-lg">
                                        <h3 class="font-semibold text-gray-900">${contact.name}</h3>
                                        <p class="text-sm text-gray-600">📧 ${contact.email}</p>
                                        <p class="text-sm text-gray-700 mt-2">${contact.message.substring(0, 100)}...</p>
                                        <p class="text-xs text-gray-500 mt-2">${new Date(contact.created_at).toLocaleString()}</p>
                                    </div>`
                                ).join('') 
                                : '<p class="text-gray-500">No contacts yet. Try the contact form on the main website!</p>'
                            }
                        </div>
                    </div>
                    
                </div>

                <div class="mt-8 text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                    <p class="text-gray-600">🏥 Dr. Anand's Fitness Art - Professional Website</p>
                    <p class="text-gray-500 text-sm mt-2">Website is live and working perfectly! MongoDB can be added later.</p>
                    <div class="mt-4">
                        <a href="/" class="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg mr-4">🏠 Back to Website</a>
                        <button onclick="window.location.reload()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">🔄 Refresh</button>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🏥 Website: http://localhost:${PORT}`);
    console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log('💾 Storage: In-memory (working perfectly)');
    console.log('🏥 =======================================');
});
