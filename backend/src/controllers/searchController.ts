import { Request, Response } from 'express';
import { fullTextSearch, getSearchSuggestions, findSimilarTitles } from '../services/searchService';

export async function search(req: Request, res: Response) {
  try {
    const { q, type = 'all', page = 1, limit = 20, fuzzy = 'true' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const useFuzzy = fuzzy === 'true';

    const results = await fullTextSearch({
      query: q,
      limit: limitNum,
      offset,
      type: type as any,
      fuzzy: useFuzzy,
    });

    res.json({
      query: q,
      page: pageNum,
      limit: limitNum,
      total: results.total,
      results: {
        movies: results.movies,
        people: results.people,
        physicalCopies: results.physicalCopies,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}

export async function suggestions(req: Request, res: Response) {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ suggestions: [] });
    }

    const limitNum = parseInt(limit as string, 10) || 5;
    const results = await getSearchSuggestions(q, limitNum);

    res.json({ suggestions: results });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}

export async function similar(req: Request, res: Response) {
  try {
    const { title, year, limit = 10 } = req.query;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title parameter is required' });
    }

    const yearNum = year ? parseInt(year as string, 10) : undefined;
    const limitNum = parseInt(limit as string, 10) || 10;

    const results = await findSimilarTitles(title, yearNum, limitNum);

    res.json({ similar: results });
  } catch (error) {
    console.error('Similar titles error:', error);
    res.status(500).json({ error: 'Failed to find similar titles' });
  }
}
