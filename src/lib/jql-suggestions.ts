import type {
  JQLSuggestion,
  JQLInputConfig,
  SuggestionContext,
  JQLToken,
  SortDirection
} from './jql-types';

export class JQLSuggestionEngine {
  private config: JQLInputConfig;

  constructor(config: JQLInputConfig) {
    this.config = config;
  }

  /**
   * Get suggestions based on current context
   */
  getSuggestions(context: SuggestionContext): JQLSuggestion[] {
    const suggestions: JQLSuggestion[] = [];
    const { partialInput = '' } = context;

    // Debug: console.log('getSuggestions called with context:', context);

    // Field suggestions
    if (context.expectingField) {
      // Debug: console.log('Adding field suggestions');
      suggestions.push(...this.getFieldSuggestions());

      if (this.config.allowParentheses) {
        suggestions.push({
          type: 'parenthesis',
          value: '(',
          displayValue: '( - Group conditions',
          insertText: '(',
        });
      }
    }

    // Operator suggestions
    if (context.expectingOperator && context.lastField) {
      // Debug: console.log('Adding operator suggestions for field:', context.lastField);
      suggestions.push(...this.getOperatorSuggestions(context.lastField));
    }

    // Value suggestions
    if (context.expectingValue && context.lastField) {
      // Debug: console.log('Adding value suggestions for field:', context.lastField);
      suggestions.push(...this.getValueSuggestions(context.lastField));
    }

    // IN list value suggestions (inside parentheses)
    if (context.inInList && context.lastField) {
      // Debug: console.log('Adding IN list suggestions for field:', context.lastField);
      suggestions.push(...this.getInListValueSuggestions(context.lastField, partialInput));
    }

    // Additional check: if we have an IN/NOT IN operator in recent tokens and we're expecting a value,
    // treat it as an IN list even if inInList flag isn't set
    if (
      !context.inInList &&
      context.expectingValue &&
      context.lastField &&
      context.lastOperator &&
      (context.lastOperator === 'IN' || context.lastOperator === 'NOT IN')
    ) {
      console.log(
        'Adding fallback IN list suggestions for field:',
        context.lastField,
        'operator:',
        context.lastOperator
      );
      suggestions.push(...this.getInListValueSuggestions(context.lastField, partialInput));
    }

    // EMERGENCY FALLBACK: Check if input contains "IN (" pattern and we have a partial input
    if (suggestions.length === 0 && partialInput) {
      const hasInPattern = /\bIN\s*\(/i.test(context.input);
      const hasNotInPattern = /\bNOT\s+IN\s*\(/i.test(context.input);

      if (hasInPattern || hasNotInPattern) {
        console.log('EMERGENCY FALLBACK: Detected IN pattern, lastField:', context.lastField);

        // Always extract field name from input to ensure we get the correct one
        let fieldName = context.lastField;
        const fieldMatch = context.input.match(/(\w+)\s+(NOT\s+)?IN\s*\(/i);
        if (fieldMatch) {
          fieldName = fieldMatch[1];
          console.log('Extracted field name from input:', fieldName, '(was:', context.lastField, ')');
        }

        if (fieldName) {
          console.log('Adding emergency IN list suggestions for field:', fieldName);
          suggestions.push(...this.getInListValueSuggestions(fieldName, partialInput));
        }
      }
    }

    // Logical operator suggestions
    if (context.expectingLogical) {
      suggestions.push(...this.getLogicalOperatorSuggestions());

      if (this.config.allowOrderBy && !context.inOrderBy) {
        suggestions.push({
          type: 'keyword',
          value: 'ORDER BY',
          displayValue: 'ORDER BY - Sort results',
          insertText: 'ORDER BY ',
        });
      }

      if (this.config.allowParentheses && context.parenthesesLevel > 0) {
        suggestions.push({
          type: 'parenthesis',
          value: ')',
          displayValue: ') - Close group',
          insertText: ')',
        });
      }
    }

    // ORDER BY field suggestions
    if (context.inOrderBy && context.expectingField) {
      suggestions.push(...this.getSortableFieldSuggestions());
    }

    // Sort direction suggestions
    if (context.inOrderBy && context.previousToken?.type === 'field') {
      suggestions.push(...this.getSortDirectionSuggestions());
    }

    // Function suggestions
    if (this.config.allowFunctions && context.expectingValue) {
      suggestions.push(...this.getFunctionSuggestions());
    }

    // Filter suggestions based on partial input
    console.log('Before filtering:', { suggestions: suggestions.length, partialInput });
    const filtered = this.filterSuggestions(suggestions, partialInput);
    console.log('After filtering:', { filtered: filtered.length });
    return filtered;
  }

  /**
   * Get field suggestions
   */
  private getFieldSuggestions(): JQLSuggestion[] {
    return this.config.fields.map((field) => ({
      type: 'field' as const,
      value: field.name,
      displayValue: field.displayName || field.name,
      description: field.description,
      insertText: field.name + ' ',
      category: 'Fields',
    }));
  }

  /**
   * Get operator suggestions for a specific field
   */
  private getOperatorSuggestions(fieldName: string): JQLSuggestion[] {
    const field = this.config.fields.find((f) => f.name === fieldName);
    if (!field) return [];

    return field.operators.map((operator) => {
      // For IN and NOT IN operators, add opening parenthesis
      const isListOperator = operator === 'IN' || operator === 'NOT IN';
      const insertText = isListOperator ? `${operator} (` : `${operator} `;

      return {
        type: 'operator' as const,
        value: operator,
        displayValue: operator,
        insertText,
        category: 'Operators',
      };
    });
  }

  /**
   * Get value suggestions for a specific field
   */
  private getValueSuggestions(fieldName: string): JQLSuggestion[] {
    const field = this.config.fields.find((f) => f.name === fieldName);
    if (!field) return [];

    const suggestions: JQLSuggestion[] = [];

    // Add predefined options for option/multiselect fields
    if (field.options) {
      suggestions.push(
        ...field.options.map((option) => ({
          type: 'value' as const,
          value: option.value,
          displayValue: option.displayValue || option.value,
          description: option.description,
          insertText: this.needsQuotes(option.value) ? `"${option.value}"` : option.value,
          category: 'Values',
        }))
      );
    }

    // Add common values based on field type
    if (field.type === 'text') {
      suggestions.push({
        type: 'value',
        value: 'EMPTY',
        displayValue: 'EMPTY - Empty value',
        insertText: 'EMPTY',
        category: 'Special Values',
      });
    }

    if (field.type === 'user') {
      suggestions.push({
        type: 'value',
        value: 'currentUser()',
        displayValue: 'currentUser() - Current logged in user',
        insertText: 'currentUser()',
        category: 'Functions',
      });
    }

    if (field.type === 'date' || field.type === 'datetime') {
      suggestions.push(
        {
          type: 'value',
          value: 'now()',
          displayValue: 'now() - Current date/time',
          insertText: 'now()',
          category: 'Functions',
        },
        {
          type: 'value',
          value: 'startOfDay()',
          displayValue: 'startOfDay() - Start of current day',
          insertText: 'startOfDay()',
          category: 'Functions',
        },
        {
          type: 'value',
          value: 'endOfDay()',
          displayValue: 'endOfDay() - End of current day',
          insertText: 'endOfDay()',
          category: 'Functions',
        }
      );
    }

    return suggestions;
  }

  /**
   * Get logical operator suggestions
   */
  private getLogicalOperatorSuggestions(): JQLSuggestion[] {
    const operators = this.config.logicalOperators || ['AND', 'OR', 'NOT'];

    return operators.map((operator) => ({
      type: 'logical' as const,
      value: operator,
      displayValue: operator,
      insertText: operator + ' ',
      category: 'Logical Operators',
    }));
  }

  /**
   * Get sortable field suggestions for ORDER BY
   */
  private getSortableFieldSuggestions(): JQLSuggestion[] {
    return this.config.fields
      .filter((field) => field.sortable !== false)
      .map((field) => ({
        type: 'field' as const,
        value: field.name,
        displayValue: field.displayName || field.name,
        description: field.description,
        insertText: field.name + ' ',
        category: 'Sortable Fields',
      }));
  }

  /**
   * Get sort direction suggestions
   */
  private getSortDirectionSuggestions(): JQLSuggestion[] {
    const directions: SortDirection[] = ['ASC', 'DESC'];

    return directions.map((direction) => ({
      type: 'keyword' as const,
      value: direction,
      displayValue: direction === 'ASC' ? 'ASC - Ascending' : 'DESC - Descending',
      insertText: direction,
      category: 'Sort Direction',
    }));
  }

  /**
   * Get function suggestions
   */
  private getFunctionSuggestions(): JQLSuggestion[] {
    if (!this.config.functions) return [];

    return this.config.functions.map((func) => ({
      type: 'function' as const,
      value: func.name,
      displayValue: func.displayName || func.name,
      description: func.description,
      insertText: func.name + '()',
      category: 'Functions',
    }));
  }

  /**
   * Get value suggestions for IN lists (inside parentheses)
   */
  private getInListValueSuggestions(fieldName: string, _partialInput: string): JQLSuggestion[] {
    const field = this.config.fields.find((f) => f.name === fieldName);
    if (!field) return [];

    const suggestions: JQLSuggestion[] = [];

    // Add predefined options for option/multiselect fields
    if (field.options) {
      suggestions.push(
        ...field.options.map((option) => ({
          type: 'value' as const,
          value: option.value,
          displayValue: option.displayValue || option.value,
          description: option.description,
          insertText: this.needsQuotes(option.value) ? `"${option.value}"` : option.value,
          category: 'List Values',
        }))
      );
    }

    // Add common values based on field type
    if (field.type === 'user') {
      suggestions.push({
        type: 'value',
        value: 'currentUser()',
        displayValue: 'currentUser() - Current logged in user',
        insertText: 'currentUser()',
        category: 'Functions',
      });
    }

    // Add comma suggestion for additional values
    if (suggestions.length > 0) {
      suggestions.push({
        type: 'comma',
        value: ',',
        displayValue: ', - Add another value',
        insertText: ', ',
        category: 'Syntax',
      });
    }

    // Add closing parenthesis suggestion
    suggestions.push({
      type: 'parenthesis',
      value: ')',
      displayValue: ') - Close list',
      insertText: ')',
      category: 'Syntax',
    });

    return suggestions;
  }

  /**
   * Filter suggestions based on partial input
   */
  private filterSuggestions(suggestions: JQLSuggestion[], partialInput: string): JQLSuggestion[] {
    console.log('Filtering suggestions:', {
      total: suggestions.length,
      partialInput,
      caseSensitive: this.config.caseSensitive,
      suggestions: suggestions.map(s => ({ value: s.value, displayValue: s.displayValue, type: s.type }))
    });

    if (!partialInput.trim()) {
      return suggestions.slice(0, this.config.maxSuggestions || 10);
    }

    const filtered = suggestions.filter((suggestion) => {
      const searchText = this.config.caseSensitive ? suggestion.value : suggestion.value.toLowerCase();
      const input = this.config.caseSensitive ? partialInput : partialInput.toLowerCase();

      const valueMatches = searchText.includes(input);
      const displayMatches = suggestion.displayValue &&
        (this.config.caseSensitive ? suggestion.displayValue : suggestion.displayValue.toLowerCase()).includes(input);

      const matches = valueMatches || displayMatches;

      if (!matches) {
        console.log(`Filtered out: "${suggestion.value}" (display: "${suggestion.displayValue}") - no match for "${input}"`);
      }

      return matches;
    });

    // Sort by relevance (exact matches first, then starts with, then contains)
    filtered.sort((a, b) => {
      const aValue = this.config.caseSensitive ? a.value : a.value.toLowerCase();
      const bValue = this.config.caseSensitive ? b.value : b.value.toLowerCase();
      const input = this.config.caseSensitive ? partialInput : partialInput.toLowerCase();

      // Exact match
      if (aValue === input && bValue !== input) return -1;
      if (bValue === input && aValue !== input) return 1;

      // Starts with
      if (aValue.startsWith(input) && !bValue.startsWith(input)) return -1;
      if (bValue.startsWith(input) && !aValue.startsWith(input)) return 1;

      // Alphabetical
      return aValue.localeCompare(bValue);
    });

    return filtered.slice(0, this.config.maxSuggestions || 10);
  }

  /**
   * Check if a value needs quotes
   */
  private needsQuotes(value: string): boolean {
    return /\s/.test(value) || /[()"]/.test(value);
  }

  /**
   * Get suggestion context from input and cursor position
   */
  getSuggestionContext(input: string, cursorPosition: number, tokens: JQLToken[]): SuggestionContext {
    // Debug: console.log('=== STEP BY STEP ANALYSIS ===');
    // Debug: console.log('Input:', input);
    // Debug: console.log('Cursor position:', cursorPosition);
    // Debug: console.log('All tokens:', tokens.map(t => `${t.type}:"${t.value}"[${t.start}-${t.end}]`));
    // Find current token at cursor position or create one for partial input
    let currentToken = tokens.find((token) => cursorPosition >= token.start && cursorPosition <= token.end);

    // If no token found and we're at the end, check if we're typing a new token
    if (!currentToken && cursorPosition === input.length) {
      // Look for the last non-whitespace character position
      let lastNonWhitespacePos = input.length - 1;
      while (lastNonWhitespacePos >= 0 && /\s/.test(input[lastNonWhitespacePos])) {
        lastNonWhitespacePos--;
      }

      // If we have non-whitespace characters after the last token, we're typing a new token
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastNonWhitespacePos >= lastToken.end) {
        const partialStart = lastToken.end;
        while (partialStart < input.length && /\s/.test(input[partialStart])) {
          // Skip whitespace
        }
        const partialValue = input.slice(partialStart).trim();
        if (partialValue) {
          currentToken = {
            type: 'unknown',
            value: partialValue,
            start: partialStart,
            end: input.length,
          };
        }
      } else if (!lastToken && input.trim()) {
        // First token being typed
        currentToken = {
          type: 'unknown',
          value: input.trim(),
          start: 0,
          end: input.length,
        };
      }
    }

    // Find previous and next non-whitespace tokens
    const nonWhitespaceTokens = tokens.filter((token) => token.type !== 'whitespace');
    const currentIndex = currentToken ? nonWhitespaceTokens.indexOf(currentToken) : -1;
    const previousToken = currentIndex > 0 ? nonWhitespaceTokens[currentIndex - 1] : undefined;
    const nextToken =
      currentIndex >= 0 && currentIndex < nonWhitespaceTokens.length - 1
        ? nonWhitespaceTokens[currentIndex + 1]
        : undefined;

    // Determine what we're expecting based on context
    let expectingField = true; // Default to expecting field
    let expectingOperator = false;
    let expectingValue = false;
    let expectingLogical = false;
    let inOrderBy = false;
    let parenthesesLevel = 0;
    let inInList = false;
    let lastField: string | undefined;
    let lastOperator: string | undefined;

    // If input is empty or we're at the beginning, we're definitely expecting a field
    if (!input.trim() || cursorPosition === 0) {
      expectingField = true;
      expectingOperator = false;
      expectingValue = false;
      expectingLogical = false;
    }

    // Analyze tokens to determine context (excluding the current token if it's partial)
    const tokensToAnalyze = nonWhitespaceTokens.filter((token) => token !== currentToken);

    // Enhanced IN list detection - look for IN operator followed by opening parenthesis
    let foundInOperator = false;
    let openParenAfterIn = 0;

    for (const token of tokensToAnalyze) {
      // Debug: console.log(`Analyzing token: ${token.type}="${token.value}", inInList=${inInList}, expectingValue=${expectingValue}`);
      if (token.type === 'parenthesis') {
        if (token.value === '(') {
          parenthesesLevel++;

          // If we just found an IN operator, this opening parenthesis starts an IN list
          if (foundInOperator) {
            inInList = true;
            openParenAfterIn = parenthesesLevel;
            foundInOperator = false; // Reset flag
            expectingValue = true;
            expectingField = false;
            expectingOperator = false;
            expectingLogical = false;
          } else if (inInList) {
            // Nested parentheses within IN list - still expect values
            expectingValue = true;
            expectingField = false;
            expectingOperator = false;
            expectingLogical = false;
          } else {
            // Regular grouping parentheses
            expectingField = true;
            expectingOperator = false;
            expectingValue = false;
            expectingLogical = false;
          }
        } else {
          parenthesesLevel--;

          // Check if this closing parenthesis ends the IN list
          if (inInList && parenthesesLevel < openParenAfterIn) {
            inInList = false;
            openParenAfterIn = 0;
          }

          expectingLogical = true;
          expectingField = false;
          expectingOperator = false;
          expectingValue = false;
        }
      } else if (token.type === 'keyword' && token.value.toUpperCase() === 'ORDER') {
        inOrderBy = true;
        expectingField = false;
      } else if (token.type === 'keyword' && token.value.toUpperCase() === 'BY') {
        expectingField = true;
        expectingOperator = false;
        expectingValue = false;
        expectingLogical = false;
      } else if (token.type === 'field') {
        // Only update lastField if we're not in an IN list
        // In IN lists, tokens might be misclassified as fields when they should be values
        if (!inInList) {
          lastField = token.value;
        }

        if (inOrderBy) {
          expectingLogical = true;
          expectingField = false;
          expectingOperator = false;
          expectingValue = false;
        } else if (inInList) {
          // If we're in an IN list, treat this "field" token as a value
          expectingField = false;
          expectingOperator = false;
          expectingLogical = false;
          // Keep expectingValue as is
        } else {
          expectingOperator = true;
          expectingField = false;
          expectingValue = false;
          expectingLogical = false;
        }
      } else if (token.type === 'operator') {
        lastOperator = token.value;
        expectingValue = true;
        expectingField = false;
        expectingOperator = false;
        expectingLogical = false;

        // Check if this is an IN operator that expects a list
        if (token.value === 'IN' || token.value === 'NOT IN') {
          foundInOperator = true;
          // Don't set inInList yet - wait for opening parenthesis
        }
      } else if (token.type === 'value') {
        // If we're in an IN list, after a value we might expect a comma or closing parenthesis
        if (inInList) {
          // Stay in IN list mode - don't change expectingValue yet,
          // let comma or closing parenthesis determine next state
          expectingField = false;
          expectingOperator = false;
          expectingLogical = false;
          // Keep expectingValue as is - comma will set it to true, closing paren will set it to false
        } else {
          expectingLogical = true;
          expectingField = false;
          expectingOperator = false;
          expectingValue = false;
        }
      } else if (token.type === 'logical') {
        expectingField = true;
        expectingOperator = false;
        expectingValue = false;
        expectingLogical = false;
        inInList = false; // Logical operators end IN lists
      } else if (token.type === 'comma') {
        // Commas in IN lists mean we expect another value
        if (inInList) {
          expectingValue = true;
          expectingField = false;
          expectingOperator = false;
          expectingLogical = false;
        }
        // Note: Don't change inInList state - we're still in the list
      }
    }

    // If we have a current token that's unknown, determine what it should be
    if (currentToken && currentToken.type === 'unknown') {
      // Based on context, this unknown token is likely a field if we're expecting a field
      if (expectingField) {
        currentToken.type = 'field';
      } else if (expectingValue || inInList) {
        // If we're expecting a value or in an IN list, treat unknown token as a value
        currentToken.type = 'value';
      }
    }

    // Get partial input for current token
    let partialInput = '';
    if (currentToken && currentToken.type !== 'whitespace') {
      const tokenStart = currentToken.start;
      const relativePosition = cursorPosition - tokenStart;
      partialInput = currentToken.value.slice(0, relativePosition);
    }

    console.log('getSuggestionContext:', {
      input,
      cursorPosition,
      currentToken,
      expectingField,
      expectingValue,
      inInList,
      lastField,
      lastOperator,
      partialInput,
      tokensAnalyzed: tokensToAnalyze.length,
      allTokens: tokens.map((t) => ({ type: t.type, value: t.value, start: t.start, end: t.end })),
      nonWhitespaceTokens: nonWhitespaceTokens.map((t) => ({ type: t.type, value: t.value })),
    });

    return {
      input,
      cursorPosition,
      tokens,
      currentToken,
      previousToken,
      nextToken,
      expectingField,
      expectingOperator,
      expectingValue,
      expectingLogical,
      inOrderBy,
      parenthesesLevel,
      inInList,
      lastField,
      lastOperator,
      partialInput,
    };
  }
}
