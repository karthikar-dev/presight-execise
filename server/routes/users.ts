import express, { Request, Response } from 'express';
import { USERS_DATASET } from '../data/generator.js';

const router = express.Router();

// GET /api/users?page=1&limit=20&search=john&nationality=USA&hobbies=Reading
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string)?.toLowerCase() || '';
  const nationality = (req.query.nationality as string) || '';
  const hobbies = req.query.hobbies ? (req.query.hobbies as string).split(',') : [];

  // Filter users
  let filtered = USERS_DATASET.filter(user => {
    // Search filter
    const matchesSearch = !search || 
      user.first_name.toLowerCase().includes(search) ||
      user.last_name.toLowerCase().includes(search);

    // Nationality filter
    const matchesNationality = !nationality || user.nationality === nationality;

    // Hobbies filter (user must have at least one of the selected hobbies)
    const matchesHobbies = hobbies.length === 0 || 
      hobbies.filter(h => h.trim()).some(hobby => user.hobbies.includes(hobby.trim()));

    return matchesSearch && matchesNationality && matchesHobbies;
  });

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filtered.slice(startIndex, endIndex);

  res.json({
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filtered.length,
      hasMore: endIndex < filtered.length
    }
  });
});

// GET /api/users/stats - Get top hobbies and nationalities
router.get('/stats', (_req: Request, res: Response) => {
  // Count hobbies
  const hobbyCounts: Record<string, number> = {};
  const nationalityCounts: Record<string, number> = {};

  USERS_DATASET.forEach(user => {
    user.hobbies.forEach(hobby => {
      hobbyCounts[hobby] = (hobbyCounts[hobby] || 0) + 1;
    });
    nationalityCounts[user.nationality] = (nationalityCounts[user.nationality] || 0) + 1;
  });

  // Get top 20 hobbies
  const topHobbies = Object.entries(hobbyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  // Get top 20 nationalities
  const topNationalities = Object.entries(nationalityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  res.json({
    hobbies: topHobbies,
    nationalities: topNationalities
  });
});

export default router;
