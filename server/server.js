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
// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/api/partners', async (req, res) => {
    try {
        console.log('Attempting to read partners.json...');
        const filePath = path.join(__dirname, 'data', 'partners.json');
        console.log('File path:', filePath);
        
        const data = await fs.readFile(filePath, 'utf8');
        console.log('File read successfully');
        
        const partners = JSON.parse(data);
        console.log(`Found ${partners.length} partners`);
        
        res.json(partners);
    } catch (error) {
        console.error('Error in /api/partners:', error);
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Partners data file not found' });
        } else if (error instanceof SyntaxError) {
            res.status(500).json({ error: 'Invalid partners data format' });
        } else {
            res.status(500).json({ error: 'Error reading partners data' });
        }
    }
});

// Get single partner by ID
app.get('/api/partners/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data', 'partners.json'), 'utf8');
        const partners = JSON.parse(data);
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

// Update partner
app.put('/api/partners/:id', requireAuth, async (req, res) => {
    const partnersPath = path.join(__dirname, 'data', 'partners.json');
    const backupPath = path.join(__dirname, 'data', 'partners.backup.json');
    
    try {
        // Read and parse current partners
        const data = await fs.readFile(partnersPath, 'utf8');
        let partners;
        
        try {
            partners = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing partners.json:', parseError);
            return res.status(500).json({ error: 'Invalid partners data structure' });
        }
        
        // Validate partners array
        if (!Array.isArray(partners)) {
            console.error('Partners data is not an array');
            return res.status(500).json({ error: 'Invalid partners data structure' });
        }
        
        // Create backup before modification
        await fs.writeFile(backupPath, JSON.stringify(partners, null, 2));
        
        // Find partner to update
        const index = partners.findIndex(p => p.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Partner not found' });
        }
        
        // Validate required fields in request body
        const requiredFields = ['name', 'location', 'bio'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        
        // Create updated partner object
        const updatedPartner = {
            id: req.params.id,         // Ensure ID remains unchanged
            name: req.body.name,
            location: req.body.location,
            image: req.body.image || partners[index].image,
            bio: req.body.bio,
            website: req.body.website || partners[index].website,
            contact: {
                email: req.body.contact?.email || partners[index].contact?.email,
                phone: req.body.contact?.phone || partners[index].contact?.phone
            },
            partnershipDetails: req.body.partnershipDetails || partners[index].partnershipDetails
        };
        
        // Update partner in array
        partners[index] = updatedPartner;
        
        // Validate final partners array
        if (partners.length !== 6) {
            // Restore from backup if validation fails
            await fs.copyFile(backupPath, partnersPath);
            return res.status(500).json({ error: 'Partner update would result in invalid data' });
        }
        
        // Write back to file
        try {
            await fs.writeFile(partnersPath, JSON.stringify(partners, null, 2));
            // Remove backup after successful write
            await fs.unlink(backupPath).catch(() => {}); // Ignore error if backup doesn't exist
        } catch (writeError) {
            console.error('Error writing partners file:', writeError);
            // Restore from backup
            await fs.copyFile(backupPath, partnersPath);
            throw new Error('Failed to save partner data');
        }
        
        // Log success
        console.log(`Successfully updated partner ${req.params.id}`);
        console.log('Total partners:', partners.length);
        
        // Send response
        res.json(updatedPartner);
    } catch (error) {
        console.error('Error updating partner:', error);
        res.status(500).json({ 
            error: 'Error updating partner data',
            details: error.message 
        });
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

