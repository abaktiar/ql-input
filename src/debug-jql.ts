// Debug script to test JQL functionality
import { JQLParser } from './lib/jql-parser';
import { JQLSuggestionEngine } from './lib/jql-suggestions';
import type { JQLInputConfig } from './lib/jql-types';

const config: JQLInputConfig = {
  fields: [
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'PROJ1', displayValue: 'Project Alpha' }
      ]
    }
  ],
  maxSuggestions: 10,
  allowParentheses: true,
  allowOrderBy: true
};

const parser = new JQLParser(config);
const suggestionEngine = new JQLSuggestionEngine(config);

// Test cases
const testCases = [
  { input: 'pro', cursor: 3, description: 'Typing "pro"' },
  { input: 'project', cursor: 7, description: 'Complete "project"' },
  { input: 'project ', cursor: 8, description: 'After "project "' },
  { input: 'project IN (', cursor: 12, description: 'After "project IN ("' },
  { input: 'project IN (PROJ1', cursor: 17, description: 'After "project IN (PROJ1"' },
  { input: 'project IN (PROJ1, ', cursor: 19, description: 'After "project IN (PROJ1, "' },
  { input: 'project IN (PROJ1, pro', cursor: 22, description: 'After "project IN (PROJ1, pro"' },
  { input: '', cursor: 0, description: 'Empty input' },
];

console.log('=== JQL Debug Tests ===');

// Focus on the problematic case first
const problematicCase = {
  input: 'project IN (PROJ1, pro',
  cursor: 22,
  description: 'PROBLEMATIC: After "project IN (PROJ1, pro"',
};

console.log(`\n--- ${problematicCase.description} ---`);
console.log(`Input: "${problematicCase.input}", Cursor: ${problematicCase.cursor}`);

const tokens = parser.tokenize(problematicCase.input);
console.log('Tokens:', tokens);

const context = suggestionEngine.getSuggestionContext(problematicCase.input, problematicCase.cursor, tokens);
console.log('Context:', {
  expectingField: context.expectingField,
  expectingOperator: context.expectingOperator,
  expectingValue: context.expectingValue,
  inInList: context.inInList,
  lastField: context.lastField,
  lastOperator: context.lastOperator,
  currentToken: context.currentToken,
  partialInput: context.partialInput,
});

const suggestions = suggestionEngine.getSuggestions(context);
console.log(
  'Suggestions:',
  suggestions.map((s) => ({ type: s.type, value: s.value, displayValue: s.displayValue }))
);

// Run all test cases too
testCases.forEach(({ input, cursor, description }) => {
  console.log(`\n--- ${description} ---`);
  console.log(`Input: "${input}", Cursor: ${cursor}`);

  const tokens = parser.tokenize(input);
  console.log('Tokens:', tokens);

  const context = suggestionEngine.getSuggestionContext(input, cursor, tokens);
  console.log('Context:', {
    expectingField: context.expectingField,
    expectingOperator: context.expectingOperator,
    expectingValue: context.expectingValue,
    currentToken: context.currentToken,
    partialInput: context.partialInput,
  });

  const suggestions = suggestionEngine.getSuggestions(context);
  console.log(
    'Suggestions:',
    suggestions.map((s) => ({ type: s.type, value: s.value }))
  );
});

export { parser, suggestionEngine };
