/**
 * Test data and fixtures for QL Input tests
 */

export const testQueries = {
  simple: {
    valid: ['project = PROJ1', 'status = Open', 'assignee = john.doe', 'priority = High'],
    invalid: ['project =', 'status Open', '= PROJ1', 'project = = PROJ1'],
  },

  operators: {
    equality: ['project = PROJ1', 'project != PROJ2'],
    comparison: ['priority > 3', 'priority < 5', 'priority >= 3', 'priority <= 5'],
    text: ['summary ~ "bug"', 'summary !~ "feature"'],
    list: ['project IN (PROJ1, PROJ2)', 'status NOT IN (Done, Closed)'],
    empty: ['assignee IS EMPTY', 'assignee IS NOT EMPTY'],
  },

  logical: {
    and: ['project = PROJ1 AND status = Open', 'project = PROJ1 AND status = Open AND priority = High'],
    or: ['project = PROJ1 OR project = PROJ2', 'status = Open OR status = "In Progress"'],
    not: ['NOT project = PROJ1', 'project = PROJ1 AND NOT status = Done'],
    complex: [
      '(project = PROJ1 OR project = PROJ2) AND status = Open',
      'project = PROJ1 AND (status = Open OR status = "In Progress")',
      '(project = PROJ1 AND status = Open) OR (project = PROJ2 AND priority = High)',
      '(project = PROJ1 AND (status = Open OR priority > 2)) OR assignee = currentUser()',
      'NOT (project = PROJ1 AND status = Open)',
      'NOT (project = PROJ1 OR project = PROJ2 OR project = PROJ3)',
      '((project = PROJ1 AND status = Open) OR (assignee = "jane.doe" AND priority < 3)) AND created >= startOfWeek()',
      'NOT ((project = PROJ1 AND status = Open) OR (assignee = "jane.doe"))',
    ],
    invalid: [
      '(project = PROJ1 AND status = Open', // Mismatched parentheses
      'project = PROJ1 AND', // Incomplete logical expression
      'project = PROJ1 OR', // Incomplete logical expression
      'NOT', // Incomplete NOT
      'project = NOT Open', // Invalid NOT usage (parser expects NOT at start of condition/group)
      'project = PROJ1 AND OR status = Open', // Double logical operator
      'AND project = PROJ1', // Leading logical operator
      '(project = PROJ1 (status = Open))', // Missing logical operator
    ],
  },

  inOperator: {
    simple: ['project IN (PROJ1)', 'project IN (PROJ1, PROJ2)', 'status IN (Open, "In Progress", Done)'],
    withSpaces: ['status IN ("In Progress", "Code Review")', 'project IN ("Project Alpha", "Project Beta")'],
    mixed: ['project IN (PROJ1, "Project Alpha", PROJ2)', 'status IN (Open, "In Progress", Closed)'],
  },

  orderBy: {
    simple: [
      'project = PROJ1 ORDER BY priority',
      'status = Open ORDER BY created',
      'assignee = john.doe ORDER BY updated DESC',
      'ORDER BY priority', // ORDER BY without WHERE
      'ORDER BY created DESC', // ORDER BY without WHERE
      'project = PROJ1 order by priority desc', // Mixed case
      'ORDER by status aSc, updated DeSc', // Mixed case without WHERE
    ],
    multiple: [
      'project = PROJ1 ORDER BY priority ASC, created DESC',
      'status = Open ORDER BY assignee, priority DESC, created',
      'ORDER BY priority ASC, created DESC', // ORDER BY without WHERE
    ],
    invalid: [
      'ORDER BY nonExistentField',
      'ORDER BY priority ASC,',
      'ORDER BY priority WRONGDIR',
      'project = PROJ1 ORDER BY priority WRONGDIR',
      'ORDER BY priority, nonExistentField DESC',
      'ORDER BY ,priority',
    ],
  },

  functions: {
    valid: [
      'assignee = currentUser()',
      'created >= startOfWeek()',
      'updated <= endOfDay()',
      'project IN (currentUser(), "PROJ1")',
      'status IN (currentUser(), "Open", "Closed") AND assignee = currentUser()', // Assuming currentUser() could return a status
    ],
    invalid: [
      'assignee = nonExistentFunction()',
      'assignee = currentUser(',
      'assignee = currentUser(extraParam)',
      'project IN (nonExistentFunction(), "PROJ1")',
      'created = startOfWeek(1, 2)',
    ],
  },

  multiWord: {
    quoted: ['status = "In Progress"', 'project = "Project Alpha"', 'summary ~ "Bug Report"'],
    inLists: ['status IN ("In Progress", "Code Review")', 'project IN ("Project Alpha", "Project Beta", PROJ1)'],
  },

  whitespace: {
    valid: [
      '  project = PROJ1  ',
      'project  =  PROJ1',
      'project =   PROJ1',
      '  (  project = PROJ1   AND status = Open )  ',
      'project IN (  PROJ1  ,  PROJ2  )',
      '  ORDER   BY  priority   DESC  ',
    ],
  },

  edgeCases: {
    valid: [
      'project = PROJ1 AND status = Open AND assignee = "john.doe" AND priority = High AND summary ~ "test" AND created >= "2023-01-01" AND updated < "2024-01-01"', // All field types
      'PROJECT = PROJ1 AND STATUS = OPEN', // Case insensitivity for fields/values (parser handles this)
      'order = "test" AND by = "test2"', // Using keywords as field names (if quoted or parser allows)
      'summary = "value with (parentheses)"',
      'summary = "value with \\"escaped quotes\\""',
    ],
    invalid: [
      'project IN ()',
      'project IN (,)',
      'project IN (PROJ1,)',
      'project IN (,PROJ1)',
      'project = "unterminated string',
      'project = \'unterminated string',
      '(project = PROJ1', // Mismatched parentheses (already in logical.invalid but good here too)
      'project = PROJ1) AND status = Open', // Mismatched parentheses
      // 'ORDER = "value"', // Using keyword as unquoted field - parser's classifyTokens might misinterpret
      // 'BY = "value"', // Using keyword as unquoted field
    ],
  },
};

export const testFields = [
  {
    name: 'project',
    displayName: 'Project',
    type: 'option' as const,
    operators: ['=', '!=', 'IN', 'NOT IN'],
    options: [
      { value: 'PROJ1', displayValue: 'Project Alpha' },
      { value: 'PROJ2', displayValue: 'Project Beta' },
      { value: 'PROJ3', displayValue: 'Project Gamma' },
    ],
  },
  {
    name: 'status',
    displayName: 'Status',
    type: 'option' as const,
    operators: ['=', '!=', 'IN', 'NOT IN'],
    options: [
      { value: 'Open', displayValue: 'Open' },
      { value: 'In Progress', displayValue: 'In Progress' },
      { value: 'Code Review', displayValue: 'Code Review' },
      { value: 'Done', displayValue: 'Done' },
      { value: 'Closed', displayValue: 'Closed' },
    ],
  },
  {
    name: 'assignee',
    displayName: 'Assignee',
    type: 'user' as const,
    operators: ['=', '!=', 'IN', 'NOT IN', 'IS EMPTY', 'IS NOT EMPTY'],
    options: [
      { value: 'john.doe', displayValue: 'John Doe' },
      { value: 'jane.smith', displayValue: 'Jane Smith' },
      { value: 'bob.wilson', displayValue: 'Bob Wilson' },
    ],
  },
  {
    name: 'priority',
    displayName: 'Priority',
    type: 'number' as const,
    operators: ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN'],
    options: [
      { value: 'Low', displayValue: 'Low' },
      { value: 'Medium', displayValue: 'Medium' },
      { value: 'High', displayValue: 'High' },
      { value: 'Critical', displayValue: 'Critical' },
    ],
  },
  {
    name: 'summary',
    displayName: 'Summary',
    type: 'text' as const,
    operators: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY'],
  },
  {
    name: 'created',
    displayName: 'Created',
    type: 'date' as const,
    operators: ['=', '!=', '>', '<', '>=', '<='],
    sortable: true,
  },
  {
    name: 'updated',
    displayName: 'Updated',
    type: 'date' as const,
    operators: ['=', '!=', '>', '<', '>=', '<='],
    sortable: true,
  },
];

export const testFunctions = [
  { name: 'currentUser', displayName: 'currentUser()', description: 'Current logged in user' },
  { name: 'startOfWeek', displayName: 'startOfWeek()', description: 'Start of current week' },
  { name: 'endOfWeek', displayName: 'endOfWeek()', description: 'End of current week' },
  { name: 'startOfMonth', displayName: 'startOfMonth()', description: 'Start of current month' },
  { name: 'endOfMonth', displayName: 'endOfMonth()', description: 'End of current month' },
  { name: 'now', displayName: 'now()', description: 'Current date and time' },
];

export const expectedSuggestions = {
  fields: ['project', 'status', 'assignee', 'priority', 'summary', 'created', 'updated'],
  operators: {
    project: ['=', '!=', 'IN', 'NOT IN'],
    status: ['=', '!=', 'IN', 'NOT IN'],
    assignee: ['=', '!=', 'IN', 'NOT IN', 'IS EMPTY', 'IS NOT EMPTY'],
    priority: ['=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT IN'],
    summary: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY'],
    created: ['=', '!=', '>', '<', '>=', '<='],
    updated: ['=', '!=', '>', '<', '>=', '<='],
  },
  values: {
    project: ['PROJ1', 'PROJ2', 'PROJ3'],
    status: ['Open', 'In Progress', 'Code Review', 'Done', 'Closed'],
    assignee: ['john.doe', 'jane.smith', 'bob.wilson'],
    priority: ['Low', 'Medium', 'High', 'Critical'],
  },
  logical: ['AND', 'OR', 'NOT'],
  functions: ['currentUser()', 'startOfWeek()', 'endOfWeek()', 'startOfMonth()', 'endOfMonth()', 'now()'],
};
