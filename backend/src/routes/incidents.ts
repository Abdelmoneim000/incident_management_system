import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { incidents, activityLogs, comments } from '../db/schema';
import { authenticateToken, AuthenticatedRequest, requireOperatorOrClient } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const createIncidentSchema = z.object({
  clientId: z.string().uuid(),
  incidentTypeId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().min(1).max(5).default(1),
  data: z.record(z.any()).default({}),
});

const updateIncidentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'escalated']).optional(),
  priority: z.number().min(1).max(5).optional(),
  assignedTo: z.string().uuid().optional(),
  data: z.record(z.any()).optional(),
});

// Get all incidents
router.get('/', requireOperatorOrClient, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, clientId } = req.query;
    
    let whereConditions = [];
    
    // If user is a client, only show their incidents
    if (req.user?.role === 'client' && req.user.clientId) {
      whereConditions.push(eq(incidents.clientId, req.user.clientId));
    } else if (clientId && typeof clientId === 'string') {
      whereConditions.push(eq(incidents.clientId, clientId));
    }
    
    if (status && typeof status === 'string') {
      whereConditions.push(eq(incidents.status, status));
    }

    const incidentsList = await db.query.incidents.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        client: true,
        incidentType: true,
        assignedTo: {
          columns: { id: true, name: true, email: true },
        },
        reportedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [desc(incidents.createdAt)],
    });

    res.json(incidentsList);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Get single incident
router.get('/:id', requireOperatorOrClient, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, id),
      with: {
        client: true,
        incidentType: true,
        assignedTo: {
          columns: { id: true, name: true, email: true },
        },
        reportedBy: {
          columns: { id: true, name: true, email: true },
        },
        activityLogs: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
          orderBy: [desc(activityLogs.createdAt)],
        },
        comments: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
          orderBy: [desc(comments.createdAt)],
        },
      },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check access permissions
    if (req.user?.role === 'client' && incident.clientId !== req.user.clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter internal comments for client users
    if (req.user?.role === 'client') {
      incident.comments = incident.comments.filter(comment => !comment.isInternal);
    }

    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// Create incident
router.post('/', requireOperatorOrClient, async (req: AuthenticatedRequest, res) => {
  try {
    const data = createIncidentSchema.parse(req.body);
    
    // Check permissions for client users
    if (req.user?.role === 'client' && data.clientId !== req.user.clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [newIncident] = await db.insert(incidents).values({
      ...data,
      reportedBy: req.user!.id,
    }).returning();

    // Create activity log
    await db.insert(activityLogs).values({
      incidentId: newIncident.id,
      userId: req.user!.id,
      action: 'created',
      description: `Incident created: ${newIncident.title}`,
    });

    // Fetch the complete incident data
    const completeIncident = await db.query.incidents.findFirst({
      where: eq(incidents.id, newIncident.id),
      with: {
        client: true,
        incidentType: true,
        assignedTo: {
          columns: { id: true, name: true, email: true },
        },
        reportedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(completeIncident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Update incident
router.put('/:id', requireOperatorOrClient, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const data = updateIncidentSchema.parse(req.body);

    // Check if incident exists and get current data
    const currentIncident = await db.query.incidents.findFirst({
      where: eq(incidents.id, id),
    });

    if (!currentIncident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check permissions
    if (req.user?.role === 'client' && currentIncident.clientId !== req.user.clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update incident
    const [updatedIncident] = await db.update(incidents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();

    // Create activity logs for changes
    const changes = [];
    if (data.status && data.status !== currentIncident.status) {
      changes.push(`Status changed from ${currentIncident.status} to ${data.status}`);
    }
    if (data.assignedTo && data.assignedTo !== currentIncident.assignedTo) {
      changes.push(`Incident assigned`);
    }
    if (data.priority && data.priority !== currentIncident.priority) {
      changes.push(`Priority changed from ${currentIncident.priority} to ${data.priority}`);
    }

    for (const change of changes) {
      await db.insert(activityLogs).values({
        incidentId: id,
        userId: req.user!.id,
        action: 'updated',
        description: change,
      });
    }

    // Fetch the complete updated incident
    const completeIncident = await db.query.incidents.findFirst({
      where: eq(incidents.id, id),
      with: {
        client: true,
        incidentType: true,
        assignedTo: {
          columns: { id: true, name: true, email: true },
        },
        reportedBy: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    res.json(completeIncident);
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

export default router;
