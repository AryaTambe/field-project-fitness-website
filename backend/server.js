const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');  // ✅ Only ONE path declaration
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

console.log('🏥 =======================================');
console.log('🏥 DR. ANAND\'S FITNESS ART - FULL STACK');
console.log('🏥 Refined + Database + Hosting Ready');
console.log('🏥 =======================================');

// Health check
app.get('/api/health', (req, res) => {
    db.get("SELECT COUNT(*) as appointments FROM appointments", (err, appointmentRow) => {
        db.get("SELECT COUNT(*) as contacts FROM contacts", (err2, contactRow) => {
            res.json({ 
                message: 'Dr. Anand\'s Fitness Art Backend with Database is running! ✨', 
                timestamp: new Date().toISOString(),
                database: {
                    status: 'Connected',
                    appointments: appointmentRow?.appointments || 0,
                    contacts: contactRow?.contacts || 0
                },
                features: ['SQLite Database', 'Refined Design', 'No Bounce', 'No Glow']
            });
        });
    });
});

// Get all services
app.get('/api/services', (req, res) => {
    db.all("SELECT * FROM services WHERE active = 1 ORDER BY id", (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching services' });
        } else {
            const services = rows.map(row => ({
                ...row,
                features: JSON.parse(row.features || '[]')
            }));
            res.json({ success: true, count: services.length, data: services });
        }
    });
});

// Get business info
app.get('/api/info', (req, res) => {
    res.json({
        business: {
            name: 'Dr. Anand\'s Fitness Art',
            tagline: 'Fitness, Nutrition & Healing',
            phone: '+91-99999-99999',
            email: 'info@anandfitness.com',
            address: '123 Fitness Street, Health City',
            hours: 'Mon-Fri: 5AM-10PM, Sat-Sun: 6AM-8PM'
        }
    });
});

// Get appointments (admin)
app.get('/api/appointments', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    db.all("SELECT * FROM appointments ORDER BY created_at DESC LIMIT ?", [limit], (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching appointments' });
        } else {
            res.json({ success: true, count: rows.length, data: rows });
        }
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

    const stmt = db.prepare(`
        INSERT INTO appointments (name, email, phone, service, preferred_date, preferred_time, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
        name.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        service || 'General Consultation',
        date || null,
        time || null,
        message || ''
    ], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Error creating appointment' });
        } else {
            console.log('✅ Appointment created:', this.lastID);
            res.status(201).json({
                success: true,
                message: 'Appointment request submitted successfully! 🎉',
                data: { id: this.lastID, name: name.trim(), service: service || 'General Consultation' }
            });
        }
    });

    stmt.finalize();
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

    const stmt = db.prepare(`
        INSERT INTO contacts (name, email, phone, service, message)
        VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run([
        name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        service || null,
        message.trim()
    ], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Error processing contact form' });
        } else {
            console.log('✅ Contact saved:', this.lastID);
            res.json({
                success: true,
                message: 'Thank you for your message! We\'ll get back to you within 24 hours. 📧'
            });
        }
    });

    stmt.finalize();
});

// Get contacts (admin)
app.get('/api/contacts', (req, res) => {
    db.all("SELECT * FROM contacts ORDER BY created_at DESC LIMIT 50", (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: 'Error fetching contacts' });
        } else {
            res.json({ success: true, count: rows.length, data: rows });
        }
    });
});

// Update appointment status
app.put('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const stmt = db.prepare("UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    
    stmt.run([status, id], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: 'Error updating appointment' });
        } else if (this.changes === 0) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
        } else {
            res.json({ success: true, message: `Appointment status updated to ${status}` });
        }
    });

    stmt.finalize();
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`🏥 Website: http://localhost:${PORT}`);
            console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
            console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
            console.log('🗄️  Database: SQLite (fitness_art.db)');
            console.log('🏥 =======================================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});

