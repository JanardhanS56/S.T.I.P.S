export function Chip({ active = false, onClick, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`chip ${active ? 'on' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Chip;
