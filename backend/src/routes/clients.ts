import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { clients, incidentTypes } from '../db/schema';
import { authenticateToken, AuthenticatedRequest, requireOperator } from '../middleware/auth';
import { eq } from 'drizzle-orm';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const createClientSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  config: z.record(z.any()).default({}),
});

// Get all clients (operators only)
router.get('/', requireOperator, async (req: AuthenticatedRequest, res) => {
  try {
    const clientsList = await db.query.clients.findMany({
      with: {
        incidentTypes: {
          where: eq(incidentTypes.isActive, true),
        },
      },
      orderBy: (clients, { asc }) => [asc(clients.name)],
    });

    res.json(clientsList);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client
router.get('/:id', requireOperator, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        incidentTypes: {
          where: eq(incidentTypes.isActive, true),
        },
        users: {
          columns: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client (operators only)
router.post('/', requireOperator, async (req: AuthenticatedRequest, res) => {
  try {
    const data = createClientSchema.parse(req.body);

    // Check if slug already exists
    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.slug, data.slug),
    });

    if (existingClient) {
      return res.status(400).json({ error: 'Client slug already exists' });
    }

    const [newClient] = await db.insert(clients).values(data).returning();

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Update client
router.put('/:id', requireOperator, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const data = createClientSchema.partial().parse(req.body);

    const existingClient = await db.query.clients.findFirst({
      where: eq(clients.id, id),
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if slug already exists (if being updated)
    if (data.slug && data.slug !== existingClient.slug) {
      const slugExists = await db.query.clients.findFirst({
        where: eq(clients.slug, data.slug),
      });

      if (slugExists) {
        return res.status(400).json({ error: 'Client slug already exists' });
      }
    }

    const [updatedClient] = await db.update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();

    res.json(updatedClient);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

export default router;
