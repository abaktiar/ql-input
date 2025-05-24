// Import styles
import './styles.css';

// Re-export parser functionality for convenience
export * from './lib/ql-types';
export { QLParser } from './lib/ql-parser';
export { QLExpressionParser } from './lib/ql-expression-parser';
export * from './lib/ql-query-builder';

// Main React component
export { QLInput } from './components/ui/ql-input';

// React hooks
export { useQLInput } from './hooks/use-ql-input';
export { useDebounce } from './hooks/use-debounce';

// Suggestion engine (React-specific functionality)
export { QLSuggestionEngine } from './lib/ql-suggestions';

// Icons (for advanced customization)
export { SearchIcon, XIcon, LoaderIcon, ChevronDownIcon, CheckIcon } from './components/ui/icons';

// Utility functions
export { classNames } from './lib/utils';
