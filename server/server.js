const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const session = require('express-session');
const app = express();

// Store customization data
let siteCustomization = {
    bannerUrl: 'https://images.squarespace-cdn.com/content/v1/6421f90cd6a614318dc936f1/5ca0415e-66be-4002-b6f9-b88651166ff9/WA-Shield%2BWordmark-Horizontal.png?format=1500w',
    backgroundColor: '#FFFFFF',
    headerColor: '#194A53',
    fontColor: '#333333',
    accentColor: '#F76B1C'
};

// Admin credentials (in production, use environment variables and proper hashing)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'wasatch2024'
};

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));
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

// Session middleware
app.use(session({
    secret: 'wasatch-academy-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true in production with HTTPS
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Load customization from file if exists
async function loadCustomization() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'customization.json'), 'utf8');
        siteCustomization = JSON.parse(data);
    } catch (error) {
        console.log('No existing customization found, using defaults');
    }
}

// Save customization to file
async function saveCustomization() {
    try {
        await fs.writeFile(
            path.join(__dirname, 'data', 'customization.json'),
            JSON.stringify(siteCustomization, null, 2)
        );
    } catch (error) {
        console.error('Error saving customization:', error);
    }
}

// Initialize data and start server
async function initializeServer() {
    try {
        // Load customization
        const customData = await fs.readFile(path.join(__dirname, 'data', 'customization.json'), 'utf8');
        siteCustomization = JSON.parse(customData);
        console.log('Loaded customization:', siteCustomization);
    } catch (error) {
        console.log('Using default customization');
    }
}

// Initialize data and start server
initializeServer().then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Auth routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
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

// Customization API Routes
app.get('/api/customization', (req, res) => {
    res.json(siteCustomization);
});

app.post('/api/customization', requireAuth, async (req, res) => {
    try {
        // Update customization
        siteCustomization = { ...siteCustomization, ...req.body };
        
        // Save to file
        await fs.writeFile(
            path.join(__dirname, 'data', 'customization.json'),
            JSON.stringify(siteCustomization, null, 2)
        );

        // Send updated customization back
        res.json({ 
            success: true, 
            message: 'Customization saved successfully',
            customization: siteCustomization
        });
    } catch (error) {
        console.error('Error saving customization:', error);
        res.status(500).json({ success: false, message: 'Error saving customization' });
    }
});

// Partner API Routes
app.get('/api/partners', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'partners.json'), 'utf8');
        const partners = JSON.parse(data);
        res.json(partners);
    } catch (error) {
        res.status(500).json({ error: 'Error reading partners data' });
    }
});

app.post('/api/partners', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'partners.json'), 'utf8');
        const partners = JSON.parse(data);
        const newPartner = {
            id: Date.now().toString(),
            ...req.body
        };
        partners.push(newPartner);
        await fs.writeFile(
            path.join(__dirname, 'data', 'partners.json'),
            JSON.stringify(partners, null, 2)
        );
        res.json(newPartner);
    } catch (error) {
        res.status(500).json({ error: 'Error saving partner data' });
    }
});

app.put('/api/partners/:id', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'partners.json'), 'utf8');
        let partners = JSON.parse(data);
        const index = partners.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        partners[index] = { ...partners[index], ...req.body };
        await fs.writeFile(
            path.join(__dirname, 'data', 'partners.json'),
            JSON.stringify(partners, null, 2)
        );
        res.json(partners[index]);
    } catch (error) {
        res.status(500).json({ error: 'Error updating partner data' });
    }
});

app.delete('/api/partners/:id', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'partners.json'), 'utf8');
        let partners = JSON.parse(data);
        partners = partners.filter(p => p.id !== req.params.id);
        await fs.writeFile(
            path.join(__dirname, 'data', 'partners.json'),
            JSON.stringify(partners, null, 2)
        );
        res.json({ success: true });
    } catch (error) {
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

