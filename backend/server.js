const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

// Import models
const Appointment = require('./models/Appointment');
const Contact = require('./models/Contact');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ MongoDB Atlas Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

console.log('🏥 =======================================');
console.log('🏥 DR. ANAND\'S FITNESS ART - MONGODB');
console.log('🏥 Professional Database Solution');
console.log('🏥 =======================================');

// Health check with MongoDB
app.get('/api/health', async (req, res) => {
    try {
        const appointmentCount = await Appointment.countDocuments();
        const contactCount = await Contact.countDocuments();
        
        res.json({ 
            message: 'Dr. Anand\'s Fitness Art with MongoDB is running! 🚀', 
            timestamp: new Date().toISOString(),
            database: {
                status: 'MongoDB Atlas Connected',
                type: 'Professional Cloud Database',
                appointments: appointmentCount,
                contacts: contactCount
            },
            features: [
                'MongoDB Atlas Database',
                'Permanent Data Storage', 
                'Professional Scalability',
                'Automatic Backups'
            ]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database connection error',
            error: error.message
        });
    }
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

// Get all appointments (for admin)
app.get('/api/appointments', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const appointments = await Appointment.find()
            .sort({ createdAt: -1 })
            .limit(limit);
        
        res.json({ 
            success: true, 
            count: appointments.length, 
            data: appointments 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching appointments',
            error: error.message 
        });
    }
});

// Create appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const { name, email, phone, service, date, time, message } = req.body;
        
        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and phone are required'
            });
        }

        const appointment = new Appointment({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            service: service || 'General Consultation',
            preferredDate: date || null,
            preferredTime: time || null,
            message: message || ''
        });

        await appointment.save();
        
        console.log('✅ Appointment saved to MongoDB:', appointment.name);

        res.status(201).json({
            success: true,
            message: 'Appointment request submitted successfully! 🎉',
            data: {
                id: appointment._id,
                name: appointment.name,
                service: appointment.service,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('❌ Error creating appointment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating appointment',
            error: error.message 
        });
    }
});

// Contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        const contact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            service: service || null,
            message: message.trim()
        });

        await contact.save();
        
        console.log('✅ Contact saved to MongoDB:', contact.name);

        res.json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours. 📧'
        });
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error processing contact form',
            error: error.message 
        });
    }
});

// Get contacts (for admin)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(50);
        
        res.json({ 
            success: true, 
            count: contacts.length, 
            data: contacts 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching contacts',
            error: error.message 
        });
    }
});

// Update appointment status
app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Appointment not found' 
            });
        }

        res.json({ 
            success: true, 
            message: `Appointment status updated to ${status}`,
            data: appointment
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error updating appointment',
            error: error.message 
        });
    }
});

// Enhanced admin panel with MongoDB data
app.get('/admin', async (req, res) => {
    try {
        const appointmentCount = await Appointment.countDocuments();
        const contactCount = await Contact.countDocuments();
        const recentAppointments = await Appointment.find()
            .sort({ createdAt: -1 })
            .limit(5);
        const recentContacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Get today's stats
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayAppointments = await Appointment.countDocuments({
            createdAt: { $gte: startOfDay }
        });

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Dashboard - Dr. Anand's Fitness Art</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                    tailwind.config = {
                        theme: {
                            extend: {
                                colors: {
                                    primary: {
                                        400: '#fbbf24',
                                        500: '#f59e0b',
                                        600: '#d97706'
                                    }
                                }
                            }
                        }
                    }
                </script>
            </head>
            <body class="bg-gray-100 font-sans">
                <!-- Header -->
                <header class="bg-primary-500 text-white shadow-lg">
                    <div class="max-w-7xl mx-auto px-4 py-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <h1 class="text-3xl font-bold flex items-center">
                                    <span class="mr-2">🏥</span>
                                    Dr. Anand's Fitness Art
                                </h1>
                                <p class="text-primary-100 mt-1">MongoDB Atlas Dashboard - Professional Cloud Storage</p>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-primary-100" id="current-time"></div>
                                <button class="mt-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm" onclick="window.location.reload()">
                                    🔄 Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="max-w-7xl mx-auto px-4 py-8">
                    
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Total Appointments</p>
                                    <p class="text-3xl font-bold text-gray-900">${appointmentCount}</p>
                                </div>
                                <div class="text-primary-500 text-4xl">📅</div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Today's Bookings</p>
                                    <p class="text-3xl font-bold text-gray-900">${todayAppointments}</p>
                                </div>
                                <div class="text-green-500 text-4xl">📈</div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Total Contacts</p>
                                    <p class="text-3xl font-bold text-gray-900">${contactCount}</p>
                                </div>
                                <div class="text-blue-500 text-4xl">📧</div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Database</p>
                                    <p class="text-lg font-semibold text-green-600">✅ MongoDB Atlas</p>
                                </div>
                                <div class="text-green-500 text-4xl">🗄️</div>
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
                                ${recentAppointments.length > 0 ? 
                                    recentAppointments.map(apt => 
                                        `<div class="mb-4 p-4 bg-gray-50 rounded-lg">
                                            <div class="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 class="font-semibold text-gray-900">${apt.name}</h3>
                                                    <p class="text-sm text-gray-600">${apt.service}</p>
                                                </div>
                                                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">${apt.status}</span>
                                            </div>
                                            <p class="text-sm text-gray-600">📧 ${apt.email}</p>
                                            <p class="text-sm text-gray-600">📱 ${apt.phone}</p>
                                            <p class="text-xs text-gray-500 mt-2">${new Date(apt.createdAt).toLocaleString()}</p>
                                        </div>`
                                    ).join('') 
                                    : '<p class="text-gray-500">No appointments yet</p>'
                                }
                            </div>
                        </div>

                        <!-- Recent Contacts -->
                        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-semibold text-gray-900">📧 Recent Contacts</h2>
                            </div>
                            <div class="p-6">
                                ${recentContacts.length > 0 ? 
                                    recentContacts.map(contact => 
                                        `<div class="mb-4 p-4 bg-gray-50 rounded-lg">
                                            <h3 class="font-semibold text-gray-900">${contact.name}</h3>
                                            <p class="text-sm text-gray-600">📧 ${contact.email}</p>
                                            ${contact.phone ? `<p class="text-sm text-gray-600">📱 ${contact.phone}</p>` : ''}
                                            <p class="text-sm text-gray-700 mt-2">${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}</p>
                                            <p class="text-xs text-gray-500 mt-2">${new Date(contact.createdAt).toLocaleString()}</p>
                                        </div>`
                                    ).join('') 
                                    : '<p class="text-gray-500">No contacts yet</p>'
                                }
                            </div>
                        </div>
                        
                    </div>

                    <div class="mt-8 text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                        <p class="text-gray-600">🗄️ Powered by MongoDB Atlas | 🔒 Professional Cloud Database | ✨ Permanent Data Storage</p>
                        <p class="text-gray-500 text-sm mt-2">Data is automatically backed up and globally distributed</p>
                        <div class="mt-4">
                            <a href="/" class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg mr-4">🏠 Back to Website</a>
                            <button onclick="window.location.reload()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">🔄 Refresh</button>
                        </div>
                    </div>
                </div>

                <script>
                    function updateTime() {
                        document.getElementById('current-time').textContent = new Date().toLocaleString();
                    }
                    updateTime();
                    setInterval(updateTime, 1000);
                    
                    // Auto refresh every 2 minutes
                    setTimeout(() => {
                        window.location.reload();
                    }, 2 * 60 * 1000);
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send(`
            <div style="text-align: center; padding: 50px; font-family: Arial;">
                <h1>❌ Database Error</h1>
                <p>Error connecting to MongoDB: ${error.message}</p>
                <p>Please check your MONGODB_URI environment variable.</p>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🏥 Website: http://localhost:${PORT}`);
    console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log('🗄️  Database: MongoDB Atlas (Cloud)');
    console.log('🏥 =======================================');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});
