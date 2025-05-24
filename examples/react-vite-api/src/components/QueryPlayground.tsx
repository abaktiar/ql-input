import React, { useState } from 'react';
import { QLInput, QLQuery, QLInputConfig, QLValue, toMongooseQuery, toSQLQuery, printExpression, countConditions } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';

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
        { value: 'documentation', label: 'Documentation' },
        { value: 'security', label: 'Security' },
        { value: 'performance', label: 'Performance' }
      ]
    }
  ],
  maxSuggestions: 10,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};

const exampleQueries = [
  {
    title: 'Simple Status Filter',
    query: 'status = "open"',
    description: 'Filter by status'
  },
  {
    title: 'Current User Assignment',
    query: 'assignee = currentUser()',
    description: 'Items assigned to current user'
  },
  {
    title: 'High Priority Items',
    query: 'priority >= 3',
    description: 'High priority items'
  },
  {
    title: 'Complex Grouping',
    query: '(status = "open" OR status = "pending") AND priority >= 3',
    description: 'Multiple conditions with grouping'
  },
  {
    title: 'Text Search',
    query: 'title ~ "bug" AND status != "closed"',
    description: 'Search in title with status filter'
  },
  {
    title: 'Unassigned Critical',
    query: 'assignee IS EMPTY AND priority = 4',
    description: 'Critical items without assignee'
  },
  {
    title: 'Recent Items',
    query: 'created >= startOfWeek() ORDER BY created DESC',
    description: 'Items created this week, sorted by date'
  },
  {
    title: 'Tag-based Search',
    query: 'tags IN ("bug", "critical") AND status = "open"',
    description: 'Filter by multiple tags'
  },
  {
    title: 'Advanced Query',
    query: 'status IN ("open", "pending") AND (assignee = currentUser() OR assignee IS EMPTY) ORDER BY priority DESC, created ASC',
    description: 'Complex query with multiple conditions and sorting'
  }
];

function QueryPlayground() {
  const [currentQuery, setCurrentQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<QLQuery | null>(null);
  const [activeTab, setActiveTab] = useState<'mongodb' | 'sql' | 'expression'>('expression');

  const getAsyncValueSuggestions = async (field: string, typedValue: string): Promise<QLValue[]> => {
    try {
      let endpoint = '';
      if (field === 'assignee') {
        endpoint = '/api/suggestions/users';
      } else if (field === 'project') {
        endpoint = '/api/suggestions/projects';
      } else {
        return [];
      }

      const response = await fetch(`${endpoint}?q=${encodeURIComponent(typedValue)}`);
      const data = await response.json();

      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      return [];
    }
  };

  const handleQueryChange = (value: string, query: QLQuery) => {
    setCurrentQuery(value);
    setParsedQuery(query);
  };

  const loadExample = (query: string) => {
    setCurrentQuery(query);
  };

  const clearQuery = () => {
    setCurrentQuery('');
    setParsedQuery(null);
  };

  return (
    <div>
      <div className='search-section'>
        <h2>Query Playground</h2>
        <p>
          Experiment with different queries and see how they're parsed and converted to different formats. This
          playground uses the same API as the Issue Tracker for async suggestions.
        </p>

        <QLInput
          config={config}
          value={currentQuery}
          onChange={handleQueryChange}
          getAsyncValueSuggestions={getAsyncValueSuggestions}
          placeholder="Enter your query to see how it's parsed..."
          showSearchIcon={true}
          showClearIcon={true}
        />

        <div className='search-controls'>
          <button className='button secondary' onClick={clearQuery}>
            Clear Query
          </button>
        </div>

        {parsedQuery && (
          <div className='query-info'>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Query Status:</strong>{' '}
              <span style={{ color: parsedQuery.valid ? '#38a169' : '#e53e3e' }}>
                {parsedQuery.valid ? '✅ Valid' : '❌ Invalid'}
              </span>
              {parsedQuery.valid && <span> • {countConditions(parsedQuery)} condition(s)</span>}
            </div>

            {!parsedQuery.valid && parsedQuery.errors.length > 0 && (
              <div style={{ marginBottom: '1rem', color: '#e53e3e' }}>
                <strong>Errors:</strong> {parsedQuery.errors.join(', ')}
              </div>
            )}

            {parsedQuery.valid && (
              <>
                <div className='tabs'>
                  <button
                    className={`tab ${activeTab === 'expression' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expression')}>
                    Expression Tree
                  </button>
                  <button
                    className={`tab ${activeTab === 'mongodb' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mongodb')}>
                    MongoDB Query
                  </button>
                  <button className={`tab ${activeTab === 'sql' ? 'active' : ''}`} onClick={() => setActiveTab('sql')}>
                    SQL Query
                  </button>
                </div>

                <div className='tab-content'>
                  {activeTab === 'expression' && (
                    <div>
                      {parsedQuery.where && (
                        <div>
                          <h4>WHERE Clause:</h4>
                          <pre>{printExpression(parsedQuery.where)}</pre>
                        </div>
                      )}
                      {parsedQuery.orderBy && parsedQuery.orderBy.length > 0 && (
                        <div>
                          <h4>ORDER BY Clause:</h4>
                          <pre>{parsedQuery.orderBy.map((o) => `${o.field} ${o.direction}`).join(', ')}</pre>
                        </div>
                      )}
                      {!parsedQuery.where && (!parsedQuery.orderBy || parsedQuery.orderBy.length === 0) && (
                        <div style={{ color: '#718096', fontStyle: 'italic' }}>No conditions or sorting specified</div>
                      )}
                    </div>
                  )}

                  {activeTab === 'mongodb' && (
                    <div>
                      <h4>MongoDB Query Object:</h4>
                      <pre>{JSON.stringify(toMongooseQuery(parsedQuery), null, 2)}</pre>
                    </div>
                  )}

                  {activeTab === 'sql' && (
                    <div>
                      <h4>SQL WHERE Clause:</h4>
                      <pre>{toSQLQuery(parsedQuery)}</pre>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className='results-section'>
        <h3>Example Queries</h3>
        <p>Click on any example below to load it into the playground:</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
          }}>
          {exampleQueries.map((example, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease',
              }}
              onClick={() => loadExample(example.query)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>{example.title}</h4>
              <p style={{ marginBottom: '1rem', color: '#718096', fontSize: '0.875rem' }}>{example.description}</p>
              <div
                style={{
                  background: '#f7fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '0.75rem',
                  fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                  fontSize: '0.875rem',
                  color: '#2d3748',
                }}>
                {example.query}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QueryPlayground;
