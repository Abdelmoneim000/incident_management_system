import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { comments, activityLogs, incidents } from '../db/schema';
import { authenticateToken, AuthenticatedRequest, requireOperatorOrClient } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

const createCommentSchema = z.object({
  incidentId: z.string().uuid(),
  content: z.string().min(1),
  isInternal: z.boolean().default(false),
});

// Create comment
router.post('/', requireOperatorOrClient, async (req: AuthenticatedRequest, res) => {
  try {
    const data = createCommentSchema.parse(req.body);
    
    // Check if incident exists and user has access
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, data.incidentId),
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check permissions
    if (req.user?.role === 'client' && incident.clientId !== req.user.clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Clients cannot create internal comments
    if (req.user?.role === 'client' && data.isInternal) {
      data.isInternal = false;
    }

    const [newComment] = await db.insert(comments).values({
      ...data,
      userId: req.user!.id,
    }).returning();

    // Create activity log
    await db.insert(activityLogs).values({
      incidentId: data.incidentId,
      userId: req.user!.id,
      action: 'commented',
      description: `Added a ${data.isInternal ? 'internal ' : ''}comment`,
    });

    // Fetch the complete comment data
    const completeComment = await db.query.comments.findFirst({
      where: eq(comments.id, newComment.id),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(completeComment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Get comments for an incident
router.get('/incident/:incidentId', requireOperatorOrClient, async (req: AuthenticatedRequest, res) => {
  try {
    const { incidentId } = req.params;
    
    // Check if incident exists and user has access
    const incident = await db.query.incidents.findFirst({
      where: eq(incidents.id, incidentId),
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check permissions
    if (req.user?.role === 'client' && incident.clientId !== req.user.clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let whereConditions = [eq(comments.incidentId, incidentId)];
    
    // Filter internal comments for client users
    if (req.user?.role === 'client') {
      whereConditions.push(eq(comments.isInternal, false));
    }

    const incidentComments = await db.query.comments.findMany({
      where: and(...whereConditions),
      with: {
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
      orderBy: [desc(comments.createdAt)],
    });

    res.json(incidentComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export default router;
