import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['operator', 'client']),
  clientId: z.string().uuid().optional(),
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        client: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Register (for development purposes)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, clientId } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      role,
      clientId,
    }).returning();

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      with: {
        client: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
