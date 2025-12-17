import express from 'express';
import { cricketService } from '../services/cricketService';
import { asyncHandler } from '../middleware/rateLimiter';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 30 }); // 30 second cache for API responses

/**
 * @swagger
 * /api/fetch/live:
 *   post:
 *     summary: Fetch live matches from CricAPI and store in database
 *     tags: [Cricket Admin]
 *     responses:
 *       200:
 *         description: Live matches fetched and stored successfully
 */
router.post('/fetch/live', asyncHandler(async (req, res) => {
  try {
    const matches = await cricketService.fetchLiveMatches();
    await cricketService.saveMatchesToDatabase(matches, 'live');
    res.json({ 
      success: true, 
      message: `Fetched and stored ${matches.length} live matches`,
      count: matches.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/fetch/upcoming:
 *   post:
 *     summary: Fetch upcoming matches from CricAPI and store in database
 *     tags: [Cricket Admin]
 *     responses:
 *       200:
 *         description: Upcoming matches fetched and stored successfully
 */
router.post('/fetch/upcoming', asyncHandler(async (req, res) => {
  try {
    const matches = await cricketService.fetchUpcomingMatches();
    await cricketService.saveMatchesToDatabase(matches, 'upcoming');
    res.json({ 
      success: true, 
      message: `Fetched and stored ${matches.length} upcoming matches`,
      count: matches.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/fetch/player/{pid}:
 *   post:
 *     summary: Fetch player info from CricAPI and store in database
 *     tags: [Cricket Admin]
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player info fetched and stored successfully
 */
router.post('/fetch/player/:pid', asyncHandler(async (req, res) => {
  try {
    const { pid } = req.params;
    const player = await cricketService.fetchPlayerInfo(pid);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await cricketService.savePlayerToDatabase(player);
    res.json({ 
      success: true, 
      message: `Player ${player.name} fetched and stored successfully`,
      player
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/live:
 *   get:
 *     summary: Get live matches from database
 *     tags: [Cricket Public]
 *     responses:
 *       200:
 *         description: Live matches retrieved successfully
 */
router.get('/live', asyncHandler(async (req, res) => {
  const cacheKey = 'db-live-matches';
  let matches = cache.get(cacheKey);

  if (!matches) {
    matches = await cricketService.getMatchesFromDatabase('live');
    cache.set(cacheKey, matches);
  }

  res.json({
    success: true,
    matches,
    count: (matches as any[]).length,
    cached: true
  });
}));

/**
 * @swagger
 * /api/upcoming:
 *   get:
 *     summary: Get upcoming matches from database
 *     tags: [Cricket Public]
 *     responses:
 *       200:
 *         description: Upcoming matches retrieved successfully
 */
router.get('/upcoming', asyncHandler(async (req, res) => {
  const cacheKey = 'db-upcoming-matches';
  let matches = cache.get(cacheKey);

  if (!matches) {
    matches = await cricketService.getMatchesFromDatabase('upcoming');
    cache.set(cacheKey, matches);
  }

  res.json({
    success: true,
    matches,
    count: (matches as any[]).length,
    cached: true
  });
}));

/**
 * @swagger
 * /api/completed:
 *   get:
 *     summary: Get completed matches from database
 *     tags: [Cricket Public]
 *     responses:
 *       200:
 *         description: Completed matches retrieved successfully
 */
router.get('/completed', asyncHandler(async (req, res) => {
  const cacheKey = 'db-completed-matches';
  let matches = cache.get(cacheKey);

  if (!matches) {
    matches = await cricketService.getMatchesFromDatabase('completed');
    cache.set(cacheKey, matches);
  }

  res.json({
    success: true,
    matches,
    count: (matches as any[]).length,
    cached: true
  });
}));

/**
 * @swagger
 * /api/score/{id}:
 *   get:
 *     summary: Get match score from database
 *     tags: [Cricket Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match score retrieved successfully
 */
router.get('/score/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const matches = await cricketService.getMatchesFromDatabase();
    const match = matches.find(m => m.unique_id === id || m.id === id);

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json({
      success: true,
      match,
      scores: match.scores?.[0] || null
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/player/{pid}:
 *   get:
 *     summary: Get player info from database
 *     tags: [Cricket Public]
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player info retrieved successfully
 */
router.get('/player/:pid', asyncHandler(async (req, res) => {
  try {
    const { pid } = req.params;
    const player = await cricketService.getPlayerFromDatabase(pid);

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      success: true,
      player
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/combined:
 *   get:
 *     summary: Get both live and upcoming matches in a single response
 *     tags: [Cricket Public]
 *     responses:
 *       200:
 *         description: Combined matches retrieved successfully
 */
router.get('/combined', asyncHandler(async (req, res) => {
  try {
    const cacheKey = 'db-combined-matches';
    let result = cache.get(cacheKey);

    if (!result) {
      const [liveMatches, upcomingMatches] = await Promise.all([
        cricketService.getMatchesFromDatabase('live'),
        cricketService.getMatchesFromDatabase('upcoming')
      ]);

      result = {
        live: liveMatches,
        upcoming: upcomingMatches,
        totalLive: liveMatches.length,
        totalUpcoming: upcomingMatches.length
      };

      cache.set(cacheKey, result);
    }

    res.json({
      success: true,
      ...result,
      cached: true
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/refresh:
 *   post:
 *     summary: Manually refresh all cricket data
 *     tags: [Cricket Admin]
 *     responses:
 *       200:
 *         description: Data refresh initiated successfully
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  try {
    // Clear cache
    cache.flushAll();
    
    // Refresh data in background
    cricketService.refreshAllData().catch(console.error);
    
    res.json({
      success: true,
      message: 'Data refresh initiated'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get cricket data statistics
 *     tags: [Cricket Public]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const [allMatches, allPlayers] = await Promise.all([
      cricketService.getMatchesFromDatabase(),
      cricketService.getPlayerFromDatabase('') // This will get all players
    ]);

    const liveMatches = allMatches.filter(m => ['Live', 'In Progress', 'Started'].includes(m.status));
    const upcomingMatches = allMatches.filter(m => ['Scheduled', 'Not Started', 'Upcoming'].includes(m.status));
    const completedMatches = allMatches.filter(m => ['Match Finished', 'Completed', 'Result'].includes(m.status));

    res.json({
      success: true,
      stats: {
        totalMatches: allMatches.length,
        liveMatches: liveMatches.length,
        upcomingMatches: upcomingMatches.length,
        completedMatches: completedMatches.length,
        totalPlayers: Array.isArray(allPlayers) ? allPlayers.length : 0,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;