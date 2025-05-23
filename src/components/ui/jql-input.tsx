import * as React from "react";
import { cn } from "@/lib/utils";
import type { JQLInputProps, JQLSuggestion } from "@/lib/jql-types";
import { useJQLInput } from "@/hooks/use-jql-input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Command, CommandEmpty, CommandItem, CommandList } from './command';
import { Loader2, Search, X } from 'lucide-react';

const JQLInput = React.forwardRef<HTMLInputElement, JQLInputProps>(
  (
    {
      value,
      onChange,
      onExecute,
      config,
      placeholder = 'Enter JQL query...',
      disabled = false,
      className,
      getAsyncValueSuggestions,
      getPredefinedValueSuggestions,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const { state, handleInputChange, handleKeyDown, selectSuggestion } = useJQLInput({
      config,
      initialValue: value || '',
      onChange,
      onExecute,
      getAsyncValueSuggestions,
      getPredefinedValueSuggestions,
    });

    // Sync external value changes
    React.useEffect(() => {
      if (value !== undefined && value !== state.value) {
        handleInputChange(value, inputRef.current?.selectionStart || 0);
      }
    }, [value, state.value, handleInputChange]);

    // Handle input events
    const handleInput = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        const cursorPosition = event.target.selectionStart || 0;
        handleInputChange(newValue, cursorPosition);
      },
      [handleInputChange]
    );

    // Handle cursor position changes
    const handleSelectionChange = React.useCallback(() => {
      if (inputRef.current) {
        const cursorPosition = inputRef.current.selectionStart || 0;
        handleInputChange(state.value, cursorPosition);
      }
    }, [handleInputChange, state.value]);

    // Handle suggestion selection
    const handleSuggestionSelect = React.useCallback(
      (suggestion: JQLSuggestion) => {
        selectSuggestion(suggestion);
        setIsOpen(false);
        inputRef.current?.focus();
      },
      [selectSuggestion]
    );

    // Handle clear button
    const handleClear = React.useCallback(() => {
      handleInputChange('', 0);
      inputRef.current?.focus();
    }, [handleInputChange]);

    // Update popover state based on suggestions
    React.useEffect(() => {
      setIsOpen(state.showSuggestions && state.suggestions.length > 0);
    }, [state.showSuggestions, state.suggestions.length]);

    // Removed groupedSuggestions since we're now showing suggestions in a flat list

    // Syntax highlighting disabled to avoid text overlap issues
    // Can be implemented later with a different approach (e.g., contentEditable div)

    return (
      <div className='relative'>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className='relative'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <input
                  ref={React.useMemo(() => {
                    return (node: HTMLInputElement | null) => {
                      if (typeof ref === 'function') {
                        ref(node);
                      } else if (ref) {
                        ref.current = node;
                      }
                      inputRef.current = node;
                    };
                  }, [ref])}
                  type='text'
                  value={state.value}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  onSelect={handleSelectionChange}
                  onFocus={() => setIsOpen(state.suggestions.length > 0)}
                  onBlur={() => {
                    // Delay hiding to allow suggestion clicks
                    setTimeout(() => setIsOpen(false), 150);
                  }}
                  placeholder={placeholder}
                  disabled={disabled}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    state.showSuggestions && 'ring-2 ring-blue-500/20 border-blue-500/50',
                    !state.query.valid && state.value && 'ring-2 ring-red-500/20 border-red-500/50',
                    className
                  )}
                  {...props}
                />
                {state.value && (
                  <button
                    type='button'
                    onClick={handleClear}
                    className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
                    <X className='h-4 w-4' />
                  </button>
                )}
                {state.isLoading && (
                  <Loader2 className='absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground' />
                )}
              </div>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className='w-[--radix-popover-trigger-width] p-0'
            align='start'
            onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command shouldFilter={false}>
              <CommandList>
                {state.suggestions.length === 0 ? (
                  <CommandEmpty>No suggestions found.</CommandEmpty>
                ) : (
                  state.suggestions.map((suggestion, index) => {
                    const isSelected = index === state.selectedSuggestionIndex;
                    return (
                      <CommandItem
                        key={`${suggestion.category}-${index}`}
                        value={suggestion.value}
                        onSelect={() => handleSuggestionSelect(suggestion)}
                        className={cn(
                          'flex flex-col items-start gap-1 cursor-pointer',
                          isSelected && 'bg-accent text-accent-foreground'
                        )}>
                        <div className='flex items-center gap-2'>
                          <span
                            className={cn(
                              'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium',
                              suggestion.type === 'field' &&
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                              suggestion.type === 'operator' &&
                                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                              suggestion.type === 'value' &&
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                              suggestion.type === 'logical' &&
                                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                              suggestion.type === 'keyword' &&
                                'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
                              suggestion.type === 'function' &&
                                'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
                              suggestion.type === 'parenthesis' &&
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                              suggestion.type === 'comma' &&
                                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            )}>
                            {suggestion.type}
                          </span>
                          <span className='font-medium'>{suggestion.displayValue || suggestion.value}</span>
                        </div>
                        {suggestion.description && (
                          <span className='text-xs text-muted-foreground'>{suggestion.description}</span>
                        )}
                      </CommandItem>
                    );
                  })
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Validation errors */}
        {state.validationErrors.length > 0 && (
          <div className='mt-1 text-xs text-red-600 dark:text-red-400'>{state.validationErrors[0].message}</div>
        )}
      </div>
    );
  }
);

JQLInput.displayName = "JQLInput";

export { JQLInput };
