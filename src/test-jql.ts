// Simple test to verify JQL parser functionality
import { QLParser } from './lib/ql-parser';
import { QLSuggestionEngine } from './lib/ql-suggestions';
import type { QLInputConfig } from './lib/ql-types';

// Test configuration
const testConfig: QLInputConfig = {
  fields: [
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      sortable: true,
      options: [
        { value: 'PROJ1', displayValue: 'Project Alpha' },
        { value: 'PROJ2', displayValue: 'Project Beta' },
      ],
    },
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      sortable: true,
      options: [
        { value: 'Open', displayValue: 'Open' },
        { value: 'In Progress', displayValue: 'In Progress' },
      ],
    },
  ],
  maxSuggestions: 10,
  allowParentheses: true,
  allowOrderBy: true,
};

// Test parser
const parser = new QLParser(testConfig);
const suggestionEngine = new QLSuggestionEngine(testConfig);

// Test queries
const testQueries = [
  'project = PROJ1',
  'project = PROJ1 AND status = "In Progress"',
  'project IN (PROJ1, PROJ2) ORDER BY status ASC',
];

console.log('Testing QL Parser:');
testQueries.forEach((query) => {
  console.log(`\nQuery: ${query}`);
  const tokens = parser.tokenize(query);
  console.log('Tokens:', tokens);

  const parsed = parser.parse(query);
  console.log('Parsed:', parsed);
});

// Test suggestions
console.log('\nTesting Suggestion Engine:');
const context = suggestionEngine.getSuggestionContext('project ', 8, parser.tokenize('project '));
console.log('Context:', context);

const suggestions = suggestionEngine.getSuggestions(context);
console.log('Suggestions:', suggestions);

export { parser, suggestionEngine };
