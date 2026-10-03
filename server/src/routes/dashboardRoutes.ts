import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { calculateMerchantRevenue } from '../services/revenueIntelligence/revenueCalculator';
import { generateExecutiveInsights } from '../services/revenueIntelligence/executiveInsightsGenerator';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const metrics = await calculateMerchantRevenue(merchantId);
    const insights = await generateExecutiveInsights(merchantId);

    res.json({
      metrics,
      insights,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/insights', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const insights = await generateExecutiveInsights(merchantId);
    res.json({ insights });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
