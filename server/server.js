require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors({
    origin: 'http://localhost:8000',
    credentials: true
}));
app.use(express.json());
// Serve client static files
app.use(express.static(path.join(__dirname, '../client')));

// Serve admin static files
app.use('/admin.js', express.static(path.join(__dirname, 'views/admin.js')));
app.use('/admin.css', express.static(path.join(__dirname, 'views/admin.css')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'wasatch-academy-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const authMiddleware = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Data file path
const PARTNERS_FILE = path.join(__dirname, 'data', 'partners.json');

// Ensure data directory and file exist
async function ensureDataFile() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(PARTNERS_FILE);
        } catch {
            await fs.writeFile(PARTNERS_FILE, '[]');
        }
    } catch (error) {
        console.error('Error initializing data file:', error);
    }
}

// Initialize data file
ensureDataFile();

// Authentication Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // For demo purposes, using hardcoded credentials
    // In production, use environment variables and proper password hashing
    if (username === 'admin' && password === 'wasatch2024') {
        req.session.isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Partner Routes
// Get all partners
app.get('/api/partners', async (req, res) => {
    try {
        const data = await fs.readFile(PARTNERS_FILE, 'utf8');
        const partners = JSON.parse(data);
        res.json(partners);
    } catch (error) {
        console.error('Error reading partners:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single partner
app.get('/api/partners/:id', async (req, res) => {
    try {
        const data = await fs.readFile(PARTNERS_FILE, 'utf8');
        const partners = JSON.parse(data);
        const partner = partners.find(p => p.id === parseInt(req.params.id));
        
        if (partner) {
            res.json(partner);
        } else {
            res.status(404).json({ error: 'Partner not found' });
        }
    } catch (error) {
        console.error('Error reading partner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new partner (protected)
app.post('/api/partners', authMiddleware, async (req, res) => {
    try {
        const data = await fs.readFile(PARTNERS_FILE, 'utf8');
        const partners = JSON.parse(data);
        
        const newPartner = {
            id: partners.length > 0 ? Math.max(...partners.map(p => p.id)) + 1 : 1,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        partners.push(newPartner);
        await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2));
        
        res.status(201).json(newPartner);
    } catch (error) {
        console.error('Error creating partner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update partner (protected)
app.put('/api/partners/:id', authMiddleware, async (req, res) => {
    try {
        const data = await fs.readFile(PARTNERS_FILE, 'utf8');
        let partners = JSON.parse(data);
        const index = partners.findIndex(p => p.id === parseInt(req.params.id));
        
        if (index !== -1) {
            partners[index] = {
                ...partners[index],
                ...req.body,
                id: partners[index].id,
                updatedAt: new Date().toISOString()
            };
            
            await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2));
            res.json(partners[index]);
        } else {
            res.status(404).json({ error: 'Partner not found' });
        }
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete partner (protected)
app.delete('/api/partners/:id', authMiddleware, async (req, res) => {
    try {
        const data = await fs.readFile(PARTNERS_FILE, 'utf8');
        let partners = JSON.parse(data);
        const index = partners.findIndex(p => p.id === parseInt(req.params.id));
        
        if (index !== -1) {
            partners.splice(index, 1);
            await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Partner not found' });
        }
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Serve the main page for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});