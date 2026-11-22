import React, { useState } from 'react';
import SearchResultItem from './SearchResultItem';
import SearchEmptyState from './SearchEmptyState';
import { Layers } from 'lucide-react';

export const SearchResults = ({
  results = [],
  categories = [],
  outsideScopeInfo = null,
  query = '',
  totalCount = 0,
  onSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (outsideScopeInfo?.is_outside_scope) {
    return (
      <SearchEmptyState
        query={query}
        isOutsideScope={true}
        detectedLocation={outsideScopeInfo.detected_location}
        message={outsideScopeInfo.message}
      />
    );
  }

  if (results.length === 0) {
    return <SearchEmptyState query={query} isOutsideScope={false} />;
  }

  const filteredResults =
    selectedCategory === 'ALL'
      ? results
      : results.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-3">
      {/* Category Filter Pills (if categories available) */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`
              px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-colors cursor-pointer
              ${
                selectedCategory === 'ALL'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }
            `}
          >
            همه موارد ({totalCount})
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => setSelectedCategory(c.category)}
              className={`
                px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-colors cursor-pointer
                ${
                  selectedCategory === c.category
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }
              `}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
      )}

      {/* Results Cards List */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
        {filteredResults.map((item, idx) => (
          <SearchResultItem
            key={item.id || `res-${idx}`}
            item={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
