import type { NewsItem } from '../assets/data';

interface Props {
  items: NewsItem[];
}

export function BreakingNewsTicker({ items }: Props) {
  if (items.length === 0) return null;

  // Duplicate the sequence so the marquee loops seamlessly
  const loop = [...items, ...items];

  return (
    <div className="breaking-news" role="marquee" aria-label="Breaking news">
      <div className="breaking-news__label">
        <span className="breaking-news__pulse" />
        BREAKING
      </div>
      <div className="breaking-news__viewport">
        <div className="breaking-news__track">
          {loop.map((item, i) => (
            <span key={i} className="breaking-news__item" aria-hidden={i >= items.length}>
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
