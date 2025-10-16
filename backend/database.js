// MongoDB Database Configuration for Dr. Anand's Fitness Art
// This file is kept for compatibility but main database logic is in server.js

const mongoose = require('mongoose');

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Aryya:^YHNmju7@gym-project-database.plkznus.mongodb.net/dranandfitness?retryWrites=true&w=majority&appName=Gym-Project-Database';

let isConnected = false;

// Initialize MongoDB Connection
async function initDatabase() {
    try {
        if (isConnected) {
            console.log('✅ MongoDB already connected');
            return { success: true, message: 'Already connected' };
        }

        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        console.log('✅ MongoDB connected successfully');

        return { success: true, message: 'MongoDB connected successfully' };

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        isConnected = false;
        return { success: false, message: 'MongoDB connection failed', error: error.message };
    }
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

// Create Models
let Appointment, Contact, Payment;

try {
    Appointment = mongoose.model('Appointment', AppointmentSchema);
    Contact = mongoose.model('Contact', ContactSchema);
    Payment = mongoose.model('Payment', PaymentSchema);
    console.log('✅ MongoDB models created successfully');
} catch (error) {
    console.error('❌ Error creating models:', error.message);
}

// Get connection status
function getConnectionStatus() {
    return {
        isConnected: isConnected,
        readyState: mongoose.connection.readyState,
        status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    };
}

// Close connection
async function closeDatabase() {
    try {
        if (isConnected) {
            await mongoose.connection.close();
            isConnected = false;
            console.log('✅ MongoDB connection closed');
        }
    } catch (error) {
        console.error('❌ Error closing database:', error);
    }
}

// Export everything
module.exports = {
    initDatabase,
    getConnectionStatus,
    closeDatabase,
    Appointment,
    Contact,
    Payment,
    mongoose,
    MONGODB_URI
};

console.log('📦 Database module loaded - MongoDB configuration ready');