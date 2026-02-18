import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me';

// Register User (and Tenant if needed later, currently assumes existing tenant or auto-creates)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, tenantName } = req.body;

        if (!email || !password || !tenantName) {
            return res.status(400).json({ error: 'Email, password, and tenant name are required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: tenantName,
                slug: tenantName.toLowerCase().replace(/\s+/g, '-'),
                systemPrompt: "You are a helpful AI assistant."
            }
        });

        // Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'admin',
                tenantId: tenant.id
            }
        });

        // Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, tenantId: tenant.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: tenant.id } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Current User (Me)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { tenant: true } // Include tenant details
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, tenant: user.tenant } });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
