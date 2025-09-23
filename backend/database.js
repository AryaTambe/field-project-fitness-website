 const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'fitness_art.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Appointments table
            db.run(`
                CREATE TABLE IF NOT EXISTS appointments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    service TEXT,
                    preferred_date TEXT,
                    preferred_time TEXT,
                    message TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else console.log('✅ Appointments table ready');
            });

            // Contacts table
            db.run(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT,
                    service TEXT,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'new',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else console.log('✅ Contacts table ready');
            });

            // Services table
            db.run(`
                CREATE TABLE IF NOT EXISTS services (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    features TEXT,
                    price TEXT,
                    duration TEXT,
                    active INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
                else {
                    console.log('✅ Services table ready');
                    insertDefaultServices();
                }
            });

            resolve();
        });
    });
}

function insertDefaultServices() {
    const defaultServices = [
        {
            name: 'Personal Training',
            description: 'One-on-one customized fitness programs tailored to your goals',
            features: JSON.stringify(['Custom workouts', 'Progress tracking', 'Nutrition guidance']),
            price: '₹2000/session',
            duration: '60 minutes'
        },
        {
            name: 'Group Classes',
            description: 'Energetic group fitness sessions for motivation and community',
            features: JSON.stringify(['Variety of classes', 'Expert instructors', 'Community support']),
            price: '₹800/session',
            duration: '45 minutes'
        },
        {
            name: 'Nutrition Counseling',
            description: 'Professional dietary guidance for optimal health',
            features: JSON.stringify(['Meal planning', 'Diet assessment', 'Lifestyle coaching']),
            price: '₹1500/session',
            duration: '45 minutes'
        },
        {
            name: 'Rehabilitation',
            description: 'Recovery programs for injuries and therapy needs',
            features: JSON.stringify(['Injury recovery', 'Physical therapy', 'Pain management']),
            price: '₹2500/session',
            duration: '60 minutes'
        }
    ];

    db.get("SELECT COUNT(*) as count FROM services", (err, row) => {
        if (!err && row.count === 0) {
            const stmt = db.prepare(`
                INSERT INTO services (name, description, features, price, duration)
                VALUES (?, ?, ?, ?, ?)
            `);

            defaultServices.forEach(service => {
                stmt.run([service.name, service.description, service.features, service.price, service.duration]);
            });

            stmt.finalize();
            console.log('✅ Default services inserted');
        }
    });
}

module.exports = { db, initDatabase };

