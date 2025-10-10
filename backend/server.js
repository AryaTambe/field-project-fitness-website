const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection with your credentials
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Aryya:^YHNmju7@gym-project-database.plkznus.mongodb.net/dranandfitness?retryWrites=true&w=majority&appName=Gym-Project-Database';

// File paths for persistent memory storage (deployment-safe)
const DATA_DIR = path.join(__dirname, 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Ensure data directory exists with error handling
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('📁 Created data directory');
    }
} catch (error) {
    console.log('⚠️ Could not create data directory:', error.message);
}

// Helper functions for file operations with error handling
function loadDataFromFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.log(`⚠️ Error loading data from ${filePath}:`, error.message);
        return [];
    }
}

function saveDataToFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.log(`⚠️ Error saving data to ${filePath}:`, error.message);
        return false;
    }
}

// In-memory storage (loads from files on startup)
let appointments = loadDataFromFile(APPOINTMENTS_FILE);
let contacts = loadDataFromFile(CONTACTS_FILE);
let isMongoConnected = false;

console.log(`📁 Loaded ${appointments.length} appointments from file storage`);
console.log(`📁 Loaded ${contacts.length} contacts from file storage`);

// MongoDB connection
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    }).then(() => {
        console.log('✅ MongoDB connected successfully');
        isMongoConnected = true;
    }).catch((err) => {
        console.log('⚠️ MongoDB connection failed, using persistent memory storage');
        console.log('Error:', err.message);
        isMongoConnected = false;
    });
}

// MongoDB Schemas
const AppointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    service: { type: String, default: 'General Consultation' },
    preferred_date: { type: String, default: null },
    preferred_time: { type: String, default: null },
    message: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: null },
    service: { type: String, default: null },
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Create models immediately
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Contact = mongoose.model('Contact', ContactSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

console.log('🚀 =======================================');
console.log('🚀 DR. ANAND\'S FITNESS ART - EXPORT FIXED');
console.log('🚀 Yellow & White Theme - No Login Required');
console.log('🚀 =======================================');

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Health check
app.get('/api/health', async (req, res) => {
    let appointmentCount = 0;
    let contactCount = 0;
    let dataSource = 'Unknown';

    if (isMongoConnected) {
        try {
            appointmentCount = await Appointment.countDocuments();
            contactCount = await Contact.countDocuments();
            dataSource = 'MongoDB Connected';
        } catch (error) {
            appointmentCount = appointments.length;
            contactCount = contacts.length;
            dataSource = 'MongoDB Error - Using Memory';
        }
    } else {
        appointmentCount = appointments.length;
        contactCount = contacts.length;
        dataSource = fs.existsSync(DATA_DIR) ? 'Persistent Memory Storage' : 'Memory Only';
    }

    res.json({ 
        message: 'Dr. Anand\'s Fitness Art is running perfectly!',
        timestamp: new Date().toISOString(),
        database: {
            status: dataSource,
            appointments: appointmentCount,
            contacts: contactCount
        },
        theme: 'Yellow & White',
        admin_access: '/admin (No login required)'
    });
});

// Enhanced admin dashboard with WORKING export functionality
app.get('/admin', async (req, res) => {
    let totalAppointments = 0;
    let totalContacts = 0;
    let todayAppointments = 0;
    let todayContacts = 0;
    let recentAppointments = [];
    let recentContacts = [];

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (isMongoConnected) {
        try {
            totalAppointments = await Appointment.countDocuments();
            totalContacts = await Contact.countDocuments();
            todayAppointments = await Appointment.countDocuments({ created_at: { $gte: startOfDay } });
            todayContacts = await Contact.countDocuments({ created_at: { $gte: startOfDay } });
            recentAppointments = await Appointment.find().sort({ created_at: -1 }).limit(5);
            recentContacts = await Contact.find().sort({ created_at: -1 }).limit(5);
        } catch (error) {
            totalAppointments = appointments.length;
            totalContacts = contacts.length;
            todayAppointments = appointments.filter(apt => new Date(apt.created_at) >= startOfDay).length;
            todayContacts = contacts.filter(contact => new Date(contact.created_at) >= startOfDay).length;
            recentAppointments = appointments.slice(-5).reverse();
            recentContacts = contacts.slice(-5).reverse();
        }
    } else {
        totalAppointments = appointments.length;
        totalContacts = contacts.length;
        todayAppointments = appointments.filter(apt => new Date(apt.created_at) >= startOfDay).length;
        todayContacts = contacts.filter(contact => new Date(contact.created_at) >= startOfDay).length;
        recentAppointments = appointments.slice(-5).reverse();
        recentContacts = contacts.slice(-5).reverse();
    }

    const dbStatus = isMongoConnected ? 'MongoDB Connected' : 'Persistent Memory Storage';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Dashboard - Dr. Anand's Fitness Art</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%);
                }
                .admin-card {
                    background: white;
                    border: 2px solid #fef3c7;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
                    transition: all 0.3s ease;
                }
                .admin-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
                }
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #f59e0b;
                }
                .export-btn {
                    transition: all 0.3s ease;
                }
                .export-btn:hover {
                    transform: translateY(-1px);
                }
                .export-btn:active {
                    transform: translateY(0);
                }
            </style>
        </head>
        <body class="bg-amber-50 text-gray-800 min-h-screen">

            <!-- Header -->
            <header class="bg-white border-b-2 border-amber-200 sticky top-0 z-40 shadow-lg">
                <div class="max-w-7xl mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold text-lg">DR</span>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-amber-600">Dr. Anand's Fitness Art</h1>
                                <p class="text-gray-600 text-sm">Admin Dashboard - Export Fixed</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-right text-xs">
                                <div class="text-sm font-semibold ${isMongoConnected ? 'text-green-600' : 'text-blue-600'}">
                                    🗄️ ${dbStatus}
                                </div>
                            </div>
                            <a href="/" class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold">
                                View Website
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <div class="max-w-7xl mx-auto px-4 py-8">

                <!-- Welcome Banner -->
                <div class="mb-8">
                    <div class="admin-card ${isMongoConnected ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-3 h-3 ${isMongoConnected ? 'bg-green-500' : 'bg-blue-500'} rounded-full animate-pulse"></div>
                                <div>
                                    <h3 class="font-bold ${isMongoConnected ? 'text-green-800' : 'text-blue-800'}">
                                        Admin Dashboard Active ✨
                                    </h3>
                                    <p class="text-sm ${isMongoConnected ? 'text-green-700' : 'text-blue-700'}">
                                        ${isMongoConnected ? 'MongoDB Database Connected & Operational' : 'Persistent Memory Storage Active'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="mb-8">
                    <div class="flex flex-wrap gap-4">
                        <a href="/" class="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold">
                            🏠 View Website
                        </a>
                        <button onclick="exportData('appointments')" 
                                class="export-btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                            📊 Export Appointments
                        </button>
                        <button onclick="exportData('contacts')" 
                                class="export-btn bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">
                            📧 Export Contacts
                        </button>
                        <a href="/api/health" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                            🔍 System Health
                        </a>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="admin-card text-center">
                        <div class="text-4xl mb-2">📅</div>
                        <div class="stat-number">${totalAppointments}</div>
                        <div class="text-gray-600 font-medium">Total Appointments</div>
                        <div class="text-xs text-gray-500 mt-1">+${todayAppointments} today</div>
                    </div>

                    <div class="admin-card text-center">
                        <div class="text-4xl mb-2">📈</div>
                        <div class="stat-number">${todayAppointments}</div>
                        <div class="text-gray-600 font-medium">Today's Bookings</div>
                        <div class="text-xs text-gray-500 mt-1">New bookings</div>
                    </div>

                    <div class="admin-card text-center">
                        <div class="text-4xl mb-2">📧</div>
                        <div class="stat-number">${totalContacts}</div>
                        <div class="text-gray-600 font-medium">Total Messages</div>
                        <div class="text-xs text-gray-500 mt-1">+${todayContacts} today</div>
                    </div>

                    <div class="admin-card text-center">
                        <div class="text-4xl mb-2">🚀</div>
                        <div class="stat-number text-green-500">LIVE</div>
                        <div class="text-gray-600 font-medium">System Status</div>
                        <div class="text-xs text-gray-500 mt-1">All systems operational</div>
                    </div>
                </div>

                <!-- Data Tables -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <!-- Appointments -->
                    <div class="admin-card">
                        <h2 class="text-lg font-bold text-amber-600 mb-4">
                            📅 Recent Appointments (${isMongoConnected ? 'MongoDB' : 'Memory'})
                        </h2>
                        <div class="space-y-4 max-h-96 overflow-y-auto">
                            ${recentAppointments.length > 0 ? 
                                recentAppointments.map(apt => 
                                    `<div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 class="font-semibold text-gray-800">${apt.name}</h4>
                                                <p class="text-amber-600 text-sm font-medium">${apt.service}</p>
                                            </div>
                                            <span class="text-xs bg-yellow-500 text-white px-2 py-1 rounded font-medium">
                                                ${apt.status}
                                            </span>
                                        </div>
                                        <p class="text-gray-700 text-sm">📧 ${apt.email}</p>
                                        <p class="text-gray-700 text-sm">📱 ${apt.phone}</p>
                                        ${apt.preferred_date ? `<p class="text-gray-700 text-sm">📅 ${apt.preferred_date} ${apt.preferred_time || ''}</p>` : ''}
                                        <p class="text-gray-500 text-xs mt-2">${new Date(apt.created_at).toLocaleString()}</p>
                                        ${apt.message ? `<p class="text-gray-700 text-sm mt-2 italic">"${apt.message}"</p>` : ''}
                                    </div>`
                                ).join('') 
                                : `<div class="text-center py-8 text-gray-600">
                                    <div class="text-4xl mb-2">📅</div>
                                    <p class="font-medium">No appointments yet</p>
                                    <p class="text-sm text-gray-500">New bookings will appear here</p>
                                </div>`
                            }
                        </div>
                    </div>

                    <!-- Contacts -->
                    <div class="admin-card">
                        <h2 class="text-lg font-bold text-blue-600 mb-4">
                            📧 Recent Messages (${isMongoConnected ? 'MongoDB' : 'Memory'})
                        </h2>
                        <div class="space-y-4 max-h-96 overflow-y-auto">
                            ${recentContacts.length > 0 ? 
                                recentContacts.map(contact => 
                                    `<div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 class="font-semibold text-gray-800">${contact.name}</h4>
                                                ${contact.service ? `<p class="text-blue-600 text-sm font-medium">${contact.service}</p>` : ''}
                                            </div>
                                            <span class="text-xs bg-green-500 text-white px-2 py-1 rounded font-medium">new</span>
                                        </div>
                                        <p class="text-gray-700 text-sm">📧 ${contact.email}</p>
                                        ${contact.phone ? `<p class="text-gray-700 text-sm">📱 ${contact.phone}</p>` : ''}
                                        <p class="text-gray-500 text-xs mt-2">${new Date(contact.created_at).toLocaleString()}</p>
                                        <p class="text-gray-700 text-sm mt-2 italic">"${contact.message}"</p>
                                    </div>`
                                ).join('') 
                                : `<div class="text-center py-8 text-gray-600">
                                    <div class="text-4xl mb-2">📧</div>
                                    <p class="font-medium">No messages yet</p>
                                    <p class="text-sm text-gray-500">Contact form submissions will appear here</p>
                                </div>`
                            }
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="mt-12 text-center">
                    <div class="admin-card">
                        <div class="flex justify-center space-x-8 flex-wrap gap-4 mb-4">
                            <div class="${isMongoConnected ? 'text-green-600' : 'text-blue-600'} font-semibold">
                                ${isMongoConnected ? '🗄️ MongoDB Active' : '📁 Persistent Storage Active'}
                            </div>
                        </div>
                        <p class="text-gray-600 text-sm">
                            Last updated: ${new Date().toLocaleString()} • 
                            Database: ${dbStatus} • 
                            Export: Fixed & Working
                        </p>
                    </div>
                </div>
            </div>

            <script>
                console.log('🚀 Export functionality loaded');

                async function exportData(type) {
                    try {
                        console.log('📊 Starting export for:', type);

                        // Show loading feedback
                        const button = event.target;
                        const originalText = button.innerHTML;
                        button.innerHTML = '⏳ Exporting...';
                        button.disabled = true;

                        // Fetch data from API
                        const response = await fetch(\`/api/\${type}\`);
                        console.log('📡 Response status:', response.status);

                        if (!response.ok) {
                            throw new Error(\`HTTP Error: \${response.status} - \${response.statusText}\`);
                        }

                        const result = await response.json();
                        console.log('📋 API Response:', result);

                        // Check if we have data
                        if (!result.success) {
                            throw new Error(result.error || 'API request failed');
                        }

                        const data = result.data || [];
                        console.log('📊 Data items found:', data.length);

                        if (data.length === 0) {
                            alert(\`No \${type} data to export. Try booking an appointment or sending a message first.\`);
                            return;
                        }

                        // Generate CSV content
                        let csvContent = '';
                        let filename = '';

                        if (type === 'appointments') {
                            csvContent = 'Name,Email,Phone,Service,Preferred Date,Preferred Time,Message,Status,Created Date\n';
                            filename = \`appointments_\${new Date().toISOString().split('T')[0]}.csv\`;

                            data.forEach(item => {
                                const row = [
                                    \`"\${(item.name || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.email || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.phone || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.service || 'General Consultation').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.preferred_date || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.preferred_time || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.message || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.status || 'pending').toString().replace(/"/g, '""')}"\`,
                                    \`"\${new Date(item.created_at).toLocaleString()}"\`
                                ];
                                csvContent += row.join(',') + '\n';
                            });
                        } else {
                            csvContent = 'Name,Email,Phone,Service,Message,Created Date\n';
                            filename = \`contacts_\${new Date().toISOString().split('T')[0]}.csv\`;

                            data.forEach(item => {
                                const row = [
                                    \`"\${(item.name || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.email || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.phone || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.service || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${(item.message || '').toString().replace(/"/g, '""')}"\`,
                                    \`"\${new Date(item.created_at).toLocaleString()}"\`
                                ];
                                csvContent += row.join(',') + '\n';
                            });
                        }

                        console.log(' CSV content generated, length:', csvContent.length);

                        // Create and download file
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = window.URL.createObjectURL(blob);

                        const downloadLink = document.createElement('a');
                        downloadLink.href = url;
                        downloadLink.download = filename;
                        downloadLink.style.display = 'none';

                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);

                        window.URL.revokeObjectURL(url);

                        console.log(' Export completed successfully');
                        alert(\` Successfully exported \${data.length} \${type} records!\n\nFile: \${filename}\`);

                    } catch (error) {
                        console.error(' Export error:', error);
                        alert(\` Export failed: \${error.message}\n\nPlease check the browser console for more details.\`);
                    } finally {
                        // Reset button
                        if (button) {
                            button.innerHTML = originalText;
                            button.disabled = false;
                        }
                    }
                }

                // Test API endpoints on page load
                window.addEventListener('load', function() {
                    console.log('🔍 Testing API endpoints...');

                    fetch('/api/health')
                        .then(response => response.json())
                        .then(data => console.log('✅ Health check:', data))
                        .catch(error => console.error('❌ Health check failed:', error));

                    fetch('/api/appointments')
                        .then(response => response.json())
                        .then(data => console.log('✅ Appointments API:', data.count, 'records'))
                        .catch(error => console.error('❌ Appointments API failed:', error));

                    fetch('/api/contacts')
                        .then(response => response.json())
                        .then(data => console.log('✅ Contacts API:', data.count, 'records'))
                        .catch(error => console.error('❌ Contacts API failed:', error));
                });
            </script>
        </body>
        </html>
    `);
});

// API Routes with enhanced error handling
app.get('/api/appointments', async (req, res) => {
    try {
        let appointmentsData = [];

        if (isMongoConnected) {
            try {
                appointmentsData = await Appointment.find().sort({ created_at: -1 });
                console.log('✅ Fetched appointments from MongoDB:', appointmentsData.length);
            } catch (mongoError) {
                console.log('❌ MongoDB fetch failed:', mongoError.message);
                appointmentsData = [...appointments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
        } else {
            appointmentsData = [...appointments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            console.log('📂 Fetched appointments from memory:', appointmentsData.length);
        }

        res.json({ 
            success: true, 
            count: appointmentsData.length, 
            data: appointmentsData,
            source: isMongoConnected ? 'MongoDB' : 'Memory Storage',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ API appointments error:', error);
        res.status(500).json({ 
            success: false, 
            count: 0, 
            data: [],
            error: error.message,
            source: 'Error Fallback'
        });
    }
});

app.get('/api/contacts', async (req, res) => {
    try {
        let contactsData = [];

        if (isMongoConnected) {
            try {
                contactsData = await Contact.find().sort({ created_at: -1 });
                console.log('✅ Fetched contacts from MongoDB:', contactsData.length);
            } catch (mongoError) {
                console.log('❌ MongoDB fetch failed:', mongoError.message);
                contactsData = [...contacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
        } else {
            contactsData = [...contacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            console.log('📂 Fetched contacts from memory:', contactsData.length);
        }

        res.json({ 
            success: true, 
            count: contactsData.length, 
            data: contactsData,
            source: isMongoConnected ? 'MongoDB' : 'Memory Storage',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ API contacts error:', error);
        res.status(500).json({ 
            success: false, 
            count: 0, 
            data: [],
            error: error.message,
            source: 'Error Fallback'
        });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const { name, email, phone, service, date, time, message } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and phone are required'
            });
        }

        const appointmentData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            service: service || 'General Consultation',
            preferred_date: date || null,
            preferred_time: time || null,
            message: message?.trim() || '',
            status: 'pending',
            created_at: new Date()
        };

        // Try MongoDB first
        if (isMongoConnected) {
            try {
                const appointment = new Appointment(appointmentData);
                await appointment.save();
                console.log('✅ Appointment saved to MongoDB:', appointment.name);

                res.status(201).json({
                    success: true,
                    message: 'Appointment booked successfully! We\'ll contact you soon.',
                    source: 'MongoDB'
                });
                return;
            } catch (mongoError) {
                console.log('❌ MongoDB save failed:', mongoError.message);
            }
        }

        // Fallback to memory storage
        const appointment = {
            ...appointmentData,
            id: Date.now(),
            created_at: appointmentData.created_at.toISOString()
        };
        appointments.push(appointment);

        // Save to file
        saveDataToFile(APPOINTMENTS_FILE, appointments);
        console.log('✅ Appointment saved to memory:', appointment.name);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully! We\'ll contact you soon.',
            source: 'Memory Storage'
        });

    } catch (error) {
        console.error('❌ Save appointment error:', error);
        res.status(500).json({ success: false, message: 'Booking error. Please try again.' });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        const contactData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            service: service || null,
            message: message.trim(),
            created_at: new Date()
        };

        // Try MongoDB first
        if (isMongoConnected) {
            try {
                const contact = new Contact(contactData);
                await contact.save();
                console.log('✅ Contact saved to MongoDB:', contact.name);

                res.json({
                    success: true,
                    message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
                    source: 'MongoDB'
                });
                return;
            } catch (mongoError) {
                console.log('❌ MongoDB save failed:', mongoError.message);
            }
        }

        // Fallback to memory storage
        const contact = {
            ...contactData,
            id: Date.now(),
            created_at: contactData.created_at.toISOString()
        };
        contacts.push(contact);

        // Save to file
        saveDataToFile(CONTACTS_FILE, contacts);
        console.log('✅ Contact saved to memory:', contact.name);

        res.json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            source: 'Memory Storage'
        });

    } catch (error) {
        console.error('❌ Save contact error:', error);
        res.status(500).json({ success: false, message: 'Contact error. Please try again.' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log('🚀 =======================================');
    console.log('🎨 Theme: Yellow & White Professional');
    console.log('🔓 Admin Access: Direct URL (No Login)');
    console.log(`🗄️ Database: ${isMongoConnected ? 'MongoDB Connected' : 'Memory Storage Active'}`);
    console.log('📊 Export: Fixed & Working');
    console.log('🚀 =======================================');
});