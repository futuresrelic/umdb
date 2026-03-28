import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

interface DraftOptions<T> {
  key: string;
  initialData?: T;
  autosaveInterval?: number; // in milliseconds
}

export function useDraft<T extends Record<string, any>>({
  key,
  initialData,
  autosaveInterval = 30000, // 30 seconds default
}: DraftOptions<T>) {
  const [data, setData] = useState<T>(initialData || {} as T);
  const [isDraft, setIsDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const toast = useToast();

  // Load draft from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`draft_${key}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed.data);
        setLastSaved(new Date(parsed.savedAt));
        setIsDraft(true);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [key]);

  // Autosave draft
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    const timer = setInterval(() => {
      saveDraft();
    }, autosaveInterval);

    return () => clearInterval(timer);
  }, [data, autosaveInterval]);

  const saveDraft = useCallback(() => {
    try {
      const draft = {
        data,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`draft_${key}`, JSON.stringify(draft));
      setLastSaved(new Date());
      setIsDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    }
  }, [data, key, toast]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`draft_${key}`);
      setData({} as T);
      setIsDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  const restoreDraft = useCallback(() => {
    const stored = localStorage.getItem(`draft_${key}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed.data);
        setLastSaved(new Date(parsed.savedAt));
        setIsDraft(true);
        toast.success('Draft restored');
      } catch (error) {
        console.error('Failed to restore draft:', error);
        toast.error('Failed to restore draft');
      }
    }
  }, [key, toast]);

  return {
    data,
    updateData,
    setData,
    saveDraft,
    clearDraft,
    restoreDraft,
    isDraft,
    lastSaved,
  };
}
