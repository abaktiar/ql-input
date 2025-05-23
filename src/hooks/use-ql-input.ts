import { useState, useCallback, useRef } from 'react';
import type { QLInputState, QLInputConfig, QLSuggestion, QLQuery, QLValue } from '@/lib/ql-types';
import { QLParser } from '@/lib/ql-parser';
import { QLSuggestionEngine } from '@/lib/ql-suggestions';

interface UseQLInputProps {
  config: QLInputConfig;
  initialValue?: string;
  onChange?: (value: string, query: QLQuery) => void;
  onExecute?: (query: QLQuery) => void;
  getAsyncValueSuggestions?: (field: string, typedValue: string) => Promise<QLValue[]>;
  getPredefinedValueSuggestions?: (field: string) => QLValue[];
}

export function useQLInput({
  config,
  initialValue = '',
  onChange,
  onExecute,
  getAsyncValueSuggestions,
  getPredefinedValueSuggestions,
}: UseQLInputProps) {
  const [state, setState] = useState<QLInputState>({
    value: initialValue,
    tokens: [],
    suggestions: [],
    showSuggestions: false,
    selectedSuggestionIndex: 0,
    cursorPosition: 0,
    query: { raw: initialValue, valid: true, errors: [] },
    validationErrors: [],
    isLoading: false,
  });

  const parser = useRef(new QLParser(config));
  const suggestionEngine = useRef(new QLSuggestionEngine(config));

  // Parse query and update tokens
  const updateQuery = useCallback(
    (value: string) => {
      const tokens = parser.current.tokenize(value);
      const query = parser.current.parse(value);

      setState((prev) => ({
        ...prev,
        tokens,
        query,
      }));

      onChange?.(value, query);
    },
    [onChange]
  );

  // Update suggestions based on cursor position
  const updateSuggestions = useCallback(
    async (value: string, cursorPosition: number) => {
      const tokens = parser.current.tokenize(value);
      const context = suggestionEngine.current.getSuggestionContext(value, cursorPosition, tokens);

      let suggestions = suggestionEngine.current.getSuggestions(context);

      // Add async value suggestions if needed
      if (context.expectingValue && context.lastField && getAsyncValueSuggestions) {
        const field = config.fields.find((f) => f.name === context.lastField);
        if (field?.asyncValueSuggestions && context.partialInput) {
          setState((prev) => ({ ...prev, isLoading: true }));

          try {
            const asyncValues = await getAsyncValueSuggestions(context.lastField!, context.partialInput);
            const asyncSuggestions: QLSuggestion[] = asyncValues.map((value) => ({
              type: 'value',
              value: value.value,
              displayValue: value.displayValue || value.value,
              description: value.description,
              insertText: value.value.includes(' ') ? `"${value.value}"` : value.value,
              category: 'Dynamic Values',
            }));

            suggestions = [...asyncSuggestions, ...suggestions];
          } catch (error) {
            console.error('Failed to fetch async suggestions:', error);
          } finally {
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        }
      }

      // Add predefined value suggestions
      if (context.expectingValue && context.lastField && getPredefinedValueSuggestions) {
        const predefinedValues = getPredefinedValueSuggestions(context.lastField);
        const predefinedSuggestions: QLSuggestion[] = predefinedValues.map((value) => ({
          type: 'value',
          value: value.value,
          displayValue: value.displayValue || value.value,
          description: value.description,
          insertText: value.value.includes(' ') ? `"${value.value}"` : value.value,
          category: 'Predefined Values',
        }));

        suggestions = [...predefinedSuggestions, ...suggestions];
      }

      setState((prev) => ({
        ...prev,
        suggestions,
        selectedSuggestionIndex: 0,
        showSuggestions: suggestions.length > 0,
      }));
    },
    [config.fields, getAsyncValueSuggestions, getPredefinedValueSuggestions]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (value: string, cursorPosition: number) => {
      setState((prev) => ({
        ...prev,
        value,
        cursorPosition,
      }));

      updateQuery(value);
      // Update suggestions immediately for better responsiveness
      updateSuggestions(value, cursorPosition);
    },
    [updateQuery, updateSuggestions]
  );

  // Handle suggestion selection
  const selectSuggestion = useCallback(
    (suggestion: QLSuggestion) => {
      const { value, cursorPosition, tokens } = state;

      // Find the current token to replace
      const currentToken = tokens.find((token) => cursorPosition >= token.start && cursorPosition <= token.end);

      let newValue: string;
      let newCursorPosition: number;

      // Determine if we should add a space after the suggestion
      const shouldAddSpace = (suggestion: QLSuggestion): boolean => {
        // Don't add space for certain types that already include spacing or punctuation
        if (suggestion.insertText) {
          // If insertText is provided, use it as-is (it might already include spacing)
          return false;
        }

        // Add space for most suggestion types except punctuation
        return !['parenthesis', 'comma'].includes(suggestion.type);
      };

      if (currentToken && currentToken.type !== 'whitespace') {
        // Special case: if we're on a parenthesis or comma in an IN list, insert after it instead of replacing
        const isInListPunctuation =
          (currentToken.type === 'parenthesis' && currentToken.value === '(') || currentToken.type === 'comma';

        if (isInListPunctuation && (suggestion.type === 'value' || suggestion.type === 'function')) {
          // Insert after the punctuation token
          const before = value.slice(0, currentToken.end);
          const after = value.slice(currentToken.end);
          let insertText = suggestion.insertText || suggestion.value;

          // Add space if needed and there's no space already after
          if (shouldAddSpace(suggestion) && !after.startsWith(' ')) {
            insertText += ' ';
          }

          newValue = before + insertText + after;
          newCursorPosition = currentToken.end + insertText.length;
        } else {
          // Replace the current token
          const before = value.slice(0, currentToken.start);
          const after = value.slice(currentToken.end);
          let insertText = suggestion.insertText || suggestion.value;

          // Add space if needed and there's no space already after
          if (shouldAddSpace(suggestion) && !after.startsWith(' ')) {
            insertText += ' ';
          }

          newValue = before + insertText + after;
          newCursorPosition = currentToken.start + insertText.length;
        }
      } else {
        // Insert at cursor position
        const before = value.slice(0, cursorPosition);
        const after = value.slice(cursorPosition);
        let insertText = suggestion.insertText || suggestion.value;

        // Add space if needed and there's no space already after
        if (shouldAddSpace(suggestion) && !after.startsWith(' ')) {
          insertText += ' ';
        }

        newValue = before + insertText + after;
        newCursorPosition = cursorPosition + insertText.length;
      }

      setState((prev) => ({
        ...prev,
        value: newValue,
        cursorPosition: newCursorPosition,
        showSuggestions: false,
        selectedSuggestionIndex: 0,
      }));

      updateQuery(newValue);
    },
    [state, updateQuery]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!state.showSuggestions) {
        if (event.key === 'Enter') {
          onExecute?.(state.query);
          return;
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedSuggestionIndex: Math.min(prev.selectedSuggestionIndex + 1, prev.suggestions.length - 1),
          }));
          break;

        case 'ArrowUp':
          event.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedSuggestionIndex: Math.max(prev.selectedSuggestionIndex - 1, 0),
          }));
          break;

        case 'Enter':
          event.preventDefault();
          if (state.suggestions[state.selectedSuggestionIndex]) {
            selectSuggestion(state.suggestions[state.selectedSuggestionIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setState((prev) => ({
            ...prev,
            showSuggestions: false,
            selectedSuggestionIndex: 0,
          }));
          break;

        case 'Tab':
          event.preventDefault();
          if (state.suggestions[state.selectedSuggestionIndex]) {
            selectSuggestion(state.suggestions[state.selectedSuggestionIndex]);
          }
          break;
      }
    },
    [state.showSuggestions, state.suggestions, state.selectedSuggestionIndex, state.query, onExecute, selectSuggestion]
  );

  // Hide suggestions when clicking outside
  const hideSuggestions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showSuggestions: false,
      selectedSuggestionIndex: 0,
    }));
  }, []);

  // Removed debounce effect - suggestions are now updated immediately on input change

  return {
    state,
    handleInputChange,
    handleKeyDown,
    selectSuggestion,
    hideSuggestions,
  };
}
