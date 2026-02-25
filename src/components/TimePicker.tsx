import { useRef, useEffect, useState } from 'react';

interface TimePickerProps {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
  onClose: () => void;
}

function ScrollColumn({
  items,
  selected,
  onSelect,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const el = itemRefs.current.get(selected);
    if (el && listRef.current) {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [selected]);

  return (
    <div className="tp-column" ref={listRef}>
      {items.map((v) => (
        <button
          key={v}
          ref={(node) => {
            if (node) itemRefs.current.set(v, node);
          }}
          className={`tp-item${v === selected ? ' tp-item--active' : ''}`}
          onClick={() => onSelect(v)}
        >
          {v.toString().padStart(2, '0')}
        </button>
      ))}
    </div>
  );
}

function ManualInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(value.toString().padStart(2, '0'));

  useEffect(() => {
    setText(value.toString().padStart(2, '0'));
  }, [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (!isNaN(n)) {
      onChange(Math.max(min, Math.min(max, n)));
    }
    setText(Math.max(min, Math.min(max, isNaN(parseInt(text, 10)) ? value : parseInt(text, 10))).toString().padStart(2, '0'));
  };

  return (
    <div className="tp-manual-field">
      <label className="tp-manual-label">{label}</label>
      <input
        className="tp-manual-input"
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
          setText(raw);
        }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
      />
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker({ hour, minute, onHourChange, onMinuteChange, onClose }: TimePickerProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="tp-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="tp-picker">
        <div className="tp-header">
          <span className="tp-preview">
            {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
          </span>
          <button className="tp-done" onClick={onClose}>✓ DONE</button>
        </div>
        <div className="tp-manual-row">
          <ManualInput label="HR" value={hour} min={0} max={23} onChange={onHourChange} />
          <span className="tp-manual-sep">:</span>
          <ManualInput label="MIN" value={minute} min={0} max={59} onChange={onMinuteChange} />
        </div>
        <div className="tp-columns tp-columns--scroll">
          <ScrollColumn items={HOURS} selected={hour} onSelect={onHourChange} />
          <ScrollColumn items={MINUTES} selected={minute} onSelect={onMinuteChange} />
        </div>
      </div>
    </div>
  );
}
