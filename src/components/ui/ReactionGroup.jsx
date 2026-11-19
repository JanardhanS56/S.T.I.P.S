import { ThumbsUp, Heart, Smile } from 'lucide-react';

const REACTION_CONFIG = [
  { kind: 'like', icon: ThumbsUp, label: 'Helpful' },
  { kind: 'thanks', icon: Heart, label: 'Appreciate' },
  { kind: 'laugh', icon: Smile, label: 'Amusing' }
];

export function ReactionGroup({
  reactions = { like: 0, thanks: 0, laugh: 0 },
  myReaction = null,
  onReact,
  disabled = false,
  className = ''
}) {
  return (
    <div role="group" aria-label="Post reactions" className={`reaction-group ${className}`.trim()}>
      {REACTION_CONFIG.map(({ kind, icon: Icon, label }) => {
        const count = reactions?.[kind] || 0;
        const active = myReaction === kind;
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={active}
            aria-label={`${label}, ${count} ${count === 1 ? 'reaction' : 'reactions'}`}
            className={`reaction-btn ${active ? 'active' : ''}`.trim()}
            onClick={() => onReact && onReact(kind)}
            disabled={disabled}
          >
            <Icon size={15} strokeWidth={active ? 2.5 : 1.75} className="reaction-icon" />
            <span className="reaction-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
