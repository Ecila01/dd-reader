/// 设置面板：字号、最大宽度、页边距等 + 一键还原默认值
import { useCallback } from 'react';
import { useAppStore } from '../store';
import styles from './Settings.module.css';

// 默认值（与 store 初始值保持一致）
const DEFAULTS = {
  fontSize: 16,
  lineHeight: 1.8,
  maxWidth: 0,
  pageMargin: 48,
};

// 范围限制
const LIMITS = {
  fontSize:  { min: 8,  max: 72,  step: 1 },
  lineHeight:{ min: 0.8, max: 4.0, step: 0.1 },
  maxWidth:  { min: 0,  max: 4000, step: 10 },
  pageMargin:{ min: 0,  max: 400, step: 4 },
};

export function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const reading = settings.reading;

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const updateFontSize = useCallback(
    (value: number) => {
      updateSettings({
        reading: { ...reading, font: { ...reading.font, fontSize: clamp(value, LIMITS.fontSize.min, LIMITS.fontSize.max) } },
      });
    },
    [reading, updateSettings]
  );

  const updateMaxWidth = useCallback(
    (value: number) => {
      updateSettings({ reading: { ...reading, maxWidth: clamp(value, LIMITS.maxWidth.min, LIMITS.maxWidth.max) } });
    },
    [reading, updateSettings]
  );

  const updatePageMargin = useCallback(
    (value: number) => {
      updateSettings({ reading: { ...reading, pageMargin: clamp(value, LIMITS.pageMargin.min, LIMITS.pageMargin.max) } });
    },
    [reading, updateSettings]
  );

  const updateLineHeight = useCallback(
    (value: number) => {
      updateSettings({
        reading: { ...reading, font: { ...reading.font, lineHeight: clamp(value, LIMITS.lineHeight.min, LIMITS.lineHeight.max) } },
      });
    },
    [reading, updateSettings]
  );

  const resetToDefaults = useCallback(() => {
    updateSettings({
      reading: {
        ...reading,
        font: {
          ...reading.font,
          fontSize: DEFAULTS.fontSize,
          lineHeight: DEFAULTS.lineHeight,
        },
        maxWidth: DEFAULTS.maxWidth,
        pageMargin: DEFAULTS.pageMargin,
      },
    });
  }, [reading, updateSettings]);

  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>排版设置</h3>

      {/* 字号 */}
      <div className={styles.row}>
        <label className={styles.label}>字号 ({LIMITS.fontSize.min}–{LIMITS.fontSize.max})</label>
        <div className={styles.controls}>
          <input
            type="range"
            className={styles.slider}
            min={LIMITS.fontSize.min}
            max={LIMITS.fontSize.max}
            step={LIMITS.fontSize.step}
            value={reading.font.fontSize}
            onChange={(e) => updateFontSize(Number(e.target.value))}
          />
          <input
            type="number"
            className={styles.numberInput}
            min={LIMITS.fontSize.min}
            max={LIMITS.fontSize.max}
            value={reading.font.fontSize}
            onChange={(e) => updateFontSize(Number(e.target.value))}
          />
          <span className={styles.unit}>px</span>
        </div>
      </div>

      {/* 行高 */}
      <div className={styles.row}>
        <label className={styles.label}>行高 ({LIMITS.lineHeight.min}–{LIMITS.lineHeight.max})</label>
        <div className={styles.controls}>
          <input
            type="range"
            className={styles.slider}
            min={LIMITS.lineHeight.min}
            max={LIMITS.lineHeight.max}
            step={LIMITS.lineHeight.step}
            value={reading.font.lineHeight}
            onChange={(e) => updateLineHeight(Number(e.target.value))}
          />
          <input
            type="number"
            className={styles.numberInput}
            min={LIMITS.lineHeight.min}
            max={LIMITS.lineHeight.max}
            step={LIMITS.lineHeight.step}
            value={reading.font.lineHeight}
            onChange={(e) => updateLineHeight(Number(e.target.value))}
          />
        </div>
      </div>

      {/* 最大宽度 */}
      <div className={styles.row}>
        <label className={styles.label}>最大宽度 (0 = 不限制, {LIMITS.maxWidth.max} max)</label>
        <div className={styles.controls}>
          <input
            type="range"
            className={styles.slider}
            min={LIMITS.maxWidth.min}
            max={LIMITS.maxWidth.max}
            step={LIMITS.maxWidth.step}
            value={reading.maxWidth}
            onChange={(e) => updateMaxWidth(Number(e.target.value))}
          />
          <input
            type="number"
            className={styles.numberInput}
            min={LIMITS.maxWidth.min}
            max={LIMITS.maxWidth.max}
            step={LIMITS.maxWidth.step}
            value={reading.maxWidth}
            onChange={(e) => updateMaxWidth(Number(e.target.value))}
          />
          <span className={styles.unit}>px</span>
        </div>
      </div>

      {/* 页边距 */}
      <div className={styles.row}>
        <label className={styles.label}>页边距 ({LIMITS.pageMargin.min}–{LIMITS.pageMargin.max})</label>
        <div className={styles.controls}>
          <input
            type="range"
            className={styles.slider}
            min={LIMITS.pageMargin.min}
            max={LIMITS.pageMargin.max}
            step={LIMITS.pageMargin.step}
            value={reading.pageMargin}
            onChange={(e) => updatePageMargin(Number(e.target.value))}
          />
          <input
            type="number"
            className={styles.numberInput}
            min={LIMITS.pageMargin.min}
            max={LIMITS.pageMargin.max}
            step={LIMITS.pageMargin.step}
            value={reading.pageMargin}
            onChange={(e) => updatePageMargin(Number(e.target.value))}
          />
          <span className={styles.unit}>px</span>
        </div>
      </div>

      {/* 一键还原 */}
      <button className={styles.resetBtn} onClick={resetToDefaults}>
        ↺ 还原默认值
      </button>

      <div className={styles.hint}>
        <kbd>Ctrl</kbd> + 滚轮 可快速调整字号
      </div>
    </div>
  );
}