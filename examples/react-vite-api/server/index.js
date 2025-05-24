import express from 'express';
import cors from 'cors';
import { QLParser, toMongooseQuery, toSQLQuery } from '@abaktiar/ql-parser';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockIssues = [
  {
    id: 1,
    title: 'Fix login bug',
    status: 'open',
    priority: 4,
    assignee: 'john.doe',
    project: 'project-alpha',
    tags: ['bug', 'critical'],
    created: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    title: 'Add user dashboard',
    status: 'in-progress',
    priority: 3,
    assignee: 'jane.smith',
    project: 'project-beta',
    tags: ['feature'],
    created: '2024-01-14T14:20:00Z'
  },
  {
    id: 3,
    title: 'Update documentation',
    status: 'pending',
    priority: 2,
    assignee: null,
    project: 'project-alpha',
    tags: ['documentation'],
    created: '2024-01-13T09:15:00Z'
  },
  {
    id: 4,
    title: 'Performance optimization',
    status: 'open',
    priority: 3,
    assignee: 'bob.wilson',
    project: 'project-gamma',
    tags: ['enhancement', 'performance'],
    created: '2024-01-12T16:45:00Z'
  },
  {
    id: 5,
    title: 'Security audit',
    status: 'closed',
    priority: 4,
    assignee: 'alice.brown',
    project: 'project-beta',
    tags: ['security', 'audit'],
    created: '2024-01-10T11:00:00Z'
  }
];

const mockUsers = [
  { value: 'john.doe', label: 'John Doe', email: 'john.doe@example.com' },
  { value: 'jane.smith', label: 'Jane Smith', email: 'jane.smith@example.com' },
  { value: 'bob.wilson', label: 'Bob Wilson', email: 'bob.wilson@example.com' },
  { value: 'alice.brown', label: 'Alice Brown', email: 'alice.brown@example.com' },
  { value: 'charlie.davis', label: 'Charlie Davis', email: 'charlie.davis@example.com' }
];

const mockProjects = [
  { value: 'project-alpha', label: 'Project Alpha', description: 'Main product development' },
  { value: 'project-beta', label: 'Project Beta', description: 'Mobile application' },
  { value: 'project-gamma', label: 'Project Gamma', description: 'Infrastructure improvements' }
];

// Field configuration for the parser
const fieldConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN']
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY']
    },
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN']
    },
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'number',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true
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
      operators: ['IN', 'NOT IN']
    }
  ],
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};

const parser = new QLParser(fieldConfig);

// Helper function to filter issues based on parsed query
function filterIssues(issues, query) {
  if (!query.where) return issues;

  return issues.filter(issue => {
    return evaluateExpression(issue, query.where);
  });
}

// Simple expression evaluator for demo purposes
function evaluateExpression(item, expression) {
  if (expression.type === 'condition') {
    const { field, operator, value } = expression;
    const itemValue = item[field];

    switch (operator) {
      case '=':
        return itemValue === value;
      case '!=':
        return itemValue !== value;
      case '>':
        return Number(itemValue) > Number(value);
      case '<':
        return Number(itemValue) < Number(value);
      case '>=':
        return Number(itemValue) >= Number(value);
      case '<=':
        return Number(itemValue) <= Number(value);
      case '~':
        return itemValue && itemValue.toLowerCase().includes(value.toLowerCase());
      case '!~':
        return !itemValue || !itemValue.toLowerCase().includes(value.toLowerCase());
      case 'IN':
        const values = Array.isArray(value) ? value : [value];
        return values.includes(itemValue);
      case 'NOT IN':
        const notValues = Array.isArray(value) ? value : [value];
        return !notValues.includes(itemValue);
      case 'IS EMPTY':
        return !itemValue || itemValue === '';
      case 'IS NOT EMPTY':
        return itemValue && itemValue !== '';
      default:
        return true;
    }
  } else if (expression.type === 'group') {
    const { operator, conditions } = expression;
    
    if (operator === 'AND') {
      return conditions.every(cond => evaluateExpression(item, cond));
    } else if (operator === 'OR') {
      return conditions.some(cond => evaluateExpression(item, cond));
    }
  }
  
  return true;
}

// API Routes

// Get all issues
app.get('/api/issues', (req, res) => {
  res.json({
    success: true,
    data: mockIssues,
    total: mockIssues.length
  });
});

// Search issues with QL query
app.post('/api/issues/search', (req, res) => {
  try {
    const { query: queryString } = req.body;
    
    if (!queryString) {
      return res.json({
        success: true,
        data: mockIssues,
        total: mockIssues.length,
        query: null
      });
    }

    // Parse the query
    const parsedQuery = parser.parse(queryString);
    
    if (!parsedQuery.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query',
        errors: parsedQuery.errors
      });
    }

    // Filter issues based on the query
    let filteredIssues = filterIssues(mockIssues, parsedQuery);

    // Apply sorting if specified
    if (parsedQuery.orderBy && parsedQuery.orderBy.length > 0) {
      filteredIssues.sort((a, b) => {
        for (const order of parsedQuery.orderBy) {
          const { field, direction } = order;
          const aVal = a[field];
          const bVal = b[field];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          if (comparison !== 0) {
            return direction === 'DESC' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    res.json({
      success: true,
      data: filteredIssues,
      total: filteredIssues.length,
      query: {
        raw: queryString,
        parsed: parsedQuery,
        mongodb: toMongooseQuery(parsedQuery),
        sql: toSQLQuery(parsedQuery)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
});

// Get user suggestions
app.get('/api/suggestions/users', (req, res) => {
  const { q } = req.query;
  
  let users = mockUsers;
  
  if (q) {
    const query = q.toLowerCase();
    users = mockUsers.filter(user => 
      user.label.toLowerCase().includes(query) ||
      user.value.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }
  
  res.json({
    success: true,
    data: users.map(user => ({
      value: user.value,
      label: user.label
    }))
  });
});

// Get project suggestions
app.get('/api/suggestions/projects', (req, res) => {
  const { q } = req.query;
  
  let projects = mockProjects;
  
  if (q) {
    const query = q.toLowerCase();
    projects = mockProjects.filter(project => 
      project.label.toLowerCase().includes(query) ||
      project.value.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query)
    );
  }
  
  res.json({
    success: true,
    data: projects.map(project => ({
      value: project.value,
      label: project.label
    }))
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'QL Input API Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 QL Input API Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/issues`);
  console.log(`   POST /api/issues/search`);
  console.log(`   GET  /api/suggestions/users`);
  console.log(`   GET  /api/suggestions/projects`);
});
