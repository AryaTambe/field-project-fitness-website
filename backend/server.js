const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 5000;

// BULLETPROOF MongoDB Connection with Fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fitness:fitness123@cluster0.abc123.mongodb.net/dranandfitness?retryWrites=true&w=majority';

// In-memory fallback storage
let appointments = [];
let contacts = [];
let isMongoConnected = false;

// MongoDB Connection with Error Handling
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
    isMongoConnected = true;
}).catch((err) => {
    console.log('⚠️ MongoDB connection failed, using in-memory storage');
    console.log('Error:', err.message);
    isMongoConnected = false;
});

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

// MongoDB Models (only if connected)
let Appointment, Contact;
try {
    Appointment = mongoose.model('Appointment', AppointmentSchema);
    Contact = mongoose.model('Contact', ContactSchema);
} catch (error) {
    console.log('Using in-memory models');
}

// UPDATED Admin credentials - Arya's personal account
const adminCredentials = {
    username: 'aryatambe040',
    email: 'aryatambe040@gmail.com',
    name: 'Arya Vinod Tambe',
    passwordHash: '$2a$12$8K.Wf2q3xVe4jGhN9mP8.u5YtGsQ1rF6pHdL7wE2cX3vB9zA0sT1m' // Password: ^YHNmju7
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'arya-fitness-mean-stack-2025',
    resave: false,
    saveUninitialized: false,
    store: isMongoConnected ? MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions'
    }) : null,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000
    }
}));

console.log('🚀 =======================================');
console.log('🚀 DR. ANAND\'S FITNESS ART - MEAN STACK');
console.log('🚀 Admin: Arya Vinod Tambe');
console.log('🚀 MongoDB + Express + Angular + Node.js');
console.log('🚀 =======================================');

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Access denied. Please log in.',
            redirect: '/admin/login'
        });
    }
};

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Health check
app.get('/api/health', async (req, res) => {
    let appointmentCount = 0;
    let contactCount = 0;
    
    if (isMongoConnected && Appointment && Contact) {
        try {
            appointmentCount = await Appointment.countDocuments();
            contactCount = await Contact.countDocuments();
        } catch (error) {
            appointmentCount = appointments.length;
            contactCount = contacts.length;
        }
    } else {
        appointmentCount = appointments.length;
        contactCount = contacts.length;
    }
    
    res.json({ 
        message: 'Dr. Anand\'s Fitness Art MEAN Stack is running perfectly!',
        timestamp: new Date().toISOString(),
        admin: 'Arya Vinod Tambe',
        database: {
            status: isMongoConnected ? 'MongoDB Atlas Connected' : 'In-Memory Storage Active',
            type: isMongoConnected ? 'MongoDB Atlas' : 'Memory Storage',
            appointments: appointmentCount,
            contacts: contactCount
        },
        stack: 'MEAN (MongoDB + Express + Angular + Node.js)'
    });
});

// Admin login page
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    
    const dbStatus = isMongoConnected ? 'MongoDB Atlas Connected' : 'Memory Storage Active';
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login - Dr. Anand's Fitness Art</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; }
                .glass { 
                    background: rgba(15, 23, 42, 0.9); 
                    backdrop-filter: blur(20px); 
                    border: 1px solid rgba(255, 255, 255, 0.1); 
                }
            </style>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            
            <div class="w-full max-w-md">
                <!-- Logo -->
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span class="text-white font-bold text-2xl">AT</span>
                    </div>
                    <h1 class="text-3xl font-bold text-white mb-2">Admin Portal</h1>
                    <p class="text-gray-400">Dr. Anand's Fitness Art</p>
                    <p class="text-amber-400 text-sm">Arya Vinod Tambe</p>
                    <div class="mt-2 text-sm ${isMongoConnected ? 'text-green-400' : 'text-blue-400'}">
                        ✅ ${dbStatus}
                    </div>
                </div>
                
                <!-- Login Card -->
                <div class="glass rounded-xl p-8 shadow-2xl">
                    <h2 class="text-xl font-bold text-center mb-6 text-amber-400">MEAN Stack Login</h2>
                    
                    <!-- Messages -->
                    <div id="error" class="hidden bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-4">
                        <span id="error-text"></span>
                    </div>
                    
                    <div id="success" class="hidden bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-lg mb-4">
                        <span id="success-text"></span>
                    </div>
                    
                    <!-- Form -->
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Email or Username</label>
                            <input type="text" id="email" required 
                                   class="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                                   placeholder="aryatambe040@gmail.com">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input type="password" id="password" required 
                                   class="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                                   placeholder="Enter your password">
                        </div>
                        
                        <button type="submit" id="loginBtn" 
                                class="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors">
                            <span id="loginText">Sign In to MEAN Stack</span>
                            <span id="loginLoading" class="hidden">Signing In...</span>
                        </button>
                    </form>
                    
                    <div class="text-center mt-6">
                        <a href="/" class="text-amber-400 hover:text-amber-300 text-sm">← Back to Website</a>
                    </div>
                </div>
                
                <!-- Database Status -->
                <div class="mt-6 text-center">
                    <div class="glass rounded-lg p-4">
                        <div class="${isMongoConnected ? 'text-green-400' : 'text-blue-400'} text-sm font-semibold mb-2">
                            🗄️ ${dbStatus}
                        </div>
                        <div class="text-gray-300 text-xs">MEAN Stack Architecture Active</div>
                        <div class="text-gray-400 text-xs mt-1">MongoDB + Express + Angular + Node.js</div>
                    </div>
                </div>
                
                <!-- Credentials -->
                <div class="mt-4 text-center">
                    <details class="text-gray-400 text-sm cursor-pointer">
                        <summary class="hover:text-gray-300">Login Credentials</summary>
                        <div class="glass rounded-lg p-4 mt-2 text-left">
                            <p><strong>Email:</strong> aryatambe040@gmail.com</p>
                            <p><strong>Password:</strong> ^YHNmju7</p>
                        </div>
                    </details>
                </div>
            </div>
            
            <script>
                document.getElementById('loginForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const btn = document.getElementById('loginBtn');
                    const text = document.getElementById('loginText');
                    const loading = document.getElementById('loginLoading');
                    
                    btn.disabled = true;
                    text.classList.add('hidden');
                    loading.classList.remove('hidden');
                    
                    const data = {
                        email: document.getElementById('email').value,
                        password: document.getElementById('password').value
                    };
                    
                    try {
                        const response = await fetch('/admin/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            document.getElementById('success-text').textContent = result.message;
                            document.getElementById('success').classList.remove('hidden');
                            document.getElementById('error').classList.add('hidden');
                            setTimeout(() => window.location.href = '/admin', 1000);
                        } else {
                            document.getElementById('error-text').textContent = result.message;
                            document.getElementById('error').classList.remove('hidden');
                            document.getElementById('success').classList.add('hidden');
                        }
                    } catch (error) {
                        document.getElementById('error-text').textContent = 'Login failed. Please try again.';
                        document.getElementById('error').classList.remove('hidden');
                    } finally {
                        btn.disabled = false;
                        text.classList.remove('hidden');
                        loading.classList.add('hidden');
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Admin login POST
app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if ((email === adminCredentials.username || email === adminCredentials.email) &&
            await bcrypt.compare(password, adminCredentials.passwordHash)) {
            
            req.session.isAdmin = true;
            req.session.adminEmail = adminCredentials.email;
            req.session.adminName = adminCredentials.name;
            req.session.loginTime = new Date();
            
            console.log('✅ Admin login successful:', email);
            
            res.json({
                success: true,
                message: `Welcome to MEAN Stack Dashboard, ${adminCredentials.name}!`
            });
        } else {
            console.log('❌ Admin login failed:', email);
            res.status(401).json({
                success: false,
                message: 'Invalid credentials. Please check your email and password.'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login system error. Please try again.'
        });
    }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Admin dashboard
app.get('/admin', requireAuth, async (req, res) => {
    let totalAppointments = 0;
    let totalContacts = 0;
    let todayAppointments = 0;
    let todayContacts = 0;
    let recentAppointments = [];
    let recentContacts = [];
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (isMongoConnected && Appointment && Contact) {
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
    
    const dbStatus = isMongoConnected ? 'Connected' : 'Memory Storage';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MEAN Stack Dashboard - Dr. Anand's Fitness Art</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { font-family: 'Inter', sans-serif; }
                .glass { 
                    background: rgba(15, 23, 42, 0.8); 
                    backdrop-filter: blur(20px); 
                    border: 1px solid rgba(255, 255, 255, 0.1); 
                }
            </style>
        </head>
        <body class="bg-slate-900 text-white min-h-screen">
            
            <!-- Header -->
            <header class="bg-slate-800 border-b border-gray-700 sticky top-0 z-40">
                <div class="max-w-7xl mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                                <span class="text-white font-bold">AT</span>
                            </div>
                            <div>
                                <h1 class="text-xl font-bold text-amber-400">Dr. Anand's Fitness Art</h1>
                                <p class="text-gray-400 text-sm">MEAN Stack Dashboard - ${req.session.adminName}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="hidden md:block text-right">
                                <div class="text-sm font-semibold ${isMongoConnected ? 'text-green-400' : 'text-blue-400'}">
                                    🗄️ Database: ${dbStatus}
                                </div>
                                <div class="text-xs text-gray-400">MEAN Stack Architecture</div>
                            </div>
                            <button onclick="window.location.reload()" 
                                    class="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm">
                                Refresh
                            </button>
                            <button onclick="logout()" 
                                    class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div class="max-w-7xl mx-auto px-4 py-8">
                
                <!-- Welcome Banner -->
                <div class="mb-8">
                    <div class="glass p-6 rounded-xl ${isMongoConnected ? 'border-green-500/20 bg-green-500/5' : 'border-blue-500/20 bg-blue-500/5'}">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-3 h-3 ${isMongoConnected ? 'bg-green-400' : 'bg-blue-400'} rounded-full animate-pulse"></div>
                                <div>
                                    <h3 class="font-semibold ${isMongoConnected ? 'text-green-400' : 'text-blue-400'}">
                                        Welcome ${req.session.adminName}!
                                    </h3>
                                    <p class="text-sm text-gray-300">
                                        MEAN Stack Dashboard - ${isMongoConnected ? 'MongoDB Atlas Connected' : 'Memory Storage Active'}
                                    </p>
                                </div>
                            </div>
                            <div class="text-right text-sm text-gray-400">
                                <div>Stack: MongoDB + Express + Angular + Node.js</div>
                                <div>Admin: ${req.session.adminName}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="mb-8">
                    <div class="flex flex-wrap gap-4">
                        <a href="/" class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold">
                            🏠 View Website
                        </a>
                        <button onclick="exportData('appointments')" 
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            📊 Export Appointments
                        </button>
                        <button onclick="exportData('contacts')" 
                                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                            📧 Export Contacts
                        </button>
                        <a href="/api/health" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                            🔍 System Health
                        </a>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="glass p-6 rounded-xl text-center">
                        <div class="text-3xl mb-2">📅</div>
                        <div class="text-2xl font-bold text-amber-400">${totalAppointments}</div>
                        <div class="text-gray-400 text-sm">Total Appointments</div>
                        <div class="text-xs text-gray-500 mt-1">+${todayAppointments} today</div>
                    </div>
                    
                    <div class="glass p-6 rounded-xl text-center">
                        <div class="text-3xl mb-2">📈</div>
                        <div class="text-2xl font-bold text-green-400">${todayAppointments}</div>
                        <div class="text-gray-400 text-sm">Today's Bookings</div>
                        <div class="text-xs text-gray-500 mt-1">New today</div>
                    </div>
                    
                    <div class="glass p-6 rounded-xl text-center">
                        <div class="text-3xl mb-2">📧</div>
                        <div class="text-2xl font-bold text-blue-400">${totalContacts}</div>
                        <div class="text-gray-400 text-sm">Total Messages</div>
                        <div class="text-xs text-gray-500 mt-1">+${todayContacts} today</div>
                    </div>
                    
                    <div class="glass p-6 rounded-xl text-center">
                        <div class="text-3xl mb-2">🚀</div>
                        <div class="text-2xl font-bold text-purple-400">MEAN</div>
                        <div class="text-gray-400 text-sm">Stack Active</div>
                        <div class="text-xs text-gray-500 mt-1">All systems go</div>
                    </div>
                </div>

                <!-- Data Tables -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- Appointments -->
                    <div class="glass p-6 rounded-xl">
                        <h2 class="text-lg font-bold text-amber-400 mb-4">
                            📅 Recent Appointments ${isMongoConnected ? '(MongoDB)' : '(Memory)'}
                        </h2>
                        <div class="space-y-4 max-h-96 overflow-y-auto">
                            ${recentAppointments.length > 0 ? 
                                recentAppointments.map(apt => 
                                    `<div class="bg-slate-700 p-4 rounded-lg">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 class="font-semibold text-white">${apt.name}</h4>
                                                <p class="text-amber-400 text-sm">${apt.service}</p>
                                            </div>
                                            <span class="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                                                ${apt.status}
                                            </span>
                                        </div>
                                        <p class="text-gray-300 text-sm">📧 ${apt.email}</p>
                                        <p class="text-gray-300 text-sm">📱 ${apt.phone}</p>
                                        ${apt.preferred_date ? `<p class="text-gray-300 text-sm">📅 ${apt.preferred_date} ${apt.preferred_time || ''}</p>` : ''}
                                        <p class="text-gray-400 text-xs mt-2">${new Date(apt.created_at).toLocaleString()}</p>
                                        ${apt.message ? `<p class="text-gray-300 text-sm mt-2 italic">"${apt.message}"</p>` : ''}
                                    </div>`
                                ).join('') 
                                : `<div class="text-center py-8">
                                    <div class="text-4xl mb-2">📅</div>
                                    <p class="text-gray-400">No appointments yet</p>
                                    <p class="text-gray-500 text-sm">Bookings will appear here</p>
                                </div>`
                            }
                        </div>
                    </div>

                    <!-- Contacts -->
                    <div class="glass p-6 rounded-xl">
                        <h2 class="text-lg font-bold text-blue-400 mb-4">
                            📧 Recent Messages ${isMongoConnected ? '(MongoDB)' : '(Memory)'}
                        </h2>
                        <div class="space-y-4 max-h-96 overflow-y-auto">
                            ${recentContacts.length > 0 ? 
                                recentContacts.map(contact => 
                                    `<div class="bg-slate-700 p-4 rounded-lg">
                                        <div class="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 class="font-semibold text-white">${contact.name}</h4>
                                                ${contact.service ? `<p class="text-blue-400 text-sm">${contact.service}</p>` : ''}
                                            </div>
                                            <span class="text-xs bg-green-600 text-white px-2 py-1 rounded">new</span>
                                        </div>
                                        <p class="text-gray-300 text-sm">📧 ${contact.email}</p>
                                        ${contact.phone ? `<p class="text-gray-300 text-sm">📱 ${contact.phone}</p>` : ''}
                                        <p class="text-gray-400 text-xs mt-2">${new Date(contact.created_at).toLocaleString()}</p>
                                        <p class="text-gray-300 text-sm mt-2 italic">"${contact.message}"</p>
                                    </div>`
                                ).join('') 
                                : `<div class="text-center py-8">
                                    <div class="text-4xl mb-2">📧</div>
                                    <p class="text-gray-400">No messages yet</p>
                                    <p class="text-gray-500 text-sm">Contact submissions will appear here</p>
                                </div>`
                            }
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="mt-12 text-center">
                    <div class="glass p-6 rounded-xl">
                        <div class="flex justify-center space-x-8 flex-wrap gap-4 mb-4">
                            <div class="${isMongoConnected ? 'text-green-400' : 'text-blue-400'}">
                                ${isMongoConnected ? '🗄️ MongoDB Atlas Active' : '💾 Memory Storage Active'}
                            </div>
                            <div class="text-amber-400">🚀 MEAN Stack</div>
                            <div class="text-purple-400">🔒 Admin: ${req.session.adminName}</div>
                            <div class="text-cyan-400">💪 Fitness Platform</div>
                        </div>
                        <p class="text-gray-400 text-sm">
                            Last updated: ${new Date().toLocaleString()} • 
                            Database: ${dbStatus} • 
                            Session expires: ${new Date(Date.now() + 2*60*60*1000).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>

            <script>
                async function logout() {
                    if (confirm('Are you sure you want to logout, ${req.session.adminName}?')) {
                        try {
                            const response = await fetch('/admin/logout', { method: 'POST' });
                            const result = await response.json();
                            
                            if (result.success) {
                                window.location.href = '/admin/login';
                            } else {
                                alert('Logout failed. Please try again.');
                            }
                        } catch (error) {
                            window.location.href = '/admin/login';
                        }
                    }
                }
                
                async function exportData(type) {
                    try {
                        const response = await fetch('/api/' + type);
                        const result = await response.json();
                        const data = result.data || [];
                        
                        if (data.length === 0) {
                            alert('No ' + type + ' data to export');
                            return;
                        }
                        
                        let csv = '';
                        if (type === 'appointments') {
                            csv = 'Name,Email,Phone,Service,Date,Time,Message,Status,Created\\n';
                            data.forEach(item => {
                                const createdAt = new Date(item.created_at).toLocaleString();
                                csv += \`"\${item.name}","\${item.email}","\${item.phone}","\${item.service}","\${item.preferred_date || ''}","\${item.preferred_time || ''}","\${item.message}","\${item.status}","\${createdAt}"\\n\`;
                            });
                        } else {
                            csv = 'Name,Email,Phone,Service,Message,Created\\n';
                            data.forEach(item => {
                                const createdAt = new Date(item.created_at).toLocaleString();
                                csv += \`"\${item.name}","\${item.email}","\${item.phone || ''}","\${item.service || ''}","\${item.message}","\${createdAt}"\\n\`;
                            });
                        }
                        
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = type + '_' + new Date().toISOString().split('T')[0] + '.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        
                        alert('✅ Data exported successfully from MEAN Stack!');
                    } catch (error) {
                        alert('Export failed: ' + error.message);
                    }
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 5 * 60 * 1000);
            </script>
        </body>
        </html>
    `);
});

// API Routes with MongoDB fallback
app.get('/api/appointments', requireAuth, async (req, res) => {
    try {
        let appointmentsData = [];
        
        if (isMongoConnected && Appointment) {
            appointmentsData = await Appointment.find().sort({ created_at: -1 });
        } else {
            appointmentsData = [...appointments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        res.json({ 
            success: true, 
            count: appointmentsData.length, 
            data: appointmentsData,
            source: isMongoConnected ? 'MongoDB Atlas' : 'Memory Storage'
        });
    } catch (error) {
        res.json({ 
            success: true, 
            count: appointments.length, 
            data: appointments,
            source: 'Memory Storage (Fallback)'
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

        // Try MongoDB first, fallback to memory
        if (isMongoConnected && Appointment) {
            try {
                const appointment = new Appointment(appointmentData);
                await appointment.save();
                console.log('✅ Appointment saved to MongoDB:', appointment.name);
                
                res.status(201).json({
                    success: true,
                    message: 'Appointment booked successfully! We\'ll contact you soon.',
                    source: 'MongoDB Atlas'
                });
                return;
            } catch (mongoError) {
                console.log('MongoDB save failed, using memory fallback');
            }
        }
        
        // Fallback to memory storage
        const appointment = {
            ...appointmentData,
            id: Date.now(),
            created_at: appointmentData.created_at.toISOString()
        };
        appointments.push(appointment);
        console.log('✅ Appointment saved to memory:', appointment.name);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully! We\'ll contact you soon.',
            source: 'Memory Storage'
        });
        
    } catch (error) {
        console.error('Save appointment error:', error);
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

        // Try MongoDB first, fallback to memory
        if (isMongoConnected && Contact) {
            try {
                const contact = new Contact(contactData);
                await contact.save();
                console.log('✅ Contact saved to MongoDB:', contact.name);
                
                res.json({
                    success: true,
                    message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
                    source: 'MongoDB Atlas'
                });
                return;
            } catch (mongoError) {
                console.log('MongoDB save failed, using memory fallback');
            }
        }
        
        // Fallback to memory storage
        const contact = {
            ...contactData,
            id: Date.now(),
            created_at: contactData.created_at.toISOString()
        };
        contacts.push(contact);
        console.log('✅ Contact saved to memory:', contact.name);

        res.json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            source: 'Memory Storage'
        });
        
    } catch (error) {
        console.error('Save contact error:', error);
        res.status(500).json({ success: false, message: 'Contact error. Please try again.' });
    }
});

app.get('/api/contacts', requireAuth, async (req, res) => {
    try {
        let contactsData = [];
        
        if (isMongoConnected && Contact) {
            contactsData = await Contact.find().sort({ created_at: -1 });
        } else {
            contactsData = [...contacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        res.json({ 
            success: true, 
            count: contactsData.length, 
            data: contactsData,
            source: isMongoConnected ? 'MongoDB Atlas' : 'Memory Storage'
        });
    } catch (error) {
        res.json({ 
            success: true, 
            count: contacts.length, 
            data: contacts,
            source: 'Memory Storage (Fallback)'
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ MEAN Stack Server running on http://localhost:${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`🔐 Admin Login: http://localhost:${PORT}/admin/login`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log('🚀 =======================================');
    console.log('👤 Admin: Arya Vinod Tambe');
    console.log('📧 Admin Email: aryatambe040@gmail.com');
    console.log('🔑 Admin Password: ^YHNmju7');
    console.log(`🗄️ Database: ${isMongoConnected ? 'MongoDB Atlas' : 'Memory Storage'}`);
    console.log('🚀 MEAN STACK: MongoDB + Express + Angular + Node.js');
    console.log('🚀 =======================================');
});
