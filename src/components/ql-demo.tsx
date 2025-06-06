import { useState, useEffect } from 'react';
import { QLInput } from './ui/ql-input';
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
  // New parameterized functions
  {
    name: 'daysAgo',
    displayName: 'daysAgo(days)',
    description: 'Returns a date N days ago from today',
    parameters: [
      {
        name: 'days',
        type: 'number',
        required: true,
        description: 'Number of days to go back',
      },
    ],
  },
  {
    name: 'daysFromNow',
    displayName: 'daysFromNow(days)',
    description: 'Returns a date N days from today',
    parameters: [
      {
        name: 'days',
        type: 'number',
        required: true,
        description: 'Number of days from today',
      },
    ],
  },
  {
    name: 'dateRange',
    displayName: 'dateRange(start, end)',
    description: 'Returns a date range between two dates',
    parameters: [
      {
        name: 'startDate',
        type: 'date',
        required: true,
        description: 'Start date (YYYY-MM-DD format)',
      },
      {
        name: 'endDate',
        type: 'date',
        required: true,
        description: 'End date (YYYY-MM-DD format)',
      },
    ],
  },
  {
    name: 'userInRole',
    displayName: 'userInRole(role)',
    description: 'Returns users with the specified role',
    parameters: [
      {
        name: 'role',
        type: 'text',
        required: true,
        description: 'User role (admin, manager, developer, etc.)',
      },
    ],
  },
  {
    name: 'projectsWithPrefix',
    displayName: 'projectsWithPrefix(prefix)',
    description: 'Returns projects that start with the given prefix',
    parameters: [
      {
        name: 'prefix',
        type: 'text',
        required: true,
        description: 'Project name prefix',
      },
    ],
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
  const [showSearchIcon, setShowSearchIcon] = useState(true);
  const [showClearIcon, setShowClearIcon] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('ql-demo-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('ql-dark');
    } else {
      document.documentElement.classList.remove('ql-dark');
    }
    localStorage.setItem('ql-demo-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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
    // New parameterized function examples
    'assignee = currentUser() AND created >= daysAgo(30)',
    'assignee = userInRole("admin") AND status = Open',
    'created >= daysAgo(7) AND updated <= daysFromNow(1)',
    'created = dateRange("2023-01-01", "2023-12-31")',
    'project = projectsWithPrefix("PROJ") AND assignee = currentUser()',
    'assignee IN (currentUser(), userInRole("manager")) AND priority = High',
    '(created >= daysAgo(30) AND assignee = currentUser()) OR priority = Highest',
  ];

  return (
    <div className='demo-section'>
      <div className='demo-header'>
        <div>
          <h2 className='demo-title'>QL Input & Parser</h2>
          <p className='demo-description'>
            A comprehensive QL (Query Language) input component with intelligent autocomplete and validation.
          </p>
        </div>
        <div className='demo-theme-toggle-container'>
          <span className='demo-theme-toggle-label'>Theme</span>
          <button
            className={`demo-theme-toggle ${isDarkMode ? 'demo-theme-toggle--dark' : 'demo-theme-toggle--light'}`}
            onClick={toggleDarkMode}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            <span className='demo-theme-toggle-slider'>
              <span className='demo-theme-toggle-icon'>
                {isDarkMode ? (
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <circle cx='12' cy='12' r='5' />
                    <path d='M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' />
                  </svg>
                ) : (
                  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
                  </svg>
                )}
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className='demo-section'>
        <div className='demo-form-group'>
          <div className='demo-label'>
            <label>QL Query</label>
            {parsedQuery && (
              <div className='demo-status'>
                <div
                  className={`demo-status-badge ${
                    parsedQuery.valid ? 'demo-status-badge--valid' : 'demo-status-badge--invalid'
                  }`}>
                  <div
                    className={`demo-status-dot ${
                      parsedQuery.valid ? 'demo-status-dot--valid' : 'demo-status-dot--invalid'
                    }`}
                  />
                  {parsedQuery.valid ? 'Valid' : 'Invalid'}
                </div>
                <span className='demo-status'>
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
            showSearchIcon={showSearchIcon}
            showClearIcon={showClearIcon}
          />
        </div>

        <div className='demo-controls'>
          <div className='demo-controls-group'>
            <span className='demo-controls-label'>Icon Visibility:</span>
            <label className='demo-checkbox'>
              <input type='checkbox' checked={showSearchIcon} onChange={(e) => setShowSearchIcon(e.target.checked)} />
              <span>Show Search Icon</span>
            </label>
            <label className='demo-checkbox'>
              <input type='checkbox' checked={showClearIcon} onChange={(e) => setShowClearIcon(e.target.checked)} />
              <span>Show Clear Icon</span>
            </label>
          </div>
        </div>

        <div className='demo-examples'>
          <span className='demo-examples-label'>Try these examples:</span>
          {sampleQueries.map((sampleQuery, index) => (
            <button key={index} className='demo-example-button' onClick={() => setQuery(sampleQuery)}>
              {sampleQuery}
            </button>
          ))}
        </div>
      </div>

      {parsedQuery && (
        <div className='demo-output-section'>
          <div>
            <h3 className='demo-output-title'>🌳 Query Structure</h3>
            <div className='demo-output-card demo-output-card--blue'>
              {parsedQuery.where ? (
                <div>
                  <p className='demo-output-description demo-output-description--blue'>
                    Hierarchical structure perfect for database queries! 🎯
                  </p>
                  <pre className='demo-output-pre demo-output-pre--blue'>{printExpression(parsedQuery.where)}</pre>
                </div>
              ) : (
                <p className='demo-output-description demo-output-description--blue'>
                  No hierarchical structure available (simple query)
                </p>
              )}
            </div>
          </div>

          {/* Database Query Conversion */}
          {parsedQuery.where && (
            <div>
              <h3 className='demo-output-title'>🔄 Database Query Conversion</h3>
              <div className='demo-grid demo-grid--2'>
                {/* Mongoose Query */}
                <div>
                  <h4 className='demo-output-title'>🍃 Mongoose Query</h4>
                  <div className='demo-output-card demo-output-card--green'>
                    <pre className='demo-output-pre demo-output-pre--green'>
                      {JSON.stringify(toMongooseQuery(parsedQuery.where), null, 2)}
                    </pre>
                  </div>
                </div>

                {/* SQL Query */}
                <div>
                  <h4 className='demo-output-title'>🗄️ SQL WHERE Clause</h4>
                  <div className='demo-output-card demo-output-card--purple'>
                    <pre className='demo-output-pre demo-output-pre--purple'>WHERE {toSQLQuery(parsedQuery.where)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Raw Parsed Query */}
          <div>
            <h3 className='demo-output-title'>📄 Complete Parsed Query</h3>
            <div className='demo-output-card demo-output-card--gray'>
              <pre className='demo-output-pre' data-testid='parse-result'>
                {JSON.stringify(parsedQuery, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {executedQuery && (
        <div className='demo-output-section'>
          <div>
            <h3 className='demo-output-title'>Executed Query</h3>
            <div className='demo-output-card demo-output-card--green'>
              <p className='demo-output-description demo-output-description--green'>Query executed successfully!</p>
              <pre className='demo-output-pre demo-output-pre--green'>{JSON.stringify(executedQuery, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <div className='demo-features-section'>
        <h3 className='demo-features-title'>Features Demonstrated</h3>
        <div className='demo-grid demo-grid--3'>
          <div className='demo-feature-group'>
            <h4 className='demo-feature-group-title'>✅ Core Features</h4>
            <ul className='demo-feature-list'>
              <li className='demo-feature-item'>• Context-aware autocomplete</li>
              <li className='demo-feature-item'>• Field, operator, and value suggestions</li>
              <li className='demo-feature-item'>• Parentheses grouping support</li>
              <li className='demo-feature-item'>• ORDER BY clause support</li>
              <li className='demo-feature-item'>• Query parsing and validation</li>
              <li className='demo-feature-item'>• Visual feedback for query status</li>
            </ul>
          </div>
          <div className='demo-feature-group'>
            <h4 className='demo-feature-group-title'>✅ Advanced Features</h4>
            <ul className='demo-feature-list'>
              <li className='demo-feature-item'>• Async value suggestions (users)</li>
              <li className='demo-feature-item'>• Function support (currentUser, now, etc.)</li>
              <li className='demo-feature-item'>• Debounced API calls</li>
              <li className='demo-feature-item'>• Dark mode support</li>
              <li className='demo-feature-item'>• Responsive design</li>
              <li className='demo-feature-item'>• Accessibility (ARIA attributes)</li>
            </ul>
          </div>
          <div className='demo-feature-group'>
            <h4 className='demo-feature-group-title'>⌨️ Keyboard Shortcuts</h4>
            <ul className='demo-feature-list'>
              <li className='demo-feature-item'>
                • <kbd className='demo-kbd'>↑↓</kbd> Navigate suggestions
              </li>
              <li className='demo-feature-item'>
                • <kbd className='demo-kbd'>Enter</kbd> Select suggestion
              </li>
              <li className='demo-feature-item'>
                • <kbd className='demo-kbd'>Tab</kbd> Accept suggestion
              </li>
              <li className='demo-feature-item'>
                • <kbd className='demo-kbd'>Esc</kbd> Close suggestions
              </li>
              <li className='demo-feature-item'>
                • <kbd className='demo-kbd'>Ctrl+Space</kbd> Trigger suggestions
              </li>
              <li className='demo-feature-item'>
                • <kbd className='demo-kbd'>Enter</kbd> Execute query (no suggestions)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* New Suggestion Behavior Documentation */}
      <div className='demo-section'>
        <h3 className='demo-features-title'>🎯 Smart Suggestion Behavior</h3>
        <div className='demo-output-card demo-output-card--blue'>
          <div className='demo-output-description demo-output-description--blue'>
            <p>
              <strong>Enhanced UX:</strong> Suggestions now behave more intelligently to avoid overwhelming you!
            </p>

            <div className='demo-grid demo-grid--2' style={{ marginTop: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--demo-text-primary)' }}>✨ What's New:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>
                    <strong>No automatic spaces:</strong> Selecting a suggestion doesn't add a space anymore
                  </li>
                  <li>
                    <strong>Manual control:</strong> Suggestions only appear after you type a space
                  </li>
                  <li>
                    <strong>Ctrl+Space shortcut:</strong> Instantly trigger suggestions anytime
                  </li>
                  <li>
                    <strong>Less intrusive:</strong> Focus on building your query without distractions
                  </li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--demo-text-primary)' }}>🎮 Try It:</h4>
                <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>
                    Type "pro" → select "project" → <em>no suggestions appear</em>
                  </li>
                  <li>Type a space → suggestions for operators appear</li>
                  <li>
                    Or press <kbd className='demo-kbd'>Ctrl+Space</kbd> anytime to see suggestions
                  </li>
                  <li>Continue building your query step by step!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with attribution */}
      <footer className='demo-footer'>
        <div className='demo-footer-content'>
          <p className='demo-footer-text'>
            Built with ❤️ by{' '}
            <a
              href='https://github.com/abaktiar'
              target='_blank'
              rel='noopener noreferrer'
              className='demo-footer-link'>
              abaktiar
            </a>
          </p>
          <p className='demo-footer-subtext'>Open source QL Input component for modern web applications</p>
        </div>
      </footer>
    </div>
  );
}
