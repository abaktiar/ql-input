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
    ],
  },

  inOperator: {
    simple: ['project IN (PROJ1)', 'project IN (PROJ1, PROJ2)', 'status IN (Open, "In Progress", Done)'],
    withSpaces: ['status IN ("In Progress", "Code Review")', 'project IN ("Project Alpha", "Project Beta")'],
    mixed: ['project IN (PROJ1, "Project Alpha", PROJ2)', 'status IN (Open, "In Progress", Closed)'],
  },

  // Note: ORDER BY is not currently implemented in the parser
  // orderBy: {
  //   simple: [
  //     'project = PROJ1 ORDER BY priority',
  //     'status = Open ORDER BY created',
  //     'assignee = john.doe ORDER BY updated DESC',
  //   ],
  //   multiple: [
  //     'project = PROJ1 ORDER BY priority ASC, created DESC',
  //     'status = Open ORDER BY assignee, priority DESC, created',
  //   ],
  // },

  functions: [
    'assignee = currentUser()',
    'created >= startOfWeek()',
    'updated <= endOfDay()',
    'project IN (currentUser(), "PROJ1")',
  ],

  multiWord: {
    quoted: ['status = "In Progress"', 'project = "Project Alpha"', 'summary ~ "Bug Report"'],
    inLists: ['status IN ("In Progress", "Code Review")', 'project IN ("Project Alpha", "Project Beta", PROJ1)'],
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
