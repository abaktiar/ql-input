import * as React from "react";
import { classNames } from '@/lib/utils';
import type { QLInputProps, QLSuggestion } from '@/lib/ql-types';
import { useQLInput } from '@/hooks/use-ql-input';
import { SearchIcon, XIcon, LoaderIcon } from './icons';

const QLInput = React.forwardRef<HTMLInputElement, QLInputProps>(
  (
    {
      value,
      onChange,
      onExecute,
      config,
      placeholder = 'Enter QL query...',
      disabled = false,
      className,
      showSearchIcon = true,
      showClearIcon = true,
      getAsyncValueSuggestions,
      getPredefinedValueSuggestions,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const suggestionsRef = React.useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const { state, handleInputChange, handleKeyDown, selectSuggestion } = useQLInput({
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
      (suggestion: QLSuggestion) => {
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

    // Determine input state classes
    const getInputStateClass = () => {
      if (state.showSuggestions) return 'ql-input--suggestions';
      if (!state.query.valid && state.value) return 'ql-input--invalid';
      if (state.query.valid && state.value) return 'ql-input--valid';
      return '';
    };

    const showClearButton = showClearIcon && state.value.length > 0 && !disabled;
    const showLoadingIcon = state.isLoading;

    return (
      <div className={classNames('ql-input-container', className)}>
        <div className='ql-input-wrapper'>
          {/* Search Icon */}
          {showSearchIcon && (
            <div className='ql-input-icon ql-input-icon--search'>
              <SearchIcon />
            </div>
          )}

          {/* Main Input */}
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
            className={classNames('ql-input', getInputStateClass())}
            data-testid='ql-input'
            {...props}
          />

          {/* Clear Button */}
          {showClearButton && (
            <button
              type='button'
              onClick={handleClear}
              className='ql-input-icon ql-input-icon--clear'
              aria-label='Clear input'>
              <XIcon />
            </button>
          )}

          {/* Loading Icon */}
          {showLoadingIcon && (
            <div className='ql-input-icon ql-input-icon--loading'>
              <LoaderIcon />
            </div>
          )}
        </div>

        {/* Suggestions Popover */}
        {isOpen && state.suggestions.length > 0 && (
          <div className='ql-suggestions-popover' ref={suggestionsRef}>
            <div className='ql-suggestions ql-fade-in'>
              {state.suggestions.length === 0 ? (
                <div className='ql-suggestions-empty'>No suggestions found.</div>
              ) : (
                state.suggestions.map((suggestion, index) => {
                  const isSelected = index === state.selectedSuggestionIndex;
                  return (
                    <div
                      key={`${suggestion.category}-${index}`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={classNames('ql-suggestion-item', isSelected && 'ql-suggestion-item--selected')}
                      data-testid='suggestion-item'>
                      <div className='ql-suggestion-item__content'>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={classNames('ql-suggestion-type', `ql-suggestion-type--${suggestion.type}`)}>
                            {suggestion.type}
                          </span>
                          <span className='ql-suggestion-item__label'>
                            {suggestion.displayValue || suggestion.value}
                          </span>
                        </div>
                        {suggestion.description && (
                          <div className='ql-suggestion-item__description'>{suggestion.description}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Validation errors */}
        {state.validationErrors.length > 0 && (
          <div className='ql-validation-error'>{state.validationErrors[0].message}</div>
        )}
      </div>
    );
  }
);

QLInput.displayName = 'QLInput';

export { QLInput };
