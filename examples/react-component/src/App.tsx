import React, { useState } from 'react';
import { QLInput, QLQuery, QLInputConfig, QLValue, toMongooseQuery, toSQLQuery, printExpression, countConditions } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';

// Mock data for async suggestions
const mockUsers = [
  { value: 'john.doe', label: 'John Doe' },
  { value: 'jane.smith', label: 'Jane Smith' },
  { value: 'bob.wilson', label: 'Bob Wilson' },
  { value: 'alice.brown', label: 'Alice Brown' },
  { value: 'charlie.davis', label: 'Charlie Davis' }
];

const mockProjects = [
  { value: 'project-alpha', label: 'Project Alpha' },
  { value: 'project-beta', label: 'Project Beta' },
  { value: 'project-gamma', label: 'Project Gamma' }
];

// Field configuration
const config: QLInputConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' }
      ]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY'],
      asyncValueSuggestions: true
    },
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      asyncValueSuggestions: true
    },
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'number',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true,
      options: [
        { value: '1', label: 'Low' },
        { value: '2', label: 'Medium' },
        { value: '3', label: 'High' },
        { value: '4', label: 'Critical' }
      ]
    },
    {
      name: 'title',
      displayName: 'Title',
      type: 'text',
      operators: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY']
    },
    {
      name: 'created',
      displayName: 'Created Date',
      type: 'date',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true
    },
    {
      name: 'tags',
      displayName: 'Tags',
      type: 'multiselect',
      operators: ['IN', 'NOT IN'],
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'feature', label: 'Feature' },
        { value: 'enhancement', label: 'Enhancement' },
        { value: 'documentation', label: 'Documentation' }
      ]
    }
  ],
  functions: [
    {
      name: 'currentUser',
      displayName: 'currentUser()',
      description: 'Returns the current logged-in user'
    },
    {
      name: 'now',
      displayName: 'now()',
      description: 'Returns the current date and time'
    },
    {
      name: 'startOfWeek',
      displayName: 'startOfWeek()',
      description: 'Returns the start of the current week'
    },
    {
      name: 'daysAgo',
      displayName: 'daysAgo(days)',
      description: 'Returns a date N days ago from today',
      parameters: [{
        name: 'days',
        type: 'number',
        required: true,
        description: 'Number of days'
      }]
    },
    {
      name: 'userInRole',
      displayName: 'userInRole(role)',
      description: 'Returns users with specific role',
      parameters: [{
        name: 'role',
        type: 'text',
        required: true,
        description: 'User role name'
      }]
    },
    {
      name: 'dateRange',
      displayName: 'dateRange(start, end)',
      description: 'Creates a date range query',
      parameters: [
        {
          name: 'start',
          type: 'date',
          required: true,
          description: 'Start date'
        },
        {
          name: 'end',
          type: 'date',
          required: true,
          description: 'End date'
        }
      ]
    }
  ],
  maxSuggestions: 10,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};

// Example queries
const exampleQueries = [
  {
    title: 'Simple Status Filter',
    description: 'Filter by status',
    query: 'status = "open"'
  },
  {
    title: 'Current User Assignment',
    description: 'Items assigned to current user',
    query: 'assignee = currentUser()'
  },
  {
    title: 'Recent Items (Last 7 Days)',
    description: 'Items created in the last 7 days',
    query: 'created >= daysAgo(7)'
  },
  {
    title: 'Admin Role Items',
    description: 'Items assigned to admin users',
    query: 'assignee = userInRole("admin")'
  },
  {
    title: 'High Priority Open Items',
    description: 'Open items with high priority',
    query: 'status = "open" AND priority >= 3'
  },
  {
    title: 'Complex Grouping with Functions',
    description: 'Multiple conditions with parameterized functions',
    query: '(status = "open" OR status = "pending") AND assignee IN (currentUser(), userInRole("manager"))'
  },
  {
    title: 'Recent Urgent Items',
    description: 'Search title and filter by recent date',
    query: 'title ~ "urgent" AND created >= daysAgo(30)'
  },
  {
    title: 'Unassigned Critical Items',
    description: 'Critical items without assignee',
    query: 'assignee IS EMPTY AND priority = 4'
  },
  {
    title: 'Tag-based Search with Sorting',
    description: 'Filter by tags and sort results',
    query: 'tags IN ("bug", "critical") ORDER BY created DESC'
  },
  {
    title: 'Advanced Query',
    description: 'Complex query with multiple conditions and sorting',
    query: 'status IN ("open", "pending") AND (assignee = currentUser() OR assignee IS EMPTY) ORDER BY priority DESC, created ASC'
  }
];

function App() {
  const [currentQuery, setCurrentQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<QLQuery | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock async value suggestions
  const getAsyncValueSuggestions = async (field: string, typedValue: string): Promise<QLValue[]> => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    let results: QLValue[] = [];

    if (field === 'assignee') {
      results = mockUsers.filter(
        (user) =>
          user.label.toLowerCase().includes(typedValue.toLowerCase()) ||
          user.value.toLowerCase().includes(typedValue.toLowerCase())
      );
    } else if (field === 'project') {
      results = mockProjects.filter(
        (project) =>
          project.label.toLowerCase().includes(typedValue.toLowerCase()) ||
          project.value.toLowerCase().includes(typedValue.toLowerCase())
      );
    }

    setIsLoading(false);
    return results;
  };

  const handleQueryChange = (value: string, query: QLQuery) => {
    setCurrentQuery(value);
    setParsedQuery(query);
  };

  const handleQueryExecute = (query: QLQuery) => {
    console.log('Query executed:', query);
    alert(`Query executed! Check console for details.\n\nQuery: ${query.raw}\nValid: ${query.valid}`);
  };

  const loadExampleQuery = (query: string) => {
    setCurrentQuery(query);
  };

  return (
    <div className='container'>
      <div className='header'>
        <h1>QL Input React Example</h1>
        <p>Interactive demo of @abaktiar/ql-input component</p>
      </div>

      <div className='demo-section'>
        <h2>Interactive Query Builder</h2>
        <p>
          Start typing to see intelligent autocomplete suggestions. Try field names, operators, values, and functions
          like <code>currentUser()</code> or <code>startOfWeek()</code>.
        </p>

        <QLInput
          config={config}
          value={currentQuery}
          onChange={handleQueryChange}
          onExecute={handleQueryExecute}
          getAsyncValueSuggestions={getAsyncValueSuggestions}
          placeholder="Enter your query... e.g., status = 'open' AND assignee = currentUser()"
          showSearchIcon={true}
          showClearIcon={true}
        />

        {isLoading && (
          <div className='loading-indicator'>
            <div className='spinner'></div>
            Loading suggestions...
          </div>
        )}

        {parsedQuery && (
          <div className='query-output'>
            <div className='status-indicator'>
              <div className={`status-dot ${parsedQuery.valid ? 'valid' : 'invalid'}`}></div>
              <span className={parsedQuery.valid ? 'status-valid' : 'status-invalid'}>
                {parsedQuery.valid ? 'Valid Query' : 'Invalid Query'}
              </span>
              {parsedQuery.valid && <span>• {countConditions(parsedQuery)} condition(s)</span>}
            </div>

            {!parsedQuery.valid && parsedQuery.errors.length > 0 && (
              <div style={{ marginTop: '0.5rem', color: '#e53e3e', fontSize: '0.875rem' }}>
                Errors: {parsedQuery.errors.join(', ')}
              </div>
            )}

            {parsedQuery.valid && (
              <>
                {parsedQuery.where && (
                  <div>
                    <h3>Readable Expression:</h3>
                    <pre>{printExpression(parsedQuery.where)}</pre>
                  </div>
                )}

                {parsedQuery.orderBy && parsedQuery.orderBy.length > 0 && (
                  <div>
                    <h3>Order By:</h3>
                    <pre>{parsedQuery.orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}</pre>
                  </div>
                )}

                <div>
                  <h3>MongoDB Query:</h3>
                  <pre>{JSON.stringify(toMongooseQuery(parsedQuery), null, 2)}</pre>
                </div>

                <div>
                  <h3>SQL Query:</h3>
                  <pre>{toSQLQuery(parsedQuery)}</pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className='demo-section'>
        <h2>Example Queries</h2>
        <p>Click on any example below to load it into the query builder:</p>

        <div className='examples-grid'>
          {exampleQueries.map((example, index) => (
            <div key={index} className='example-card'>
              <h3>{example.title}</h3>
              <p>{example.description}</p>
              <div
                className='example-query'
                onClick={() => loadExampleQuery(example.query)}
                title='Click to load this query'>
                {example.query}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='async-demo'>
        <h3>🚀 Async Suggestions Demo</h3>
        <p>
          Try typing <strong>assignee = "</strong> or <strong>project = "</strong> to see async value suggestions in
          action. The component will fetch user and project data dynamically as you type.
        </p>
      </div>
    </div>
  );
}

export default App;
