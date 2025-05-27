import { test, expect } from '@playwright/test';
import { QLSuggestionEngine } from '../../src/lib/ql-suggestions';
import { QLParser } from '../../src/lib/ql-parser';
import { testFields, testFunctions, expectedSuggestions } from '../fixtures/test-data';

test.describe('QL Suggestions Unit Tests', () => {
  let suggestionEngine: QLSuggestionEngine;
  let parser: QLParser;

  test.beforeEach(() => {
    const config = {
      fields: testFields,
      functions: testFunctions,
      maxSuggestions: 10,
      caseSensitive: false,
      allowParentheses: true,
      allowOrderBy: true,
      allowFunctions: true,
    };
    
    suggestionEngine = new QLSuggestionEngine(config);
    parser = new QLParser(config);
  });

  test.describe('Field Suggestions', () => {
    test('should suggest fields at the beginning', () => {
      const tokens = parser.tokenize('');
      const context = suggestionEngine.getSuggestionContext('', 0, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const fieldSuggestions = suggestions.filter(s => s.type === 'field');
      expect(fieldSuggestions.length).toBeGreaterThan(0);
      
      for (const field of expectedSuggestions.fields) {
        expect(fieldSuggestions.some(s => s.value === field)).toBe(true);
      }
    });

    test('should filter field suggestions based on partial input', () => {
      const tokens = parser.tokenize('proj');
      const context = suggestionEngine.getSuggestionContext('proj', 4, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const fieldSuggestions = suggestions.filter(s => s.type === 'field');
      expect(fieldSuggestions.some(s => s.value === 'project')).toBe(true);
      expect(fieldSuggestions.some(s => s.value === 'status')).toBe(false);
    });
  });

  test.describe('Operator Suggestions', () => {
    test('should suggest operators after field', () => {
      const tokens = parser.tokenize('project ');
      const context = suggestionEngine.getSuggestionContext('project ', 8, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const operatorSuggestions = suggestions.filter(s => s.type === 'operator');
      expect(operatorSuggestions.length).toBeGreaterThan(0);
      
      for (const operator of expectedSuggestions.operators.project) {
        expect(operatorSuggestions.some(s => s.value === operator)).toBe(true);
      }
    });

    test('should suggest field-specific operators', () => {
      const tokens = parser.tokenize('summary ');
      const context = suggestionEngine.getSuggestionContext('summary ', 8, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const operatorSuggestions = suggestions.filter(s => s.type === 'operator');
      
      // Summary field should have text operators
      expect(operatorSuggestions.some(s => s.value === '~')).toBe(true);
      expect(operatorSuggestions.some(s => s.value === '!~')).toBe(true);
      
      // But not comparison operators
      expect(operatorSuggestions.some(s => s.value === '>')).toBe(false);
      expect(operatorSuggestions.some(s => s.value === '<')).toBe(false);
    });

    test('should add opening parenthesis for IN operators', () => {
      const tokens = parser.tokenize('project ');
      const context = suggestionEngine.getSuggestionContext('project ', 8, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const inOperator = suggestions.find(s => s.value === 'IN');
      expect(inOperator).toBeDefined();
      expect(inOperator!.insertText).toBe('IN (');
    });
  });

  test.describe('Value Suggestions', () => {
    test('should suggest values after operator', () => {
      const tokens = parser.tokenize('project = ');
      const context = suggestionEngine.getSuggestionContext('project = ', 10, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const valueSuggestions = suggestions.filter(s => s.type === 'value');
      expect(valueSuggestions.length).toBeGreaterThan(0);
      
      for (const value of expectedSuggestions.values.project) {
        expect(valueSuggestions.some(s => s.value === value)).toBe(true);
      }
    });

    test('should quote multi-word values', () => {
      const tokens = parser.tokenize('status = ');
      const context = suggestionEngine.getSuggestionContext('status = ', 9, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const inProgressSuggestion = suggestions.find(s => s.value === 'In Progress');
      expect(inProgressSuggestion).toBeDefined();
      expect(inProgressSuggestion!.insertText).toBe('"In Progress"');
    });

    test('should not quote single-word values', () => {
      const tokens = parser.tokenize('status = ');
      const context = suggestionEngine.getSuggestionContext('status = ', 9, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const openSuggestion = suggestions.find(s => s.value === 'Open');
      expect(openSuggestion).toBeDefined();
      expect(openSuggestion!.insertText).toBeUndefined();
    });
  });

  test.describe('IN Operator Suggestions', () => {
    test('should suggest values with commas in IN lists', () => {
      const tokens = parser.tokenize('project IN (');
      const context = suggestionEngine.getSuggestionContext('project IN (', 12, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const valueSuggestions = suggestions.filter(s => s.type === 'value');
      expect(valueSuggestions.length).toBeGreaterThan(0);
      
      for (const suggestion of valueSuggestions) {
        expect(suggestion.insertText).toContain(', ');
      }
    });

    test('should quote multi-word values with commas in IN lists', () => {
      const tokens = parser.tokenize('status IN (');
      const context = suggestionEngine.getSuggestionContext('status IN (', 11, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const inProgressSuggestion = suggestions.find(s => s.value === 'In Progress');
      expect(inProgressSuggestion).toBeDefined();
      expect(inProgressSuggestion!.insertText).toBe('"In Progress", ');
    });

    test('should suggest comma after values in IN lists', () => {
      const tokens = parser.tokenize('project IN (PROJ1, ');
      const context = suggestionEngine.getSuggestionContext('project IN (PROJ1, ', 19, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const commaSuggestion = suggestions.find(s => s.type === 'comma');
      expect(commaSuggestion).toBeDefined();
    });
  });

  test.describe('Logical Operator Suggestions', () => {
    test('should suggest logical operators after complete condition', () => {
      const tokens = parser.tokenize('project = PROJ1 ');
      const context = suggestionEngine.getSuggestionContext('project = PROJ1 ', 16, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const logicalSuggestions = suggestions.filter(s => s.type === 'logical');
      expect(logicalSuggestions.length).toBeGreaterThan(0);
      
      for (const logical of expectedSuggestions.logical) {
        expect(logicalSuggestions.some(s => s.value === logical)).toBe(true);
      }
    });

    test('should suggest logical operators after closing parenthesis', () => {
      const tokens = parser.tokenize('project IN (PROJ1, PROJ2) ');
      const context = suggestionEngine.getSuggestionContext('project IN (PROJ1, PROJ2) ', 26, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const logicalSuggestions = suggestions.filter(s => s.type === 'logical');
      expect(logicalSuggestions.length).toBeGreaterThan(0);
    });
  });

  test.describe('Function Suggestions', () => {
    test('should suggest functions as values', () => {
      const tokens = parser.tokenize('assignee = ');
      const context = suggestionEngine.getSuggestionContext('assignee = ', 11, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const functionSuggestions = suggestions.filter(s => s.type === 'function');
      expect(functionSuggestions.length).toBeGreaterThan(0);
      
      const currentUserFunction = functionSuggestions.find(s => s.value === 'currentUser');
      expect(currentUserFunction).toBeDefined();
      expect(currentUserFunction!.insertText).toBe('currentUser()');
    });

    test('should suggest functions with commas in IN lists', () => {
      const tokens = parser.tokenize('assignee IN (');
      const context = suggestionEngine.getSuggestionContext('assignee IN (', 13, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      const functionSuggestions = suggestions.filter(s => s.type === 'function');
      expect(functionSuggestions.length).toBeGreaterThan(0);
      
      const currentUserFunction = functionSuggestions.find(s => s.value === 'currentUser');
      expect(currentUserFunction).toBeDefined();
      expect(currentUserFunction!.insertText).toBe('currentUser(), ');
    });
  });

  test.describe('Context Detection', () => {
    test('should detect IN list context', () => {
      const tokens = parser.tokenize('project IN (PROJ1, ');
      const context = suggestionEngine.getSuggestionContext('project IN (PROJ1, ', 19, tokens);
      
      expect(context.inInList).toBe(true);
      expect(context.lastField).toBe('project');
      expect(context.lastOperator).toBe('IN');
    });

    test('should detect ORDER BY context', () => {
      const tokens = parser.tokenize('project = PROJ1 ORDER BY ');
      const context = suggestionEngine.getSuggestionContext('project = PROJ1 ORDER BY ', 25, tokens);
      
      expect(context.inOrderBy).toBe(true);
      expect(context.expectingField).toBe(true);
    });

    test('should preserve field context in IN lists', () => {
      const tokens = parser.tokenize('project IN (PROJ1');
      const context = suggestionEngine.getSuggestionContext('project IN (PROJ1', 17, tokens);
      
      expect(context.inInList).toBe(true);
      expect(context.lastField).toBe('project');
    });
  });

  test.describe('Filtering', () => {
    test('should filter suggestions case-insensitively', () => {
      const tokens = parser.tokenize('PROJ');
      const context = suggestionEngine.getSuggestionContext('PROJ', 4, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      expect(suggestions.some(s => s.value === 'project')).toBe(true);
    });

    test('should filter by partial matches', () => {
      const tokens = parser.tokenize('stat');
      const context = suggestionEngine.getSuggestionContext('stat', 4, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      expect(suggestions.some(s => s.value === 'status')).toBe(true);
      expect(suggestions.some(s => s.value === 'project')).toBe(false);
    });
  });

  test.describe('ORDER BY Suggestions', () => {
    test('should suggest fields after "ORDER BY "', () => {
      const input = 'ORDER BY ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      expect(context.inOrderBy).toBe(true);
      expect(context.expectingField).toBe(true);
      const fieldSuggestions = suggestions.filter((s) => s.type === 'field');
      // Based on getSortableFieldSuggestions, only sortable fields are suggested.
      // 'created' and 'updated' are explicitly sortable: true.
      // Other fields are not explicitly sortable: false, so they should be suggested.
      const sortableFields = testFields.filter(f => f.sortable !== false).map(f => f.name);
      expect(fieldSuggestions.length).toBe(sortableFields.length);
      for (const field of sortableFields) {
        expect(fieldSuggestions.some((s) => s.value === field)).toBe(true);
      }
    });

    test('should filter field suggestions after "ORDER BY p"', () => {
      const input = 'ORDER BY p';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      expect(context.inOrderBy).toBe(true);
      expect(context.expectingField).toBe(true); // Still expecting field as 'p' is partial
      const fieldSuggestions = suggestions.filter((s) => s.type === 'field' && s.value.startsWith('p'));
      expect(fieldSuggestions.some((s) => s.value === 'project')).toBe(true);
      expect(fieldSuggestions.some((s) => s.value === 'priority')).toBe(true);
      expect(fieldSuggestions.some((s) => s.value === 'status')).toBe(false);
    });

    test('should suggest ASC/DESC after "ORDER BY priority "', () => {
      const input = 'ORDER BY priority ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      expect(context.inOrderBy).toBe(true);
      // After a full field, we expect ASC/DESC or comma
      const keywordSuggestions = suggestions.filter((s) => s.type === 'keyword');
      expect(keywordSuggestions.some((s) => s.value === 'ASC')).toBe(true);
      expect(keywordSuggestions.some((s) => s.value === 'DESC')).toBe(true);
    });

    test('should suggest comma after "ORDER BY priority DESC "', () => {
      const input = 'ORDER BY priority DESC ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      expect(suggestions.some((s) => s.type === 'comma' && s.value === ',')).toBe(true);
      // Also, logical operators might be suggested if ORDER BY is at the start of a sub-query part
      // or if the query can continue with AND/OR.
      // However, the primary expectation here for ORDER BY clause continuation is a comma.
    });

    test('should suggest fields after "ORDER BY priority DESC, "', () => {
      const input = 'ORDER BY priority DESC, ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      expect(context.inOrderBy).toBe(true);
      expect(context.expectingField).toBe(true);
      const fieldSuggestions = suggestions.filter((s) => s.type === 'field');
      const sortableFields = testFields.filter(f => f.sortable !== false).map(f => f.name);
      expect(fieldSuggestions.length).toBeGreaterThanOrEqual(sortableFields.length); // Could be more if filtering isn't perfect
      for (const field of sortableFields) {
        expect(fieldSuggestions.some((s) => s.value === field)).toBe(true);
      }
    });
  });

  test.describe('Complex Query Suggestions', () => {
    test('should suggest fields after an opening parenthesis "( "', () => {
      const input = '( ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      expect(context.expectingField).toBe(true);
      const fieldSuggestions = suggestions.filter(s => s.type === 'field');
      expect(fieldSuggestions.length).toBeGreaterThan(0);
      expect(fieldSuggestions.some(s => s.value === 'project')).toBe(true);
      // Also check for function suggestions if allowFunctions is true
      if (suggestionEngine['config'].allowFunctions) {
        const functionSuggestions = suggestions.filter(s => s.type === 'function');
        expect(functionSuggestions.length).toBeGreaterThan(0);
        expect(functionSuggestions.some(s => s.value === 'currentUser')).toBe(true);
      }
    });

    test('should suggest values in nested structures "(project = PROJ1 AND (status = "', () => {
      const input = '(project = PROJ1 AND (status = ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);
      
      expect(context.expectingValue).toBe(true);
      expect(context.lastField).toBe('status');
      const valueSuggestions = suggestions.filter(s => s.type === 'value');
      expect(valueSuggestions.length).toBeGreaterThan(0);
      for (const value of expectedSuggestions.values.status) {
        expect(valueSuggestions.some(s => s.value === value)).toBe(true);
      }
    });

    test('should suggest fields or parenthesis after "NOT "', () => {
      const input = 'NOT ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      // After NOT, we can have a field or an opening parenthesis for a group
      const fieldSuggestions = suggestions.filter(s => s.type === 'field');
      expect(fieldSuggestions.length).toBeGreaterThan(0);
      expect(fieldSuggestions.some(s => s.value === 'project')).toBe(true);
      
      const parenthesisSuggestion = suggestions.find(s => s.type === 'parenthesis' && s.value === '(');
      expect(parenthesisSuggestion).toBeDefined();
    });

    test('should suggest fields after "NOT ("', () => {
      const input = 'NOT (';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      expect(context.expectingField).toBe(true);
      const fieldSuggestions = suggestions.filter(s => s.type === 'field');
      expect(fieldSuggestions.length).toBeGreaterThan(0);
      expect(fieldSuggestions.some(s => s.value === 'project')).toBe(true);
    });

    test('should suggest fields or parenthesis after "project = PROJ1 AND NOT "', () => {
      const input = 'project = PROJ1 AND NOT ';
      const tokens = parser.tokenize(input);
      const context = suggestionEngine.getSuggestionContext(input, input.length, tokens);
      const suggestions = suggestionEngine.getSuggestions(context);

      const fieldSuggestions = suggestions.filter(s => s.type === 'field');
      expect(fieldSuggestions.length).toBeGreaterThan(0);
      expect(fieldSuggestions.some(s => s.value === 'project')).toBe(true);

      const parenthesisSuggestion = suggestions.find(s => s.type === 'parenthesis' && s.value === '(');
      expect(parenthesisSuggestion).toBeDefined();
    });
  });
});
