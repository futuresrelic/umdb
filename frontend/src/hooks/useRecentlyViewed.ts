import { useState, useEffect } from 'react';

interface RecentItem {
  id: string;
  title: string;
  year?: number;
  posterUrl?: string;
  type: 'movie' | 'person' | 'boxset';
  viewedAt: number;
}

const MAX_RECENT_ITEMS = 20;
const STORAGE_KEY = 'umdb_recently_viewed';

export function useRecentlyViewed() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse recently viewed:', error);
      }
    }
  }, []);

  const addRecentItem = (item: Omit<RecentItem, 'viewedAt'>) => {
    const newItem: RecentItem = {
      ...item,
      viewedAt: Date.now(),
    };

    setRecentItems(prev => {
      // Remove existing item with same id if present
      const filtered = prev.filter(i => i.id !== item.id);
      // Add new item to the beginning
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentItems = () => {
    setRecentItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentItems,
    addRecentItem,
    clearRecentItems,
  };
}
