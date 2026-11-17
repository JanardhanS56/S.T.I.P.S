const REACTION_CONFIG = [
  { kind: 'like', emoji: '👍', label: 'Like' },
  { kind: 'thanks', emoji: '🙏', label: 'Thanks' },
  { kind: 'laugh', emoji: '😄', label: 'Laugh' }
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
      {REACTION_CONFIG.map(({ kind, emoji, label }) => {
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
            <span aria-hidden="true">{emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
