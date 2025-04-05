require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'cdn.tailwindcss.com', 'cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            fontSrc: ["'self'", 'fonts.gstatic.com'],
            connectSrc: ["'self'"]
        }
    }
}));

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};
app.use(cors(corsOptions));

// Admin credentials from environment variables
const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'wasatch2024'
};

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client'), {
    maxAge: '1d',
    etag: true
}));
app.use('/admin', express.static(path.join(__dirname, 'views')));

// Set proper MIME types
app.use((req, res, next) => {
    if (req.url.endsWith('.css')) {
        res.type('text/css');
    } else if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

// Session configuration
const sessionConfig = {
    store: new FileStore({
        path: path.join(__dirname, 'sessions'),
        ttl: 86400, // 24 hours
        reapInterval: 3600, // Clean up expired sessions every hour
        retries: 0
    }),
    secret: process.env.SESSION_SECRET || 'wasatch-academy-secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: 'sessionId', // Change default connect.sid
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
    }
};

// Use secure cookies in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Rate limiting for login attempts
let loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Partner data management
const PARTNERS_FILE = path.join(__dirname, 'data', 'partners.json');
const PARTNERS_BACKUP = path.join(__dirname, 'data', 'partners.backup.json');

async function readPartners() {
    try {
        const data = await fs.readFile(PARTNERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writePartners(partners) {
    // Create backup first
    try {
        const currentData = await fs.readFile(PARTNERS_FILE, 'utf8');
        await fs.writeFile(PARTNERS_BACKUP, currentData);
    } catch (error) {
        console.error('Error creating backup:', error);
    }

    // Write new data
    await fs.writeFile(PARTNERS_FILE, JSON.stringify(partners, null, 2));
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Auth routes with rate limiting
app.post('/api/login', async (req, res) => {
    const ip = req.ip;
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || { count: 0, timestamp: now };

    // Check if IP is locked out
    if (attempts.count >= MAX_LOGIN_ATTEMPTS && now - attempts.timestamp < LOCKOUT_TIME) {
        return res.status(429).json({ 
            error: 'Too many login attempts. Please try again later.' 
        });
    }

    // Reset attempts if lockout period has passed
    if (now - attempts.timestamp >= LOCKOUT_TIME) {
        attempts.count = 0;
    }

    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        req.session.isAuthenticated = true;
        loginAttempts.delete(ip); // Reset attempts on successful login
        res.json({ success: true });
    } else {
        attempts.count++;
        attempts.timestamp = now;
        loginAttempts.set(ip, attempts);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Partner API Routes
app.get('/api/partners', async (req, res) => {
    try {
        const partners = await readPartners();
        res.json(partners);
    } catch (error) {
        console.error('Error reading partners:', error);
        res.status(500).json({ error: 'Error reading partners data' });
    }
});

app.get('/api/partners/:id', async (req, res) => {
    try {
        const partners = await readPartners();
        const partner = partners.find(p => p.id === req.params.id);
        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        res.json(partner);
    } catch (error) {
        console.error('Error reading partner:', error);
        res.status(500).json({ error: 'Error reading partner data' });
    }
});

app.post('/api/partners', requireAuth, async (req, res) => {
    try {
        const partners = await readPartners();
        const newPartner = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        partners.push(newPartner);
        await writePartners(partners);
        res.json(newPartner);
    } catch (error) {
        console.error('Error creating partner:', error);
        res.status(500).json({ error: 'Error saving partner data' });
    }
});

app.put('/api/partners/:id', requireAuth, async (req, res) => {
    try {
        const partners = await readPartners();
        const index = partners.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const updatedPartner = {
            ...partners[index],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };

        partners[index] = updatedPartner;
        await writePartners(partners);
        res.json(updatedPartner);
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ error: 'Error updating partner data' });
    }
});

app.delete('/api/partners/:id', requireAuth, async (req, res) => {
    try {
        const partners = await readPartners();
        const filteredPartners = partners.filter(p => p.id !== req.params.id);
        await writePartners(filteredPartners);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting partner:', error);
        res.status(500).json({ error: 'Error deleting partner' });
    }
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAuthenticated });
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Cleanup old sessions periodically
setInterval(() => {
    const now = Date.now();
    loginAttempts.forEach((attempts, ip) => {
        if (now - attempts.timestamp >= LOCKOUT_TIME) {
            loginAttempts.delete(ip);
        }
    });
}, LOCKOUT_TIME);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
