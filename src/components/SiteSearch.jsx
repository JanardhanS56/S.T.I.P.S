import { Search, X } from 'lucide-react';

/**
 * Site Search Bar Component
 * Instant search bar with clear button and accessible search role.
 */
export default function SiteSearch({
  query,
  onQueryChange,
  placeholder = 'Search notices, posts, or keywords...',
  className = ''
}) {
  return (
    <div className={`site-search-wrap ${className}`} role="search">
      <span
        className="site-search-icon"
        aria-hidden="true"
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <Search size={16} strokeWidth={2} />
      </span>
      <input
        type="search"
        className="site-search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Search content"
      />
      {query && (
        <button
          type="button"
          className="site-search-clear"
          onClick={() => onQueryChange('')}
          aria-label="Clear search"
          title="Clear search"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
