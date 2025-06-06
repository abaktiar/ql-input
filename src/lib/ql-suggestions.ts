import type { QLSuggestion, QLInputConfig, SuggestionContext, QLToken, SortDirection } from './ql-types';

export class QLSuggestionEngine {
  private config: QLInputConfig;

  constructor(config: QLInputConfig) {
    this.config = config;
  }

  /**
   * Get suggestions based on current context
   */
  getSuggestions(context: SuggestionContext): QLSuggestion[] {
    const suggestions: QLSuggestion[] = [];
    const { partialInput = '' } = context;

    // console.log('getSuggestions called with context:', context);

    // Determine what type of suggestions to provide based on context
    if (context.expectingField) {
      suggestions.push(...this.getFieldSuggestions());
      if (this.config.allowFunctions) {
        suggestions.push(...this.getFunctionSuggestions());
      }
    } else if (context.expectingOperator && context.lastField) {
      suggestions.push(...this.getOperatorSuggestions(context.lastField));
    } else if (context.expectingValue && context.lastField) {
      if (context.inInList) {
        suggestions.push(...this.getInListValueSuggestions(context.lastField));
      } else {
        suggestions.push(...this.getValueSuggestions(context.lastField));
      }
    } else if (context.expectingLogical) {
      suggestions.push(...this.getLogicalOperatorSuggestions());
    } else if (context.inOrderBy) {
      if (context.expectingField) {
        suggestions.push(...this.getSortableFieldSuggestions());
      } else {
        suggestions.push(...this.getSortDirectionSuggestions());
      }
    }

    // Add parentheses suggestions if allowed
    if (this.config.allowParentheses && (context.expectingField || context.expectingLogical)) {
      suggestions.push({
        type: 'parenthesis',
        value: '(',
        displayValue: '(',
        description: 'Group conditions',
        insertText: '(',
      });
    }

    // Add comma for IN lists
    if (context.inInList) {
      suggestions.push({
        type: 'comma',
        value: ',',
        displayValue: ',',
        description: 'Add another value',
        insertText: ', ',
      });
    }

    // Filter suggestions based on partial input
    const filtered = this.filterSuggestions(suggestions, partialInput);

    // Debug: console.log('Filtered suggestions:', filtered);

    // Limit suggestions
    const maxSuggestions = this.config.maxSuggestions || 10;
    return filtered.slice(0, maxSuggestions);
  }

  /**
   * Get field suggestions
   */
  private getFieldSuggestions(): QLSuggestion[] {
    return this.config.fields.map((field) => ({
      type: 'field' as const,
      value: field.name,
      displayValue: field.displayName || field.name,
      description: field.description,
      category: 'Fields',
    }));
  }

  /**
   * Get operator suggestions for a specific field
   */
  private getOperatorSuggestions(fieldName: string): QLSuggestion[] {
    const field = this.config.fields.find((f) => f.name === fieldName);
    if (!field) return [];

    return field.operators.map((operator) => {
      // For IN and NOT IN operators, add opening parenthesis (but no trailing space)
      const isListOperator = operator === 'IN' || operator === 'NOT IN';
      const insertText = isListOperator ? `${operator} (` : operator;

      return {
        type: 'operator' as const,
        value: operator,
        displayValue: operator,
        description: this.getOperatorDescription(operator),
        insertText,
        category: 'Operators',
      };
    });
  }

  /**
   * Get value suggestions for a specific field
   */
  private getValueSuggestions(fieldName: string): QLSuggestion[] {
    const field = this.config.fields.find((f) => f.name === fieldName);
    if (!field) return [];

    const suggestions: QLSuggestion[] = [];

    // Add predefined options for option/multiselect fields
    if (field.options) {
      suggestions.push(
        ...field.options.map((option) => {
          // Check if value contains spaces or special characters that need quoting
          const needsQuotes = /\s/.test(option.value) || /[,()"]/.test(option.value);
          const quotedValue = needsQuotes ? `"${option.value}"` : option.value;

          return {
            type: 'value' as const,
            value: option.value,
            displayValue: option.displayValue || option.value,
            description: option.description,
            category: 'Values',
            insertText: needsQuotes ? quotedValue : undefined, // Only set insertText if quoting is needed
          };
        })
      );
    }

    // Add common values based on field type
    if (field.type === 'boolean') {
      suggestions.push(
        { type: 'value', value: 'true', displayValue: 'true', category: 'Values' },
        { type: 'value', value: 'false', displayValue: 'false', category: 'Values' }
      );
    }

    // Add functions if allowed
    if (this.config.allowFunctions) {
      suggestions.push(...this.getFunctionSuggestions());
    }

    return suggestions;
  }

  /**
   * Get operator description
   */
  private getOperatorDescription(operator: string): string {
    const descriptions: Record<string, string> = {
      '=': 'Equals',
      '!=': 'Not equals',
      '>': 'Greater than',
      '<': 'Less than',
      '>=': 'Greater than or equal',
      '<=': 'Less than or equal',
      '~': 'Contains',
      '!~': 'Does not contain',
      IN: 'In list',
      'NOT IN': 'Not in list',
      'IS EMPTY': 'Is empty',
      'IS NOT EMPTY': 'Is not empty',
    };
    return descriptions[operator] || operator;
  }

  /**
   * Get logical operator suggestions
   */
  private getLogicalOperatorSuggestions(): QLSuggestion[] {
    const operators = this.config.logicalOperators || ['AND', 'OR', 'NOT'];

    return operators.map((operator) => ({
      type: 'logical' as const,
      value: operator,
      displayValue: operator,
      description: this.getLogicalOperatorDescription(operator),
      category: 'Logical',
    }));
  }

  /**
   * Get sortable field suggestions for ORDER BY
   */
  private getSortableFieldSuggestions(): QLSuggestion[] {
    return this.config.fields
      .filter((field) => field.sortable !== false)
      .map((field) => ({
        type: 'field' as const,
        value: field.name,
        displayValue: field.displayName || field.name,
        description: field.description,
        category: 'Sortable Fields',
      }));
  }

  /**
   * Get sort direction suggestions
   */
  private getSortDirectionSuggestions(): QLSuggestion[] {
    const directions: SortDirection[] = ['ASC', 'DESC'];

    return directions.map((direction) => ({
      type: 'keyword' as const,
      value: direction,
      displayValue: direction,
      description: direction === 'ASC' ? 'Ascending' : 'Descending',
      category: 'Sort Direction',
    }));
  }

  /**
   * Get function suggestions
   */
  private getFunctionSuggestions(): QLSuggestion[] {
    if (!this.config.functions) return [];

    return this.config.functions.map((func) => {
      // Check if function has parameters
      const hasParameters = func.parameters && func.parameters.length > 0;

      let insertText: string;
      let displayValue: string;

      if (hasParameters) {
        // Generate parameter placeholders for parameterized functions
        const paramPlaceholders = func.parameters!.map((param) => {
          // Create placeholder based on parameter type
          let placeholder: string;
          switch (param.type) {
            case 'text':
              placeholder = param.required ? `"${param.name}"` : `"${param.name}?"`;
              break;
            case 'number':
              placeholder = param.required ? param.name : `${param.name}?`;
              break;
            case 'date':
            case 'datetime':
              placeholder = param.required ? `"YYYY-MM-DD"` : `"YYYY-MM-DD?"`;
              break;
            default:
              placeholder = param.required ? param.name : `${param.name}?`;
          }
          return placeholder;
        });

        insertText = `${func.name}(${paramPlaceholders.join(', ')})`;
        displayValue = func.displayName || `${func.name}(${func.parameters?.map((p) => p.name).join(', ') || ''})`;
      } else {
        // Parameter-less functions
        insertText = `${func.name}()`;
        displayValue = func.displayName || `${func.name}()`;
      }

      return {
        type: 'function' as const,
        value: func.name,
        displayValue: displayValue,
        description: func.description,
        insertText: insertText,
        category: 'Functions',
      };
    });
  }

  /**
   * Get value suggestions for IN lists (inside parentheses)
   */
  private getInListValueSuggestions(fieldName: string): QLSuggestion[] {
    const field = this.config.fields.find((f) => f.name === fieldName);
    if (!field) return [];

    const suggestions: QLSuggestion[] = [];

    // Add predefined options for option/multiselect fields
    if (field.options) {
      suggestions.push(
        ...field.options.map((option) => {
          // Check if value contains spaces or special characters that need quoting
          const needsQuotes = /\s/.test(option.value) || /[,()"]/.test(option.value);
          const quotedValue = needsQuotes ? `"${option.value}"` : option.value;

          return {
            type: 'value' as const,
            value: option.value,
            displayValue: option.displayValue || option.value,
            description: option.description,
            category: 'Values',
            // Add comma and space after value for easier multi-selection in IN lists
            insertText: `${quotedValue}, `,
          };
        })
      );
    }

    // Add functions if allowed (with comma for IN lists)
    if (this.config.allowFunctions && this.config.functions) {
      suggestions.push(
        ...this.config.functions.map((func) => ({
          type: 'function' as const,
          value: func.name,
          displayValue: func.displayName || func.name,
          description: func.description,
          category: 'Functions',
          // Add comma and space after function for easier multi-selection in IN lists
          insertText: `${func.name}(), `,
        }))
      );
    }

    return suggestions;
  }

  /**
   * Get logical operator description
   */
  private getLogicalOperatorDescription(operator: string): string {
    const descriptions: Record<string, string> = {
      AND: 'Both conditions must be true',
      OR: 'Either condition can be true',
      NOT: 'Negates the condition',
    };
    return descriptions[operator] || operator;
  }

  /**
   * Filter suggestions based on partial input
   */
  private filterSuggestions(suggestions: QLSuggestion[], partialInput: string): QLSuggestion[] {
    // console.log('Filtering suggestions:', {
    //   total: suggestions.length,
    //   partialInput,
    //   caseSensitive: this.config.caseSensitive,
    // });

    if (!partialInput.trim()) {
      // console.log('No partial input, returning all suggestions');
      return suggestions;
    }

    const searchTerm = this.config.caseSensitive ? partialInput : partialInput.toLowerCase();

    const filtered = suggestions.filter((suggestion) => {
      const value = this.config.caseSensitive ? suggestion.value : suggestion.value.toLowerCase();
      const displayValue = this.config.caseSensitive
        ? suggestion.displayValue || suggestion.value
        : (suggestion.displayValue || suggestion.value).toLowerCase();

      const matches = value.includes(searchTerm) || displayValue.includes(searchTerm);

      // if (matches) {
      //   console.log(`Suggestion "${suggestion.value}" matches "${partialInput}"`);
      // }

      return matches;
    });

    // console.log(`Filtered ${suggestions.length} suggestions to ${filtered.length}`);
    return filtered;
  }

  /**
   * Get suggestion context from input and cursor position
   */
  getSuggestionContext(input: string, cursorPosition: number, tokens: QLToken[]): SuggestionContext {
    // Debug: console.log('=== STEP BY STEP ANALYSIS ===');
    // Debug: console.log('Input:', input);
    // Debug: console.log('Cursor position:', cursorPosition);
    // Debug: console.log('Tokens:', tokens);

    const context: SuggestionContext = {
      input,
      cursorPosition,
      tokens,
      expectingField: true,
      expectingOperator: false,
      expectingValue: false,
      expectingLogical: false,
      inOrderBy: false,
      parenthesesLevel: 0,
      inInList: false,
    };

    // Find the token at or before the cursor position
    let currentTokenIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.start <= cursorPosition && cursorPosition <= token.end) {
        currentTokenIndex = i;
        break;
      } else if (token.start > cursorPosition) {
        currentTokenIndex = i - 1;
        break;
      }
    }

    if (currentTokenIndex === -1 && tokens.length > 0) {
      currentTokenIndex = tokens.length - 1;
    }

    // Debug: console.log('Current token index:', currentTokenIndex);

    if (currentTokenIndex >= 0) {
      context.currentToken = tokens[currentTokenIndex];
      context.previousToken = currentTokenIndex > 0 ? tokens[currentTokenIndex - 1] : undefined;
      context.nextToken = currentTokenIndex < tokens.length - 1 ? tokens[currentTokenIndex + 1] : undefined;

      // Debug: console.log('Current token:', context.currentToken);
      // Debug: console.log('Previous token:', context.previousToken);
      // Debug: console.log('Next token:', context.nextToken);
    }

    // Analyze tokens to determine context
    let expectingField = true;
    let expectingOperator = false;
    let expectingValue = false;
    let expectingLogical = false;
    let inOrderBy = false;
    let parenthesesLevel = 0;
    let inInList = false;
    let lastField: string | undefined;
    let lastOperator: string | undefined;
    let originalField: string | undefined; // Track the original field for IN lists

    for (let i = 0; i <= currentTokenIndex; i++) {
      const token = tokens[i];

      if (token.type === 'whitespace') continue;

      // Debug: console.log(`Processing token ${i}:`, token);

      if (token.type === 'keyword' && token.value.toUpperCase() === 'ORDER') {
        inOrderBy = true;
        expectingField = false;
        expectingOperator = false;
        expectingValue = false;
        expectingLogical = false;
        // Debug: console.log('Entered ORDER BY mode');
      } else if (token.type === 'keyword' && token.value.toUpperCase() === 'BY') {
        expectingField = true;
        expectingOperator = false;
        expectingValue = false;
        expectingLogical = false;
        // Debug: console.log('After BY, expecting field');
      } else if (token.type === 'field') {
        if (!inInList) {
          // Only update lastField if we're not in an IN list
          lastField = token.value;
          originalField = token.value; // Store the original field
        }

        if (inOrderBy) {
          expectingField = false;
          expectingOperator = false;
          expectingValue = false;
          expectingLogical = false;
          // In ORDER BY, after field we might expect direction or comma
        } else if (!inInList) {
          expectingField = false;
          expectingOperator = true;
          expectingValue = false;
          expectingLogical = false;
        }
        // Debug: console.log('Found field:', lastField, 'Now expecting operator');
      } else if (token.type === 'operator') {
        lastOperator = token.value;
        expectingField = false;
        expectingOperator = false;
        expectingValue = true;
        expectingLogical = false;

        // Check if this is an IN operator that expects a list
        if (token.value === 'IN' || token.value === 'NOT IN') {
          // Look ahead for opening parenthesis
          for (let j = i + 1; j < tokens.length; j++) {
            const nextToken = tokens[j];
            if (nextToken.type === 'whitespace') continue;
            if (nextToken.type === 'parenthesis' && nextToken.value === '(') {
              inInList = true;
              // Debug: console.log('Detected IN list context');
            }
            break;
          }
        }
        // Debug: console.log('Found operator:', lastOperator, 'Now expecting value');
      } else if (token.type === 'value') {
        expectingField = false;
        expectingOperator = false;
        expectingValue = false;
        expectingLogical = true;
        // Debug: console.log('Found value, now expecting logical operator');
      } else if (token.type === 'logical') {
        expectingField = true;
        expectingOperator = false;
        expectingValue = false;
        expectingLogical = false;
        // Debug: console.log('Found logical operator, now expecting field');
      } else if (token.type === 'parenthesis') {
        if (token.value === '(') {
          parenthesesLevel++;
          if (!inInList) {
            expectingField = true;
            expectingOperator = false;
            expectingValue = false;
            expectingLogical = false;
          }
          // Debug: console.log('Opening parenthesis, parentheses level:', parenthesesLevel);
        } else if (token.value === ')') {
          parenthesesLevel--;
          if (inInList && parenthesesLevel === 0) {
            inInList = false;
            expectingField = false;
            expectingOperator = false;
            expectingValue = false;
            expectingLogical = true;
          } else {
            expectingField = false;
            expectingOperator = false;
            expectingValue = false;
            expectingLogical = true;
          }
          // Debug: console.log('Closing parenthesis, parentheses level:', parenthesesLevel);
        }
      } else if (token.type === 'comma') {
        if (inInList) {
          expectingField = false;
          expectingOperator = false;
          expectingValue = true;
          expectingLogical = false;
          // Debug: console.log('Comma in IN list, expecting another value');
        }
      }
    }

    // Handle partial input at cursor position
    let partialInput = '';

    // First, try to get partial input from the current token if cursor is within it
    if (context.currentToken && context.currentToken.type !== 'whitespace') {
      const tokenStart = context.currentToken.start;
      const tokenEnd = context.currentToken.end;

      // If cursor is within the token, extract partial input
      if (cursorPosition >= tokenStart && cursorPosition <= tokenEnd) {
        partialInput = input.slice(tokenStart, cursorPosition);

        // Special case: if we're on punctuation (parentheses, commas), don't use it as partial input
        if (context.currentToken.type === 'parenthesis' || context.currentToken.type === 'comma') {
          partialInput = '';
        }

        // console.log('Partial input from current token (within):', partialInput);
      } else {
        // If cursor is at the end of the token, use the full token as partial input
        partialInput = context.currentToken.value;

        // Special case: if we're on punctuation (parentheses, commas), don't use it as partial input
        if (context.currentToken.type === 'parenthesis' || context.currentToken.type === 'comma') {
          partialInput = '';
        }

        // console.log('Partial input from current token (full):', partialInput);
      }
    } else {
      // Fallback: extract the word before cursor position
      const beforeCursor = input.slice(0, cursorPosition);
      const match = beforeCursor.match(/(\w+)$/);
      if (match) {
        partialInput = match[1];
        // console.log('Partial input from word extraction:', partialInput);
      }
    }

    // Check if we're typing within the current token (partial input scenario)
    if (context.currentToken && context.currentToken.type !== 'whitespace' && partialInput) {
      const isPartialToken = cursorPosition >= context.currentToken.start && cursorPosition <= context.currentToken.end;

      if (isPartialToken) {
        // Override context based on what we're partially typing
        // BUT preserve IN list context if we're inside parentheses
        if (context.currentToken.type === 'field' || context.currentToken.type === 'unknown') {
          if (inInList) {
            // Inside IN list, field tokens should be treated as values
            expectingField = false;
            expectingOperator = false;
            expectingValue = true;
            expectingLogical = false;
          } else {
            expectingField = true;
            expectingOperator = false;
            expectingValue = false;
            expectingLogical = false;
          }
        } else if (context.currentToken.type === 'operator') {
          expectingField = false;
          expectingOperator = true;
          expectingValue = false;
          expectingLogical = false;
        } else if (context.currentToken.type === 'value') {
          expectingField = false;
          expectingOperator = false;
          expectingValue = true;
          expectingLogical = false;
        } else if (context.currentToken.type === 'logical') {
          expectingField = false;
          expectingOperator = false;
          expectingValue = false;
          expectingLogical = true;
        } else if (context.currentToken.type === 'function') {
          expectingField = false;
          expectingOperator = false;
          expectingValue = true; // Functions are treated as values
          expectingLogical = false;
        }
      }
    }

    // Update context with computed values
    context.expectingField = expectingField;
    context.expectingOperator = expectingOperator;
    context.expectingValue = expectingValue;
    context.expectingLogical = expectingLogical;
    context.inOrderBy = inOrderBy;
    context.parenthesesLevel = parenthesesLevel;
    context.inInList = inInList;
    // Use originalField for IN lists to maintain the correct field context
    context.lastField = inInList && originalField ? originalField : lastField;
    context.lastOperator = lastOperator;
    context.partialInput = partialInput;

    // console.log('Final context:', context);

    return context;
  }
}
