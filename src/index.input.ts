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

// UI components (for advanced customization)
export { Button } from './components/ui/button';
export { Command, CommandEmpty, CommandItem, CommandList } from './components/ui/command';
export { Input } from './components/ui/input';
export { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';

// Utility functions
export { cn } from './lib/utils';
