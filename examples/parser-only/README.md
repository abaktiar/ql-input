# Parser Only Example

This example demonstrates how to use `@abaktiar/ql-parser` in a Node.js environment without any UI framework dependencies.

**🌐 [Live Demo](https://ql-input.netlify.app/)** - See the parser in action with the React component!

## 🎯 What This Example Shows

- Basic query parsing and validation
- Converting queries to MongoDB and SQL formats
- Tokenization and error handling
- Working with different field types and operators
- Complex queries with parentheses and ORDER BY clauses

## 📦 Installation

```bash
cd examples/parser-only
npm install
```

## 🚀 Running the Example

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## 📋 Example Queries

The demo includes these example queries:

1. **Simple condition**: `status = "open"`
2. **Function usage**: `status = "open" AND assignee = currentUser()`
3. **Complex grouping**: `(status = "open" OR status = "pending") AND priority >= 3`
4. **Text search**: `title ~ "urgent" AND created >= startOfWeek()`
5. **Empty checks**: `assignee IS EMPTY AND priority = 4`
6. **List operations**: `tags IN ("bug", "critical") ORDER BY created DESC`
7. **Advanced query**: `status IN ("open", "pending") AND (assignee = currentUser() OR assignee IS EMPTY) ORDER BY priority DESC, created ASC`

## 🔧 Key Features Demonstrated

### Query Parsing
```javascript
const query = parser.parse('status = "open" AND priority >= 3');
console.log(query.valid); // true/false
console.log(query.errors); // Array of error messages
```

### Query Conversion
```javascript
// Convert to MongoDB query
const mongoQuery = toMongooseQuery(query);

// Convert to SQL WHERE clause
const sqlQuery = toSQLQuery(query);

// Get readable expression
const readable = printExpression(query.where);

// Count conditions
const count = countConditions(query);
```

### Tokenization
```javascript
const tokens = parser.tokenize('status = "open"');
// Returns array of tokens with type, value, and position
```

### Error Handling
```javascript
const result = parser.parse('invalid query');
if (!result.valid) {
  console.log('Errors:', result.errors);
}
```

## 🏗️ Field Configuration

The example uses a comprehensive field configuration:

```javascript
const config = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [/* ... */]
    },
    // ... more fields
  ],
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};
```

## 📊 Expected Output

When you run the example, you'll see:

- ✅ Query validation results
- 📊 Condition counts
- 🔍 Readable expressions
- 📈 ORDER BY clauses
- 🍃 MongoDB query objects
- 🗄️ SQL WHERE clauses
- 🔧 Token breakdown
- 🚨 Error handling examples

## 🔗 Integration Ideas

This parser can be integrated into:

- **Backend APIs** - Parse user queries for database operations
- **CLI tools** - Command-line query interfaces
- **Data processing** - ETL pipelines with query-based filtering
- **Configuration files** - Query-based configuration systems
- **Testing frameworks** - Query-based test data filtering

## 📚 Next Steps

- Check out the [React Component Example](../react-component/) for UI integration
- See the [React + Vite + API Example](../react-vite-api/) for full-stack usage
- Read the [Parser Documentation](../../README-parser.md) for complete API reference
- Explore the [Development Guide](../../docs/DEVELOPMENT.md) for advanced patterns
