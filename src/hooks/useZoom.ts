/// Ctrl+滚轮缩放字体大小（仅在 Ctrl 按下时拦截事件）
import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;
const STEP = 1;

export function useZoom() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const changeFontSize = useCallback(
    (delta: number) => {
      const current = settings.reading.font.fontSize;
      const next = Math.round(Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, current + delta)));
      if (next !== current) {
        updateSettings({
          reading: {
            ...settings.reading,
            font: { ...settings.reading.font, fontSize: next },
          },
        });
      }
    },
    [settings, updateSettings]
  );

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        changeFontSize(e.deltaY < 0 ? STEP : -STEP);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [changeFontSize]);

  return { changeFontSize };
}