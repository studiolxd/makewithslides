import { useCallback, useEffect, useRef, useState } from 'react';
import { useScorm, useScormAutoTerminate } from '@studiolxd/react-scorm';
import type { ScormProgress } from '../types';

const DEFAULT_PROGRESS: ScormProgress = {
  currentSlide: 0,
  visitedSlides: [0],
  completedInteractions: {},
  sidebarCollapsed: true,
};

function updateSlideInUrl(slideId: number) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('slide', String(slideId));
    window.history.replaceState(null, '', url.toString());
  } catch { /* SCORM iframes may block history manipulation */ }
}

export function useScormProgress(totalSlides: number, initialSlide?: number) {
  const { api, status } = useScorm();
  const [progress, setProgress] = useState<ScormProgress>(DEFAULT_PROGRESS);
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  // Global SCORM interaction index (cmi.interactions.N) — must be sequential and never reset
  const interactionIndexRef = useRef(0);

  useScormAutoTerminate({
    trackSessionTime: true,
    handleUnload: true,
    handleFreeze: true,
  });

  // Initialize SCORM and restore progress
  useEffect(() => {
    if (!api || initialized.current) return;
    initialized.current = true;

    const initResult = api.initialize();
    if (!initResult.ok) {
      console.warn('SCORM initialize failed:', initResult.error);
      if (initialSlide !== undefined) {
        setProgress({ ...DEFAULT_PROGRESS, currentSlide: initialSlide, visitedSlides: [0, initialSlide] });
        updateSlideInUrl(initialSlide);
      } else {
        updateSlideInUrl(DEFAULT_PROGRESS.currentSlide);
      }
      setReady(true);
      return;
    }

    // Check entry mode: ab-initio = fresh start, resume = restore saved state
    const entryResult = api.getEntry();
    const isResume = entryResult.ok && entryResult.value === 'resume';

    // Restore location
    const locationResult = api.getLocation();
    let currentSlide = 0;
    if (isResume && locationResult.ok && locationResult.value) {
      currentSlide = parseInt(locationResult.value, 10) || 0;
    }

    // Restore suspend data only on resume
    let visitedSlides = [0];
    let completedInteractions: Record<number, string[]> = {};
    let sidebarCollapsed = true;
    if (isResume) {
      const suspendResult = api.getSuspendData();
      if (suspendResult.ok && suspendResult.value) {
        try {
          const parsed = JSON.parse(suspendResult.value) as Record<string, unknown>;
          if (Array.isArray(parsed.visitedSlides)) {
            visitedSlides = (parsed.visitedSlides as unknown[]).filter(
              (id): id is number => Number.isInteger(id) && (id as number) >= 0 && (id as number) < totalSlides
            );
            if (!visitedSlides.includes(0)) visitedSlides = [0, ...visitedSlides];
          }
          if (parsed.completedInteractions && typeof parsed.completedInteractions === 'object' && !Array.isArray(parsed.completedInteractions)) {
            const validated: Record<number, string[]> = {};
            for (const [key, value] of Object.entries(parsed.completedInteractions as Record<string, unknown>)) {
              const slideId = parseInt(key, 10);
              if (Number.isInteger(slideId) && slideId >= 0 && slideId < totalSlides && Array.isArray(value)) {
                validated[slideId] = (value as unknown[]).filter(
                  (v): v is string => typeof v === 'string' && v.length <= 256
                );
              }
            }
            completedInteractions = validated;
          }
          if (typeof parsed.sidebarCollapsed === 'boolean') {
            sidebarCollapsed = parsed.sidebarCollapsed;
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    // Seed the SCORM interaction index from restored state so new interactions
    // get sequential indices continuing after whatever was already recorded
    interactionIndexRef.current = Object.values(completedInteractions).reduce(
      (sum, ids) => sum + ids.length,
      0
    );

    // URL slide= param overrides SCORM-restored location
    if (initialSlide !== undefined) {
      currentSlide = initialSlide;
    }

    // Ensure current slide is in visited list
    if (!visitedSlides.includes(currentSlide)) {
      visitedSlides.push(currentSlide);
    }

    const newProgress = { currentSlide, visitedSlides, completedInteractions, sidebarCollapsed };
    setProgress(newProgress);
    updateSlideInUrl(currentSlide);

    // Persist the overridden location to SCORM
    if (initialSlide !== undefined) {
      api.setLocation(String(currentSlide));
      api.setSuspendData(JSON.stringify({ visitedSlides, completedInteractions, sidebarCollapsed }));
      api.commit();
    }

    setReady(true);
  }, [api]);

  // Save progress to SCORM
  const saveProgress = useCallback(
    (newProgress: ScormProgress, totalSlides: number) => {
      if (!api) return;

      api.setLocation(String(newProgress.currentSlide));
      api.setSuspendData(
        JSON.stringify({
          visitedSlides: newProgress.visitedSlides,
          completedInteractions: newProgress.completedInteractions,
          sidebarCollapsed: newProgress.sidebarCollapsed,
        })
      );

      const percent = Math.round((newProgress.visitedSlides.length / totalSlides) * 100);
      api.setScore({ raw: percent, min: 0, max: 100 });

      if (newProgress.visitedSlides.length >= totalSlides) {
        api.setComplete();
      }

      api.commit();
    },
    [api]
  );

  const goToSlide = useCallback(
    (slideId: number) => {
      setProgress((prev) => {
        const visitedSlides = prev.visitedSlides.includes(slideId)
          ? prev.visitedSlides
          : [...prev.visitedSlides, slideId];

        const newProgress = { ...prev, currentSlide: slideId, visitedSlides };
        saveProgress(newProgress, totalSlides);
        return newProgress;
      });
      updateSlideInUrl(slideId);
    },
    [saveProgress, totalSlides]
  );

  const markInteractionComplete = useCallback(
    (slideId: number, interactionId: string) => {
      // Track whether this is a new interaction (not a duplicate)
      let added = false;
      setProgress((prev) => {
        const existing = prev.completedInteractions[slideId] ?? [];
        if (existing.includes(interactionId)) return prev;
        added = true;
        const completedInteractions = {
          ...prev.completedInteractions,
          [slideId]: [...existing, interactionId],
        };
        const newProgress = { ...prev, completedInteractions };
        saveProgress(newProgress, totalSlides);
        return newProgress;
      });

      // Report to LMS via native cmi.interactions (only for new interactions)
      if (added && api) {
        const index = interactionIndexRef.current++;
        api.recordInteraction(index, {
          id: `slide-${slideId}-${interactionId}`,
          type: 'other',
          result: 'correct',
        });
      }
    },
    [api, saveProgress, totalSlides]
  );

  const toggleSidebar = useCallback(() => {
    setProgress((prev) => {
      const newProgress = { ...prev, sidebarCollapsed: !prev.sidebarCollapsed };
      saveProgress(newProgress, totalSlides);
      return newProgress;
    });
  }, [saveProgress, totalSlides]);

  return {
    progress,
    ready,
    goToSlide,
    markInteractionComplete,
    toggleSidebar,
    apiFound: status.apiFound,
  };
}
