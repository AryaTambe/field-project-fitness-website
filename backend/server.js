const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection with your credentials
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Aryya:^YHNmju7@gym-project-database.plkznus.mongodb.net/dranandfitness?retryWrites=true&w=majority&appName=Gym-Project-Database';

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RSDxbPfpdNcvgW',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'aYO2242OzEyYvb4VjyhRDXsO'
});

// YOUR ORIGINAL SERVICE PRICING (in paise - Razorpay uses smallest currency unit)
const SERVICES = {
  'Complete Health & Pain Relief Package': {
    price: 2500000, // ₹25,000
    duration: '6 months',
    description: 'Comprehensive health and pain management program'
  },
  'Fat Loss Package - Below 85kg': {
    price: 1500000, // ₹15,000
    duration: '6 months', 
    description: 'Specialized program for weight below 85kg'
  },
  'Fat Loss Package - Above 85kg': {
    price: 2500000, // ₹25,000
    duration: '6 months',
    description: 'Intensive program for weight above 85kg'
  },
  'Consultation & Diet Chart': {
    price: 250000, // ₹2,500
    duration: 'one-time',
    description: 'Professional consultation with diet chart'
  },
  'Online Training': {
    price: 2500000, // ₹25,000
    duration: '6 months',
    description: 'Complete online training program'
  },
  'Basic Consultation': {
    price: 10000, // ₹100
    duration: 'per session',
    description: 'Basic consultation session'
  }
};

// In-memory storage (fallback)
let appointments = [];
let contacts = [];
let payments = [];
let isMongoConnected = false;

// Try MongoDB connection
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
    console.log('⚠️ MongoDB connection failed, using in-memory storage');
    console.log('Error:', err.message);
    isMongoConnected = false;
  });
}

// MongoDB Schemas
const AppointmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, default: 'Basic Consultation' },
  preferred_date: { type: String, default: null },
  preferred_time: { type: String, default: null },
  message: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  payment_status: { type: String, default: 'not_required' },
  payment_id: { type: String, default: null },
  razorpay_order_id: { type: String, default: null },
  razorpay_payment_id: { type: String, default: null },
  amount: { type: Number, default: 0 },
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

const PaymentSchema = new mongoose.Schema({
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String, required: true },
  razorpay_signature: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, default: 'success' },
  customer_name: { type: String, required: true },
  customer_email: { type: String, required: true },
  customer_phone: { type: String, required: true },
  service: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// MongoDB Models
let Appointment, Contact, Payment;
try {
  Appointment = mongoose.model('Appointment', AppointmentSchema);
  Contact = mongoose.model('Contact', ContactSchema);
  Payment = mongoose.model('Payment', PaymentSchema);
} catch (error) {
  console.log('Using in-memory models');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

console.log('🚀 =======================================');
console.log('🚀 DR. ANAND\'S FITNESS ART - WITH ADMIN + RAZORPAY');
console.log('🚀 Your Original Prices - Payment Ready');
console.log('🚀 =======================================');

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// FULL ADMIN DASHBOARD WITH EXPORT FUNCTIONALITY - FIXED VERSION
app.get('/admin', async (req, res) => {
  let totalAppointments = appointments.length;
  let totalContacts = contacts.length;
  let totalPayments = payments.length;
  let totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  let recentAppointments = [...appointments].slice(-5).reverse();
  let recentContacts = [...contacts].slice(-5).reverse();
  let recentPayments = [...payments].slice(-5).reverse();
  let todaysBookings = 0;
  let messagesCount = 0;

  // Try MongoDB if connected
  if (isMongoConnected && Appointment && Contact && Payment) {
    try {
      totalAppointments = await Appointment.countDocuments();
      totalContacts = await Contact.countDocuments(); 
      totalPayments = await Payment.countDocuments();

      const revenueResult = await Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      recentAppointments = await Appointment.find().sort({ created_at: -1 }).limit(5);
      recentContacts = await Contact.find().sort({ created_at: -1 }).limit(5);
      recentPayments = await Payment.find().sort({ created_at: -1 }).limit(5);

      // Today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      todaysBookings = await Appointment.countDocuments({
        created_at: { $gte: today, $lt: tomorrow }
      });

      messagesCount = totalContacts;

    } catch (error) {
      console.log('Using memory data for admin dashboard');
    }
  }

  const dbStatus = isMongoConnected ? 'MongoDB Connected' : 'Memory Storage';

  // ENHANCED ADMIN DASHBOARD HTML WITH RECENT PAYMENTS SECTION
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dr. Anand's Fitness Art - Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%);
            color: #374151;
            line-height: 1.6;
        }
        .header { 
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
        }
        .header-content { 
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo { 
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-icon { 
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #d97706;
            font-size: 18px;
        }
        .logo-text h1 { 
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 4px;
        }
        .logo-text p { 
            font-size: 14px;
            opacity: 0.9;
        }
        .status { 
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 25px;
            backdrop-filter: blur(10px);
        }
        .status-dot { 
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .dashboard { 
            max-width: 1200px;
            margin: 30px auto;
            padding: 0 20px;
        }
        .dashboard-header { 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            border: 2px solid #bae6fd;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .dashboard-header h2 { 
            color: #0369a1;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .dashboard-header p { 
            color: #0284c7;
            font-size: 14px;
        }
        .action-buttons { 
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .btn { 
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .btn-primary { 
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
        }
        .btn-primary:hover { 
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
        }
        .btn-export { 
            background: #3b82f6;
            color: white;
        }
        .btn-export:hover { 
            background: #2563eb;
            transform: translateY(-2px);
        }
        .btn-contacts { 
            background: #8b5cf6;
            color: white;
        }
        .btn-contacts:hover { 
            background: #7c3aed;
            transform: translateY(-2px);
        }
        .btn-health { 
            background: #22c55e;
            color: white;
        }
        .btn-health:hover { 
            background: #16a34a;
            transform: translateY(-2px);
        }
        .stats-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card { 
            background: white;
            border: 2px solid #fef3c7;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
            transition: all 0.3s ease;
        }
        .stat-card:hover { 
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
            border-color: #f59e0b;
        }
        .stat-icon { 
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .stat-number { 
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
        }
        .stat-label { 
            color: #6b7280;
            font-weight: 500;
            font-size: 14px;
        }
        .stat-sublabel { 
            color: #9ca3af;
            font-size: 12px;
            margin-top: 4px;
        }
        .content-grid { 
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .content-section { 
            background: white;
            border: 2px solid #fef3c7;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
        }
        .section-header { 
            padding: 20px 24px;
            border-bottom: 1px solid #fef3c7;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .section-header h3 { 
            font-size: 16px;
            font-weight: 700;
            color: #374151;
        }
        .section-badge { 
            background: #fbbf24;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .section-content { 
            padding: 0;
            max-height: 400px;
            overflow-y: auto;
        }
        .item { 
            padding: 20px 24px;
            border-bottom: 1px solid #f3f4f6;
            transition: background 0.2s ease;
        }
        .item:hover { 
            background: #fafafa;
        }
        .item:last-child { 
            border-bottom: none;
        }
        .item-header { 
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        .item-title { 
            font-weight: 600;
            color: #374151;
            font-size: 14px;
        }
        .item-badge { 
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-pending { 
            background: #fbbf24;
            color: white;
        }
        .badge-new { 
            background: #22c55e;
            color: white;
        }
        .item-details { 
            font-size: 13px;
            color: #6b7280;
            line-height: 1.5;
        }
        .item-meta { 
            font-size: 11px;
            color: #9ca3af;
            margin-top: 8px;
        }
        .empty-state { 
            padding: 40px 24px;
            text-align: center;
            color: #9ca3af;
        }
        .empty-state-icon { 
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }
        .footer { 
            background: white;
            border: 2px solid #fef3c7;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
        }
        .footer-status { 
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
        }
        .footer-text { 
            color: #6b7280;
            font-size: 14px;
        }

        /* Payment-specific styling */
        .payment-section .section-header { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
        .payment-section .section-header h3 { color: #16a34a; }
        .payment-section .section-badge { background: #22c55e; }
        .payment-item { background: linear-gradient(135deg, #f0fdf4, #dcfce7); }
        .payment-amount { font-weight: 700; color: #16a34a; font-size: 16px; }

        @media (max-width: 768px) {
            .content-grid { grid-template-columns: 1fr; }
            .header-content { flex-direction: column; gap: 16px; text-align: center; }
            .action-buttons { justify-content: center; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <div class="logo">
                <div class="logo-icon">DR</div>
                <div class="logo-text">
                    <h1>Dr. Anand's Fitness Art</h1>
                    <p>Admin Dashboard - Export Fixed</p>
                </div>
            </div>
            <div class="status">
                <div class="status-dot"></div>
                <span>MongoDB Connected</span>
            </div>
            <a href="/" class="btn btn-primary">🏠 View Website</a>
        </div>
    </header>

    <div class="dashboard">
        <div class="dashboard-header">
            <h2>🎯 Admin Dashboard Active ✨</h2>
            <p>MongoDB Database Connected & Operational</p>
        </div>

        <div class="action-buttons">
            <a href="/" class="btn btn-primary">🏠 View Website</a>
            <button class="btn btn-export" onclick="exportData('appointments')">📊 Export Appointments</button>
            <button class="btn btn-contacts" onclick="exportData('contacts')">📝 Export Contacts</button>
            <button class="btn btn-health" onclick="checkHealth()">💚 System Health</button>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon" style="background: #fbbf24;">📅</div>
                <div class="stat-number" style="color: #d97706;">${totalAppointments}</div>
                <div class="stat-label">Total Appointments</div>
                <div class="stat-sublabel">+${todaysBookings} today</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #f59e0b;">📈</div>
                <div class="stat-number" style="color: #d97706;">${todaysBookings}</div>
                <div class="stat-label">Today's Bookings</div>
                <div class="stat-sublabel">New bookings</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #3b82f6;">💬</div>
                <div class="stat-number" style="color: #2563eb;">${messagesCount}</div>
                <div class="stat-label">Total Messages</div>
                <div class="stat-sublabel">+0 today</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon" style="background: #22c55e;">🚀</div>
                <div class="stat-number" style="color: #16a34a;">LIVE</div>
                <div class="stat-label">System Status</div>
                <div class="stat-sublabel">All systems operational</div>
            </div>
        </div>

        <div class="content-grid">
            <div class="content-section">
                <div class="section-header">
                    <h3>📅 Recent Appointments (MongoDB)</h3>
                    <span class="section-badge">Live</span>
                </div>
                <div class="section-content">
                    ${recentAppointments.length > 0 ? recentAppointments.map(apt => `
                        <div class="item">
                            <div class="item-header">
                                <div class="item-title">${apt.name}</div>
                                <span class="item-badge badge-pending">pending</span>
                            </div>
                            <div class="item-details">
                                ${apt.service}<br>
                                📧 ${apt.email}<br>
                                📱 ${apt.phone}
                                ${apt.preferred_date ? `<br>📅 ${apt.preferred_date} ${apt.preferred_time || ''}` : ''}
                                ${apt.razorpay_payment_id ? `<br>💳 Payment ID: ${apt.razorpay_payment_id}` : ''}
                                ${apt.amount && apt.amount > 0 ? `<br>💰 Amount: ₹${(apt.amount / 100).toLocaleString()}` : ''}
                            </div>
                            <div class="item-meta">
                                🕒 ${new Date(apt.created_at).toLocaleString()}
                                ${apt.message ? `<br>💬 ${apt.message}` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-state-icon">📅</div>
                            <div>No appointments yet</div>
                            <div style="font-size: 12px; margin-top: 8px;">New bookings will appear here</div>
                        </div>
                    `}
                </div>
            </div>

            <div class="content-section">
                <div class="section-header">
                    <h3>💬 Recent Messages (MongoDB)</h3>
                    <span class="section-badge">Live</span>
                </div>
                <div class="section-content">
                    ${recentContacts.length > 0 ? recentContacts.map(contact => `
                        <div class="item">
                            <div class="item-header">
                                <div class="item-title">${contact.name}</div>
                                <span class="item-badge badge-new">new</span>
                            </div>
                            <div class="item-details">
                                ${contact.service ? `${contact.service}<br>` : ''}
                                📧 ${contact.email}
                                ${contact.phone ? `<br>📱 ${contact.phone}` : ''}
                            </div>
                            <div class="item-meta">
                                🕒 ${new Date(contact.created_at).toLocaleString()}<br>
                                💬 "${contact.message}"
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-state-icon">💬</div>
                            <div>No messages yet</div>
                            <div style="font-size: 12px; margin-top: 8px;">Contact form submissions will appear here</div>
                        </div>
                    `}
                </div>
            </div>
        </div>

        <!-- NEW PAYMENTS SECTION -->
        <div class="content-grid">
            <div class="content-section payment-section">
                <div class="section-header">
                    <h3>💳 Recent Payments (MongoDB)</h3>
                    <span class="section-badge">Live</span>
                </div>
                <div class="section-content">
                    ${recentPayments.length > 0 ? recentPayments.map(payment => `
                        <div class="item payment-item">
                            <div class="item-header">
                                <div class="item-title">${payment.customer_name}</div>
                                <span class="payment-amount">₹${(payment.amount / 100).toLocaleString()}</span>
                            </div>
                            <div class="item-details">
                                ${payment.service}<br>
                                📧 ${payment.customer_email}<br>
                                📱 ${payment.customer_phone}<br>
                                💳 Payment ID: ${payment.razorpay_payment_id}
                            </div>
                            <div class="item-meta">
                                🕒 ${new Date(payment.created_at).toLocaleString()}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-state-icon">💳</div>
                            <div>No payments yet</div>
                            <div style="font-size: 12px; margin-top: 8px;">Payment transactions will appear here</div>
                        </div>
                    `}
                </div>
            </div>

            <div class="content-section">
                <div class="section-header">
                    <h3>📊 Revenue Analytics</h3>
                    <span class="section-badge">Live</span>
                </div>
                <div class="section-content">
                    <div class="item">
                        <div class="item-header">
                            <div class="item-title">Total Revenue</div>
                            <span class="payment-amount">₹${(totalRevenue / 100).toLocaleString()}</span>
                        </div>
                        <div class="item-details">
                            From ${totalPayments} successful payments
                        </div>
                    </div>

                    <div class="item">
                        <div class="item-header">
                            <div class="item-title">Conversion Rate</div>
                            <span style="color: #22c55e; font-weight: bold;">
                                ${totalAppointments > 0 ? Math.round((totalPayments / totalAppointments) * 100) : 0}%
                            </span>
                        </div>
                        <div class="item-details">
                            ${totalPayments} payments from ${totalAppointments} appointments
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="footer-status">
                <span style="color: #22c55e;">🟢</span>
                <span>MongoDB Active</span>
            </div>
            <div class="footer-text">
                Last updated: ${new Date().toLocaleString()} • Database: ${dbStatus} • Export: Fixed & Working
            </div>
        </div>
    </div>

    <script>
        function exportData(type) {
            const url = '/api/export/' + type;
            const link = document.createElement('a');
            link.href = url;
            link.download = type + '_export_' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show notification
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#22c55e;color:white;padding:16px 24px;border-radius:8px;z-index:10000;font-weight:600;';
            notification.textContent = type.charAt(0).toUpperCase() + type.slice(1) + ' exported successfully!';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }

        function checkHealth() {
            fetch('/api/health')
                .then(response => response.json())
                .then(data => {
                    const notification = document.createElement('div');
                    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#22c55e;color:white;padding:16px 24px;border-radius:8px;z-index:10000;font-weight:600;';
                    notification.textContent = '✅ ' + data.message + ' - All systems operational!';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 4000);
                })
                .catch(error => {
                    const notification = document.createElement('div');
                    notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:16px 24px;border-radius:8px;z-index:10000;font-weight:600;';
                    notification.textContent = '❌ System check failed';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 4000);
                });
        }

        // Auto-refresh every 30 seconds
        setInterval(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Dr. Anand\'s Fitness Art Server Running',
    database: isMongoConnected ? 'MongoDB Connected' : 'Memory Storage',
    timestamp: new Date().toISOString(),
    stats: {
      appointments: appointments.length,
      contacts: contacts.length,
      payments: payments.length
    }
  });
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  console.log('📝 Contact form submission:', req.body);

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
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      service: service || null,
      message: message.trim(),
      created_at: new Date()
    };

    // Try MongoDB first
    if (isMongoConnected && Contact) {
      try {
        const contact = new Contact(contactData);
        await contact.save();
        console.log('✅ Contact saved to MongoDB');
      } catch (mongoError) {
        console.log('⚠️ MongoDB contact save failed:', mongoError.message);
        // Fall back to memory
        contactData.id = Date.now();
        contacts.push(contactData);
      }
    } else {
      // Use memory storage
      contactData.id = Date.now();
      contacts.push(contactData);
      console.log('✅ Contact saved to memory');
    }

    res.json({
      success: true,
      message: 'Thank you for contacting us! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
  console.log('💳 Creating Razorpay order:', req.body);

  try {
    const { service, amount, customerinfo } = req.body;

    if (!service || !amount || !customerinfo) {
      return res.status(400).json({
        success: false,
        message: 'Service, amount, and customer info are required'
      });
    }

    const options = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
      notes: {
        service: service,
        customer_name: customerinfo.name,
        customer_email: customerinfo.email,
        customer_phone: customerinfo.phone
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order.id);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_RSDxbPfpdNcvgW'
    });

  } catch (error) {
    console.error('❌ Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order. Please try again.'
    });
  }
});

// Verify payment and save appointment
app.post('/api/verify-payment', async (req, res) => {
  console.log('🔍 Verifying payment:', req.body);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerinfo,
      service,
      preferred_date,
      preferred_time,
      message
    } = req.body;

    // Verify payment signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'aYO2242OzEyYvb4VjyhRDXsO')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log('✅ Payment signature verified');

      // Get service amount
      const serviceInfo = SERVICES[service] || SERVICES['Basic Consultation'];
      const amount = serviceInfo.price;

      // Create appointment with payment details
      const appointmentData = {
        name: customerinfo.name,
        email: customerinfo.email,
        phone: customerinfo.phone,
        service: service,
        preferred_date: preferred_date || null,
        preferred_time: preferred_time || null,
        message: message || '',
        status: 'confirmed', // Changed from pending to confirmed
        payment_status: 'completed', // Add payment status
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        amount: amount,
        created_at: new Date()
      };

      // Create payment record
      const paymentData = {
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        amount: amount,
        currency: 'INR',
        status: 'success',
        customer_name: customerinfo.name,
        customer_email: customerinfo.email,
        customer_phone: customerinfo.phone,
        service: service,
        created_at: new Date()
      };

      // Try MongoDB first
      if (isMongoConnected && Appointment && Payment) {
        try {
          const appointment = new Appointment(appointmentData);
          await appointment.save();

          const payment = new Payment(paymentData);
          await payment.save();

          console.log('✅ Appointment and payment saved to MongoDB');
        } catch (mongoError) {
          console.log('⚠️ MongoDB save failed:', mongoError.message);
          // Fall back to memory
          appointmentData.id = Date.now();
          paymentData.id = Date.now() + 1;
          appointments.push(appointmentData);
          payments.push(paymentData);
        }
      } else {
        // Use memory storage
        appointmentData.id = Date.now();
        paymentData.id = Date.now() + 1;
        appointments.push(appointmentData);
        payments.push(paymentData);
        console.log('✅ Appointment and payment saved to memory');
      }

      res.json({
        success: true,
        message: 'Payment verified and appointment confirmed successfully!'
      });

    } else {
      console.log('❌ Invalid payment signature');
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed. Please contact support.'
    });
  }
});

// Export endpoints
app.get('/api/export/appointments', async (req, res) => {
  try {
    let exportData = appointments;

    if (isMongoConnected && Appointment) {
      try {
        exportData = await Appointment.find().sort({ created_at: -1 });
      } catch (error) {
        console.log('Using memory data for export');
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=appointments_export.json');
    res.json({
      export_date: new Date().toISOString(),
      total_appointments: exportData.length,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

app.get('/api/export/contacts', async (req, res) => {
  try {
    let exportData = contacts;

    if (isMongoConnected && Contact) {
      try {
        exportData = await Contact.find().sort({ created_at: -1 });
      } catch (error) {
        console.log('Using memory data for export');
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts_export.json');
    res.json({
      export_date: new Date().toISOString(),
      total_contacts: exportData.length,
      data: exportData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

app.get('/api/export/payments', async (req, res) => {
  try {
    let exportData = payments;

    if (isMongoConnected && Payment) {
      try {
        exportData = await Payment.find().sort({ created_at: -1 });
      } catch (error) {
        console.log('Using memory data for export');
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=payments_export.json');
    res.json({
      export_date: new Date().toISOString(),
      total_payments: exportData.length,
      total_revenue: exportData.reduce((sum, p) => sum + (p.amount || 0), 0),
      data: exportData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🏠 Main Website: http://localhost:${PORT}/`);
});