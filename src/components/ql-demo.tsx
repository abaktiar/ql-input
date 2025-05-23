import { useState } from 'react';
import { QLInput } from './ui/ql-input';
import { Button } from './ui/button';
import type { QLInputConfig, QLQuery, QLValue, QLField, QLFunction } from '@/lib/ql-types';
import { toMongooseQuery, toSQLQuery, printExpression, countConditions } from '@/lib/ql-query-builder';

// Sample configuration for demo
const sampleFields: QLField[] = [
  {
    name: 'project',
    displayName: 'Project',
    type: 'option',
    operators: ['=', '!=', 'IN', 'NOT IN'],
    sortable: true,
    description: 'The project this issue belongs to',
    options: [
      { value: 'PROJ1', displayValue: 'Project Alpha' },
      { value: 'PROJ2', displayValue: 'Project Beta' },
      { value: 'PROJ3', displayValue: 'Project Gamma' },
      { value: 'PRODUCT', displayValue: 'Product Management' },
      { value: 'PROTOTYPE', displayValue: 'Prototype Development' },
    ],
  },
  {
    name: 'status',
    displayName: 'Status',
    type: 'option',
    operators: ['=', '!=', 'IN', 'NOT IN'],
    sortable: true,
    description: 'Current status of the issue',
    options: [
      { value: 'Open', displayValue: 'Open' },
      { value: 'In Progress', displayValue: 'In Progress' },
      { value: 'Done', displayValue: 'Done' },
      { value: 'Closed', displayValue: 'Closed' },
    ],
  },
  {
    name: 'assignee',
    displayName: 'Assignee',
    type: 'user',
    operators: ['=', '!=', 'IN', 'NOT IN', 'IS EMPTY', 'IS NOT EMPTY'],
    sortable: true,
    description: 'Person assigned to this issue',
    asyncValueSuggestions: true,
  },
  {
    name: 'reporter',
    displayName: 'Reporter',
    type: 'user',
    operators: ['=', '!=', 'IN', 'NOT IN'],
    sortable: true,
    description: 'Person who reported this issue',
    asyncValueSuggestions: true,
  },
  {
    name: 'summary',
    displayName: 'Summary',
    type: 'text',
    operators: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY'],
    sortable: true,
    description: 'Issue summary/title',
  },
  {
    name: 'description',
    displayName: 'Description',
    type: 'text',
    operators: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY'],
    sortable: false,
    description: 'Issue description',
  },
  {
    name: 'priority',
    displayName: 'Priority',
    type: 'option',
    operators: ['=', '!=', 'IN', 'NOT IN'],
    sortable: true,
    description: 'Issue priority level',
    options: [
      { value: 'Highest', displayValue: 'Highest' },
      { value: 'High', displayValue: 'High' },
      { value: 'Medium', displayValue: 'Medium' },
      { value: 'Low', displayValue: 'Low' },
      { value: 'Lowest', displayValue: 'Lowest' },
    ],
  },
  {
    name: 'created',
    displayName: 'Created Date',
    type: 'datetime',
    operators: ['=', '!=', '>', '<', '>=', '<='],
    sortable: true,
    description: 'When the issue was created',
  },
  {
    name: 'updated',
    displayName: 'Updated Date',
    type: 'datetime',
    operators: ['=', '!=', '>', '<', '>=', '<='],
    sortable: true,
    description: 'When the issue was last updated',
  },
  {
    name: 'storyPoints',
    displayName: 'Story Points',
    type: 'number',
    operators: ['=', '!=', '>', '<', '>=', '<=', 'IS EMPTY', 'IS NOT EMPTY'],
    sortable: true,
    description: 'Story points assigned to this issue',
  },
];

const sampleFunctions: QLFunction[] = [
  {
    name: 'currentUser',
    displayName: 'currentUser()',
    description: 'Returns the current logged-in user',
  },
  {
    name: 'now',
    displayName: 'now()',
    description: 'Returns the current date and time',
  },
  {
    name: 'startOfDay',
    displayName: 'startOfDay()',
    description: 'Returns the start of the current day',
  },
  {
    name: 'endOfDay',
    displayName: 'endOfDay()',
    description: 'Returns the end of the current day',
  },
  {
    name: 'startOfWeek',
    displayName: 'startOfWeek()',
    description: 'Returns the start of the current week',
  },
  {
    name: 'endOfWeek',
    displayName: 'endOfWeek()',
    description: 'Returns the end of the current week',
  },
];

const config: QLInputConfig = {
  fields: sampleFields,
  functions: sampleFunctions,
  maxSuggestions: 10,
  debounceMs: 300,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true,
};

// Sample users for async suggestions
const sampleUsers = [
  { value: 'john.doe', displayValue: 'John Doe', description: 'Software Engineer' },
  { value: 'jane.smith', displayValue: 'Jane Smith', description: 'Product Manager' },
  { value: 'bob.wilson', displayValue: 'Bob Wilson', description: 'QA Engineer' },
  { value: 'alice.brown', displayValue: 'Alice Brown', description: 'UX Designer' },
  { value: 'charlie.davis', displayValue: 'Charlie Davis', description: 'DevOps Engineer' },
];

export function QLDemo() {
  const [query, setQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<QLQuery | null>(null);
  const [executedQuery, setExecutedQuery] = useState<QLQuery | null>(null);

  // Mock async user suggestions
  const getAsyncValueSuggestions = async (field: string, typedValue: string): Promise<QLValue[]> => {
    if (field === 'assignee' || field === 'reporter') {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      return sampleUsers.filter(
        (user) =>
          user.value.toLowerCase().includes(typedValue.toLowerCase()) ||
          user.displayValue.toLowerCase().includes(typedValue.toLowerCase())
      );
    }
    return [];
  };

  const handleQueryChange = (value: string, query: QLQuery) => {
    setQuery(value);
    setParsedQuery(query);
  };

  const handleExecute = (query: QLQuery) => {
    setExecutedQuery(query);
  };

  const sampleQueries = [
    'project = PROJ1 AND status = "In Progress"',
    'assignee = currentUser() AND priority IN (High, Highest)',
    'project IN (PROJ1, PROJ2) AND status != Done',
    'reporter IN (john.doe, jane.smith) AND priority = High',
    'created >= startOfWeek() ORDER BY priority DESC',
    'summary ~ "bug" AND status NOT IN (Done, Closed)',
    '(project = PROJ1 OR project = PROJ2) AND assignee IS NOT EMPTY',
    'project = PROJ1 and status = Open or priority = High', // lowercase operators
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold mb-4'>QL Input Component Demo</h2>
        <p className='text-muted-foreground mb-6'>
          A comprehensive QL (Query Language) input component with autocomplete, syntax highlighting, and validation.
        </p>
      </div>

      <div className='space-y-4'>
        <div>
          <div className='flex items-center justify-between mb-2'>
            <label className='text-sm font-medium'>QL Query</label>
            {parsedQuery && (
              <div className='flex items-center gap-2 text-xs'>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                    parsedQuery.valid
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${parsedQuery.valid ? 'bg-green-500' : 'bg-red-500'}`} />
                  {parsedQuery.valid ? 'Valid' : 'Invalid'}
                </div>
                <span className='text-muted-foreground'>
                  {parsedQuery.where ? countConditions(parsedQuery.where) : 0} condition
                  {(parsedQuery.where ? countConditions(parsedQuery.where) : 0) !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <QLInput
            value={query}
            onChange={handleQueryChange}
            onExecute={handleExecute}
            config={config}
            getAsyncValueSuggestions={getAsyncValueSuggestions}
            placeholder='Enter your QL query here...'
            className='w-full'
          />
        </div>

        <div className='flex gap-2 flex-wrap'>
          <span className='text-sm font-medium'>Try these examples:</span>
          {sampleQueries.map((sampleQuery, index) => (
            <Button key={index} variant='outline' size='sm' onClick={() => setQuery(sampleQuery)}>
              {sampleQuery}
            </Button>
          ))}
        </div>
      </div>

      {parsedQuery && (
        <div className='space-y-4'>
          <div>
            <h3 className='text-lg font-semibold mb-2'>🌳 Query Structure</h3>
            <div className='bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
              {parsedQuery.where ? (
                <div>
                  <p className='text-sm text-blue-800 dark:text-blue-200 mb-2'>
                    Hierarchical structure perfect for database queries! 🎯
                  </p>
                  <pre className='text-sm overflow-x-auto text-blue-700 dark:text-blue-300'>
                    {printExpression(parsedQuery.where)}
                  </pre>
                </div>
              ) : (
                <p className='text-sm text-blue-600 dark:text-blue-400'>
                  No hierarchical structure available (simple query)
                </p>
              )}
            </div>
          </div>

          {/* Database Query Conversion */}
          {parsedQuery.where && (
            <div>
              <h3 className='text-lg font-semibold mb-2'>🔄 Database Query Conversion</h3>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                {/* Mongoose Query */}
                <div>
                  <h4 className='text-md font-medium mb-2'>🍃 Mongoose Query</h4>
                  <div className='bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800'>
                    <pre className='text-xs overflow-x-auto text-green-700 dark:text-green-300'>
                      {JSON.stringify(toMongooseQuery(parsedQuery.where), null, 2)}
                    </pre>
                  </div>
                </div>

                {/* SQL Query */}
                <div>
                  <h4 className='text-md font-medium mb-2'>🗄️ SQL WHERE Clause</h4>
                  <div className='bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800'>
                    <pre className='text-xs overflow-x-auto text-purple-700 dark:text-purple-300'>
                      WHERE {toSQLQuery(parsedQuery.where)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw Parsed Query */}
          <div>
            <h3 className='text-lg font-semibold mb-2'>📄 Complete Parsed Query</h3>
            <div className='bg-muted p-4 rounded-lg'>
              <pre className='text-sm overflow-x-auto'>{JSON.stringify(parsedQuery, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {executedQuery && (
        <div className='space-y-4'>
          <div>
            <h3 className='text-lg font-semibold mb-2'>Executed Query</h3>
            <div className='bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800'>
              <p className='text-sm text-green-800 dark:text-green-200 mb-2'>Query executed successfully!</p>
              <pre className='text-sm overflow-x-auto text-green-700 dark:text-green-300'>
                {JSON.stringify(executedQuery, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Features Demonstrated</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <h4 className='font-medium'>✅ Core Features</h4>
            <ul className='text-sm space-y-1 text-muted-foreground'>
              <li>• Context-aware autocomplete</li>
              <li>• Field, operator, and value suggestions</li>
              <li>• Parentheses grouping support</li>
              <li>• ORDER BY clause support</li>
              <li>• Query parsing and validation</li>
              <li>• Visual feedback for query status</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <h4 className='font-medium'>✅ Advanced Features</h4>
            <ul className='text-sm space-y-1 text-muted-foreground'>
              <li>• Async value suggestions (users)</li>
              <li>• Function support (currentUser, now, etc.)</li>
              <li>• Debounced API calls</li>
              <li>• Dark mode support</li>
              <li>• Responsive design</li>
              <li>• Accessibility (ARIA attributes)</li>
            </ul>
          </div>
          <div className='space-y-2'>
            <h4 className='font-medium'>⌨️ Keyboard Shortcuts</h4>
            <ul className='text-sm space-y-1 text-muted-foreground'>
              <li>
                • <kbd className='px-1 py-0.5 bg-muted rounded text-xs'>↑↓</kbd> Navigate suggestions
              </li>
              <li>
                • <kbd className='px-1 py-0.5 bg-muted rounded text-xs'>Enter</kbd> Select suggestion
              </li>
              <li>
                • <kbd className='px-1 py-0.5 bg-muted rounded text-xs'>Tab</kbd> Accept suggestion
              </li>
              <li>
                • <kbd className='px-1 py-0.5 bg-muted rounded text-xs'>Esc</kbd> Close suggestions
              </li>
              <li>
                • <kbd className='px-1 py-0.5 bg-muted rounded text-xs'>Enter</kbd> Execute query (no suggestions)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
