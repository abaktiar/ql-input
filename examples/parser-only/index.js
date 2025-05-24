import { QLParser, toMongooseQuery, toSQLQuery, printExpression, countConditions } from '@abaktiar/ql-parser';

// Define field configuration
const config = {
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
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY']
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
      operators: ['IN', 'NOT IN'],
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'feature', label: 'Feature' },
        { value: 'enhancement', label: 'Enhancement' }
      ]
    }
  ],
  maxSuggestions: 10,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};

// Create parser instance
const parser = new QLParser(config);

// Example queries to test
const testQueries = [
  'status = "open"',
  'status = "open" AND assignee = currentUser()',
  '(status = "open" OR status = "pending") AND priority >= 3',
  'title ~ "urgent" AND created >= startOfWeek()',
  'assignee IS EMPTY AND priority = 4',
  'tags IN ("bug", "critical") ORDER BY created DESC',
  'status IN ("open", "pending") AND (assignee = currentUser() OR assignee IS EMPTY) ORDER BY priority DESC, created ASC'
];

console.log('🚀 QL Parser Examples\n');
console.log('=' .repeat(80));

testQueries.forEach((queryString, index) => {
  console.log(`\n📝 Example ${index + 1}: ${queryString}`);
  console.log('-'.repeat(60));
  
  try {
    // Parse the query
    const query = parser.parse(queryString);
    
    if (query.valid) {
      console.log('✅ Query is valid');
      console.log(`📊 Condition count: ${countConditions(query)}`);
      
      // Print readable expression
      if (query.where) {
        console.log(`🔍 Expression: ${printExpression(query.where)}`);
      }
      
      // Show ORDER BY if present
      if (query.orderBy && query.orderBy.length > 0) {
        const orderByStr = query.orderBy
          .map(order => `${order.field} ${order.direction}`)
          .join(', ');
        console.log(`📈 Order by: ${orderByStr}`);
      }
      
      // Convert to MongoDB query
      try {
        const mongoQuery = toMongooseQuery(query);
        console.log('🍃 MongoDB query:', JSON.stringify(mongoQuery, null, 2));
      } catch (error) {
        console.log('❌ MongoDB conversion error:', error.message);
      }
      
      // Convert to SQL query
      try {
        const sqlQuery = toSQLQuery(query);
        console.log('🗄️  SQL query:', sqlQuery);
      } catch (error) {
        console.log('❌ SQL conversion error:', error.message);
      }
      
    } else {
      console.log('❌ Query is invalid');
      console.log('🚨 Errors:', query.errors.join(', '));
    }
    
  } catch (error) {
    console.log('💥 Parse error:', error.message);
  }
});

console.log('\n' + '='.repeat(80));
console.log('🎉 All examples completed!');

// Demonstrate tokenization
console.log('\n🔧 Tokenization Example');
console.log('-'.repeat(40));
const sampleQuery = 'status = "open" AND priority >= 3';
const tokens = parser.tokenize(sampleQuery);

console.log(`Query: ${sampleQuery}`);
console.log('Tokens:');
tokens.forEach((token, index) => {
  console.log(`  ${index + 1}. ${token.type}: "${token.value}" (${token.start}-${token.end})`);
});

// Demonstrate error handling
console.log('\n🚨 Error Handling Example');
console.log('-'.repeat(40));
const invalidQuery = 'status = AND priority';
const errorResult = parser.parse(invalidQuery);

console.log(`Invalid query: ${invalidQuery}`);
console.log(`Valid: ${errorResult.valid}`);
console.log(`Errors: ${errorResult.errors.join(', ')}`);
