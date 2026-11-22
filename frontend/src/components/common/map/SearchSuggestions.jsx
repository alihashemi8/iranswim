import React from 'react';
import SearchSuggestionItem from './SearchSuggestionItem';
import RecentSearches from './RecentSearches';
import PopularSearches from './PopularSearches';
import SearchEmptyState from './SearchEmptyState';

const CATEGORY_TITLES = {
  places: 'اماکن شاخص و دیدنی قزوین',
  streets: 'خیابان‌ها و معابر اصلی',
  neighborhoods: 'محله‌های شهر قزوین',
  services: 'خدمات شهری، درمانی و ورزشی',
  addresses: 'کوچه‌ها و آدرس‌های دقیق',
  completions: 'تکمیل هوشمند عبارت',
};

export const SearchSuggestions = ({
  query,
  suggestions = [],
  categories = {},
  recentSearches = [],
  outsideScopeInfo = null,
  loading = false,
  activeIndex = -1,
  onSelect,
  onSelectTag,
  onClearRecent,
  onRemoveRecent,
  listRef,
}) => {
  const trimmed = (query || '').trim();
  const isEmpty = trimmed.length < 2;

  // Handle outside scope rejection
  if (outsideScopeInfo?.is_outside_scope) {
    return (
      <div className="p-2">
        <SearchEmptyState
          query={query}
          isOutsideScope={true}
          detectedLocation={outsideScopeInfo.detected_location}
          message={outsideScopeInfo.message}
        />
      </div>
    );
  }

  // Initial State: Recent searches & Popular searches in Qazvin
  if (isEmpty) {
    return (
      <div className="py-1">
        {recentSearches.length > 0 && (
          <RecentSearches
            items={recentSearches}
            onSelect={onSelect}
            onClearAll={onClearRecent}
            onRemoveItem={onRemoveRecent}
          />
        )}
        <PopularSearches onSelectTag={onSelectTag} />
      </div>
    );
  }

  // No Results State
  if (!loading && suggestions.length === 0) {
    return (
      <div className="p-2">
        <SearchEmptyState query={query} isOutsideScope={false} />
        <PopularSearches onSelectTag={onSelectTag} />
      </div>
    );
  }

  // Active Suggestions list
  let globalItemIndex = 0;

  // Check if we have rich categorized items
  const categoryKeys = Object.keys(categories || {}).filter(
    (k) => categories[k] && categories[k].length > 0
  );

  return (
    <ul
      ref={listRef}
      role="listbox"
      aria-label="پیشنهادات جستجوی قزوین"
      className="py-1 max-h-[380px] overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800"
    >
      {categoryKeys.length > 0 ? (
        categoryKeys.map((catKey) => {
          const items = categories[catKey];
          const header = CATEGORY_TITLES[catKey] || 'سایر اماکن قزوین';

          return (
            <li key={catKey} className="pt-1.5 first:pt-0">
              <div className="px-3.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {header}
              </div>
              <ul className="space-y-0.5 mt-0.5">
                {items.map((item) => {
                  const currentIndex = globalItemIndex++;
                  const isActive = activeIndex === currentIndex;
                  return (
                    <SearchSuggestionItem
                      key={item.id || `sugg-${currentIndex}`}
                      item={item}
                      index={currentIndex}
                      isActive={isActive}
                      onSelect={onSelect}
                    />
                  );
                })}
              </ul>
            </li>
          );
        })
      ) : (
        <li className="p-1 space-y-0.5">
          {suggestions.map((item, idx) => (
            <SearchSuggestionItem
              key={item.id || `sugg-${idx}`}
              item={item}
              index={idx}
              isActive={activeIndex === idx}
              onSelect={onSelect}
            />
          ))}
        </li>
      )}
    </ul>
  );
};

export default SearchSuggestions;
