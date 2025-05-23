/**
 * Test configuration and constants
 */

export const TEST_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 30000,
  SUGGESTION_TIMEOUT: 5000,
  TYPING_DELAY: 50,
  SLOW_TYPING_DELAY: 100,
  
  // Retry configuration
  RETRIES: process.env.CI ? 2 : 0,
  
  // Screenshot configuration
  SCREENSHOT_ON_FAILURE: true,
  SCREENSHOT_DIR: 'test-results/screenshots',
  
  // Test data limits
  MAX_SUGGESTIONS: 10,
  MAX_QUERY_LENGTH: 1000,
  
  // Browser configuration
  HEADLESS: !process.env.HEADED,
  SLOW_MO: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
  
  // Base URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:5173',
  
  // Test categories
  CATEGORIES: {
    UNIT: 'unit',
    INTEGRATION: 'integration',
    E2E: 'e2e',
  },
  
  // Test tags
  TAGS: {
    SMOKE: '@smoke',
    REGRESSION: '@regression',
    CRITICAL: '@critical',
    SLOW: '@slow',
  },
};

export const SELECTORS = {
  QL_INPUT: '[data-testid="ql-input"]',
  SUGGESTIONS_LIST: '[data-testid="suggestions-list"]',
  SUGGESTION_ITEM: '[data-testid="suggestion-item"]',
  PARSE_RESULT: '[data-testid="parse-result"]',
};

export const TEST_QUERIES = {
  SIMPLE: [
    'project = PROJ1',
    'status = Open',
    'assignee = john.doe',
  ],
  COMPLEX: [
    'project = PROJ1 AND status = Open',
    'project IN (PROJ1, PROJ2) AND status = "In Progress"',
    '(project = PROJ1 OR project = PROJ2) AND assignee = currentUser()',
  ],
  INVALID: [
    'project =',
    'status Open',
    '= PROJ1',
    'project = = PROJ1',
  ],
};

export const EXPECTED_SUGGESTIONS = {
  FIELDS: ['project', 'status', 'assignee', 'priority', 'summary', 'created', 'updated'],
  OPERATORS: {
    EQUALITY: ['=', '!='],
    COMPARISON: ['>', '<', '>=', '<='],
    TEXT: ['~', '!~'],
    LIST: ['IN', 'NOT IN'],
    EMPTY: ['IS EMPTY', 'IS NOT EMPTY'],
  },
  LOGICAL: ['AND', 'OR', 'NOT'],
  FUNCTIONS: ['currentUser()', 'startOfWeek()', 'endOfWeek()'],
};
