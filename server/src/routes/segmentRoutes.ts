import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { getSegmentAnalytics, SEGMENT_DEFINITIONS } from '../services/customerIntelligence/segmentationEngine';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const segmentAnalytics = await getSegmentAnalytics(merchantId);
    res.json({
      definitions: SEGMENT_DEFINITIONS,
      segments: segmentAnalytics,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
