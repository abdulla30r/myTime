import type { NewsItem } from '../assets/data';

interface Props {
  items: NewsItem[];
}

export function BreakingNewsTicker({ items }: Props) {
  if (items.length === 0) return null;

  // Triple the sequence for seamless infinite scroll — when animation loops,
  // the jump from -66% back to 0% is imperceptible because we restart at identical content
  const loop = [...items, ...items, ...items];

  return (
    <div className="breaking-news" role="marquee" aria-label="Breaking news">
      <div className="breaking-news__label">
        <span className="breaking-news__pulse" />
        BREAKING
      </div>
      <div className="breaking-news__viewport">
        <div className="breaking-news__track">
          {loop.map((item, i) => (
            <span key={i} className="breaking-news__item" aria-hidden={i >= items.length * 2}>
              {item.icon && <span className="breaking-news__icon">{item.icon}</span>}
              <span className="breaking-news__text">{item.text}</span>
              <span className="breaking-news__sep">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

