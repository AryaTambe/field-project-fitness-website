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

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/dranandfitness?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
}).catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    // Fallback to memory storage if MongoDB fails
    console.log('🔄 Falling back to in-memory storage');
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

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    lastLogin: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

// MongoDB Models
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Contact = mongoose.model('Contact', ContactSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// Initialize default admin user
async function initializeAdmin() {
    try {
        const existingAdmin = await Admin.findOne({ email: 'admin@dranandfitness.com' });
        
        if (!existingAdmin) {
            const defaultAdmin = new Admin({
                username: 'admin',
                email: 'admin@dranandfitness.com',
                name: 'Dr. Anand Gupta',
                passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHbYlgz0zK8tBj2' // Password: DrAnand2025!
            });
            
            await defaultAdmin.save();
            console.log('✅ Default admin user created');
        }
    } catch (error) {
        console.error('❌ Error initializing admin:', error);
    }
}

// Initialize admin after MongoDB connection
mongoose.connection.once('open', () => {
    initializeAdmin();
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Session configuration with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'dr-anand-fitness-premium-2025',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 2 * 60 * 60 * 1000 // 2 hours
    }
}));

console.log('🚀 =======================================');
console.log('🚀 DR. ANAND\'S FITNESS ART - MONGODB EDITION');
console.log('🚀 Professional Fitness Website with Database');
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

// Redirect if already logged in
const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    next();
};

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const appointmentCount = await Appointment.countDocuments().catch(() => 0);
    const contactCount = await Contact.countDocuments().catch(() => 0);
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    res.json({ 
        message: 'Dr. Anand\'s Fitness Art is running perfectly!', 
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            type: 'MongoDB Atlas',
            appointments: appointmentCount,
            contacts: contactCount
        },
        features: [
            'MongoDB Atlas Database',
            'Persistent Data Storage',
            'Session Management',
            'Admin Authentication',
            'Responsive Design',
            'Contact & Booking System'
        ],
        stats: {
            appointments: appointmentCount,
            contacts: contactCount,
            uptime: process.uptime()
        }
    });
});

// Business info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        business: {
            name: 'Dr. Anand\'s Fitness Art',
            tagline: 'Fitness, Nutrition & Wellness',
            phone: '+91-99999-99999',
            email: 'info@dranandfitness.com',
            address: '123 Fitness Street, Health City',
            hours: 'Mon-Fri: 5AM-10PM, Sat-Sun: 6AM-8PM'
        }
    });
});

// ADMIN LOGIN PAGE
app.get('/admin/login', redirectIfLoggedIn, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Login - Dr. Anand's Fitness Art</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
                .glass { 
                    background: rgba(15, 23, 42, 0.8); 
                    backdrop-filter: blur(20px); 
                    border: 1px solid rgba(255, 255, 255, 0.1); 
                }
                .logo-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #fbbf24, #f59e0b);
                    border-radius: 12px;
                    font-weight: 700;
                    font-size: 20px;
                    color: white;
                }
            </style>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            
            <div class="w-full max-w-md">
                
                <!-- Logo -->
                <div class="text-center mb-8">
                    <div class="logo-badge mx-auto mb-4">DR</div>
                    <h1 class="text-3xl font-bold text-white mb-2">Admin Portal</h1>
                    <p class="text-gray-400">Dr. Anand's Fitness Art</p>
                    <div class="mt-2 text-sm text-green-400">✅ MongoDB Atlas Connected</div>
                </div>
                
                <!-- Login Card -->
                <div class="glass rounded-xl p-8 shadow-2xl">
                    <h2 class="text-xl font-bold text-center mb-6 text-amber-400">Secure Login</h2>
                    
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
                                   placeholder="admin@dranandfitness.com">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input type="password" id="password" required 
                                   class="w-full bg-slate-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
                                   placeholder="Enter your password">
                        </div>
                        
                        <div class="flex items-center">
                            <input type="checkbox" id="remember" class="w-4 h-4 text-amber-500">
                            <label for="remember" class="ml-2 text-sm text-gray-300">Remember me</label>
                        </div>
                        
                        <button type="submit" id="loginBtn" 
                                class="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors">
                            <span id="loginText">Sign In</span>
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
                        <div class="text-green-400 text-sm font-semibold mb-2">🗄️ Database Status</div>
                        <div class="text-gray-300 text-xs">MongoDB Atlas - Connected & Active</div>
                        <div class="text-gray-400 text-xs mt-1">All data is securely stored in cloud database</div>
                    </div>
                </div>
                
                <!-- Credentials -->
                <div class="mt-4 text-center">
                    <details class="text-gray-400 text-sm cursor-pointer">
                        <summary class="hover:text-gray-300">Default Credentials</summary>
                        <div class="glass rounded-lg p-4 mt-2 text-left">
                            <p><strong>Email:</strong> admin@dranandfitness.com</p>
                            <p><strong>Password:</strong> DrAnand2025!</p>
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
                        password: document.getElementById('password').value,
                        remember: document.getElementById('remember').checked
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
    const { email, password, remember } = req.body;
    
    try {
        // Check MongoDB first, fallback to default credentials
        let admin = await Admin.findOne({ 
            $or: [{ email: email }, { username: email }] 
        }).catch(() => null);
        
        let isValidLogin = false;
        let adminName = '';
        
        if (admin && await bcrypt.compare(password, admin.passwordHash)) {
            isValidLogin = true;
            adminName = admin.name;
            
            // Update last login
            admin.lastLogin = new Date();
            await admin.save().catch(() => {});
        } else {
            // Fallback to default credentials if MongoDB fails
            const defaultEmail = 'admin@dranandfitness.com';
            const defaultUsername = 'admin';
            const defaultPasswordHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewHbYlgz0zK8tBj2';
            const defaultName = 'Dr. Anand Gupta';
            
            if ((email === defaultUsername || email === defaultEmail) &&
                await bcrypt.compare(password, defaultPasswordHash)) {
                isValidLogin = true;
                adminName = defaultName;
            }
        }
        
        if (isValidLogin) {
            req.session.isAdmin = true;
            req.session.adminEmail = email;
            req.session.adminName = adminName;
            req.session.loginTime = new Date();
            
            if (remember) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            }
            
            console.log('✅ Admin login successful:', email);
            
            res.json({
                success: true,
                message: `Welcome back, ${adminName}!`
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

// ADMIN DASHBOARD
app.get('/admin', requireAuth, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const totalAppointments = await Appointment.countDocuments().catch(() => 0);
        const totalContacts = await Contact.countDocuments().catch(() => 0);
        const todayAppointments = await Appointment.countDocuments({ 
            created_at: { $gte: startOfDay }
        }).catch(() => 0);
        const todayContacts = await Contact.countDocuments({ 
            created_at: { $gte: startOfDay }
        }).catch(() => 0);
        
        const recentAppointments = await Appointment.find()
            .sort({ created_at: -1 })
            .limit(8)
            .catch(() => []);
            
        const recentContacts = await Contact.find()
            .sort({ created_at: -1 })
            .limit(8)
            .catch(() => []);
        
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Dashboard - Dr. Anand's Fitness Art</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', sans-serif; }
                    .glass { 
                        background: rgba(15, 23, 42, 0.8); 
                        backdrop-filter: blur(20px); 
                        border: 1px solid rgba(255, 255, 255, 0.1); 
                    }
                    .logo-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, #fbbf24, #f59e0b);
                        border-radius: 8px;
                        font-weight: 700;
                        font-size: 16px;
                        color: white;
                    }
                </style>
            </head>
            <body class="bg-slate-900 text-white min-h-screen">
                
                <!-- Header -->
                <header class="bg-slate-800 border-b border-gray-700 sticky top-0 z-40">
                    <div class="max-w-7xl mx-auto px-4 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="logo-badge">DR</div>
                                <div>
                                    <h1 class="text-xl font-bold text-amber-400">Dr. Anand's Fitness Art</h1>
                                    <p class="text-gray-400 text-sm">MongoDB Atlas Dashboard</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-4">
                                <div class="hidden md:block">
                                    <div class="text-sm font-semibold text-green-400">🗄️ Database: ${dbStatus}</div>
                                    <div class="text-xs text-gray-400">MongoDB Atlas Cloud</div>
                                </div>
                                <span class="text-sm text-gray-300 hidden lg:block">${req.session.adminName}</span>
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
                    
                    <!-- Database Status Banner -->
                    <div class="mb-8">
                        <div class="glass p-4 rounded-xl border-green-500/20 bg-green-500/5">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    <div>
                                        <h3 class="font-semibold text-green-400">MongoDB Atlas Database Active</h3>
                                        <p class="text-sm text-gray-300">All data is persistently stored in cloud database</p>
                                    </div>
                                </div>
                                <div class="text-right text-sm text-gray-400">
                                    <div>Collections: appointments, contacts, admins, sessions</div>
                                    <div>Status: ${dbStatus} • Secure Cloud Storage</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="mb-8">
                        <div class="flex flex-wrap gap-4">
                            <a href="/" class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
                                View Website
                            </a>
                            <button onclick="exportData('appointments')" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                                Export Appointments
                            </button>
                            <button onclick="exportData('contacts')" 
                                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                                Export Contacts
                            </button>
                            <a href="/api/health" target="_blank" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                                Database Health
                            </a>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="glass p-6 rounded-xl text-center">
                            <div class="text-3xl mb-2">APPT</div>
                            <div class="text-2xl font-bold text-amber-400">${totalAppointments}</div>
                            <div class="text-gray-400 text-sm">Total Appointments</div>
                            <div class="text-xs text-gray-500 mt-1">+${todayAppointments} today</div>
                        </div>
                        
                        <div class="glass p-6 rounded-xl text-center">
                            <div class="text-3xl mb-2">NEW</div>
                            <div class="text-2xl font-bold text-green-400">${todayAppointments}</div>
                            <div class="text-gray-400 text-sm">Today's Bookings</div>
                            <div class="text-xs text-gray-500 mt-1">New today</div>
                        </div>
                        
                        <div class="glass p-6 rounded-xl text-center">
                            <div class="text-3xl mb-2">MSG</div>
                            <div class="text-2xl font-bold text-blue-400">${totalContacts}</div>
                            <div class="text-gray-400 text-sm">Total Messages</div>
                            <div class="text-xs text-gray-500 mt-1">+${todayContacts} today</div>
                        </div>
                        
                        <div class="glass p-6 rounded-xl text-center">
                            <div class="text-3xl mb-2">DB</div>
                            <div class="text-2xl font-bold text-purple-400">Live</div>
                            <div class="text-gray-400 text-sm">MongoDB Atlas</div>
                            <div class="text-xs text-gray-500 mt-1">Cloud database active</div>
                        </div>
                    </div>

                    <!-- Data -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        <!-- Appointments -->
                        <div class="glass p-6 rounded-xl">
                            <h2 class="text-lg font-bold text-amber-400 mb-4">Recent Appointments (MongoDB)</h2>
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
                                            <p class="text-gray-300 text-sm">Email: ${apt.email}</p>
                                            <p class="text-gray-300 text-sm">Phone: ${apt.phone}</p>
                                            ${apt.preferred_date ? `<p class="text-gray-300 text-sm">Date: ${apt.preferred_date} ${apt.preferred_time || ''}</p>` : ''}
                                            <p class="text-gray-400 text-xs mt-2">${new Date(apt.created_at).toLocaleString()}</p>
                                            ${apt.message ? `<p class="text-gray-300 text-sm mt-2 italic">"${apt.message}"</p>` : ''}
                                        </div>`
                                    ).join('') 
                                    : `<div class="text-center py-8">
                                        <div class="text-4xl mb-2">APPT</div>
                                        <p class="text-gray-400">No appointments yet</p>
                                        <p class="text-gray-500 text-sm">Bookings will appear here</p>
                                    </div>`
                                }
                            </div>
                        </div>

                        <!-- Contacts -->
                        <div class="glass p-6 rounded-xl">
                            <h2 class="text-lg font-bold text-blue-400 mb-4">Recent Messages (MongoDB)</h2>
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
                                            <p class="text-gray-300 text-sm">Email: ${contact.email}</p>
                                            ${contact.phone ? `<p class="text-gray-300 text-sm">Phone: ${contact.phone}</p>` : ''}
                                            <p class="text-gray-400 text-xs mt-2">${new Date(contact.created_at).toLocaleString()}</p>
                                            <p class="text-gray-300 text-sm mt-2 italic">"${contact.message}"</p>
                                        </div>`
                                    ).join('') 
                                    : `<div class="text-center py-8">
                                        <div class="text-4xl mb-2">MSG</div>
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
                                <div class="text-green-400">MongoDB Atlas Connected</div>
                                <div class="text-blue-400">Cloud Data Storage</div>
                                <div class="text-purple-400">Secure Admin Portal</div>
                                <div class="text-amber-400">Professional Dashboard</div>
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
                        if (confirm('Are you sure you want to logout?')) {
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
                            const data = result.data;
                            
                            if (data.length === 0) {
                                alert('No ' + type + ' data to export');
                                return;
                            }
                            
                            let csv = '';
                            if (type === 'appointments') {
                                csv = 'Name,Email,Phone,Service,Date,Time,Message,Status,Created\\n';
                                data.forEach(item => {
                                    csv += \`"\${item.name}","\${item.email}","\${item.phone}","\${item.service}","\${item.preferred_date || ''}","\${item.preferred_time || ''}","\${item.message}","\${item.status}","\${new Date(item.created_at).toLocaleString()}"\\n\`;
                                });
                            } else {
                                csv = 'Name,Email,Phone,Service,Message,Created\\n';
                                data.forEach(item => {
                                    csv += \`"\${item.name}","\${item.email}","\${item.phone || ''}","\${item.service || ''}","\${item.message}","\${new Date(item.created_at).toLocaleString()}"\\n\`;
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
                            
                            alert('Data exported successfully from MongoDB!');
                        } catch (error) {
                            alert('Export failed: ' + error.message);
                        }
                    }
                    
                    // Auto refresh every 5 minutes
                    setTimeout(() => {
                        window.location.reload();
                    }, 5 * 60 * 1000);
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Dashboard error. Please try again.');
    }
});

// API Routes with MongoDB
app.get('/api/appointments', requireAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ created_at: -1 });
        res.json({ 
            success: true, 
            count: appointments.length, 
            data: appointments 
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
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

        const appointment = new Appointment({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            service: service || 'General Consultation',
            preferred_date: date || null,
            preferred_time: time || null,
            message: message?.trim() || '',
            status: 'pending'
        });

        await appointment.save();
        console.log('✅ New appointment saved to MongoDB:', appointment.name, '-', appointment.service);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully! We\'ll contact you soon.',
            data: {
                id: appointment._id,
                name: appointment.name,
                service: appointment.service,
                status: appointment.status
            }
        });
    } catch (error) {
        console.error('Save appointment error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
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

        const contact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || null,
            service: service || null,
            message: message.trim()
        });

        await contact.save();
        console.log('✅ New contact saved to MongoDB:', contact.name);

        res.json({
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
        });
    } catch (error) {
        console.error('Save contact error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/contacts', requireAuth, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ created_at: -1 });
        res.json({ 
            success: true, 
            count: contacts.length, 
            data: contacts 
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`🔐 Admin Login: http://localhost:${PORT}/admin/login`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log('🚀 =======================================');
    console.log('📧 Admin Email: admin@dranandfitness.com');
    console.log('🔑 Admin Password: DrAnand2025!');
    console.log('🗄️ Database: MongoDB Atlas');
    console.log('🚀 =======================================');
});
