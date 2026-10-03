import { Router, Response } from 'express';
import { AuthRequest, requireAuth } from '../middleware/authMiddleware';
import { AIAgentService } from '../services/ai/aiAgentService';
import { simulateRevenueScenario } from '../services/revenueIntelligence/scenarioSimulator';

const router = Router();

// Command Query
router.post('/query', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { prompt, conversationHistory } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const response = await AIAgentService.processCommand(prompt, merchantId, conversationHistory || []);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scenario Simulation
router.post('/simulate', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user!.merchantId;
    const { recoveryPercentage } = req.body;

    const sim = await simulateRevenueScenario(merchantId, recoveryPercentage || 30);
    res.json({ simulation: sim });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
