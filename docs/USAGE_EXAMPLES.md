# QL Input Component - Usage Examples

## 🚀 **Quick Start**

### **Basic Implementation**

```tsx
import React, { useState } from 'react';
import { QLInput } from './components/ql-input';

function App() {
  const [query, setQuery] = useState('');

  const config = {
    fields: [
      {
        name: 'project',
        displayName: 'Project',
        type: 'option' as const,
        operators: ['=', '!=', 'IN', 'NOT IN'],
        options: [
          { value: 'PROJ1', displayValue: 'Project Alpha' },
          { value: 'PROJ2', displayValue: 'Project Beta' },
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
          { value: 'Done', displayValue: 'Done' },
        ],
      },
    ],
    functions: [
      {
        name: 'currentUser',
        displayName: 'Current User',
        description: 'Returns the current logged-in user',
        returnType: 'string',
      },
    ],
    maxSuggestions: 10,
    allowParentheses: true,
    allowOrderBy: true,
    allowFunctions: true,
  };

  const handleQueryChange = (value: string, parsedQuery: QLQuery) => {
    setQuery(value);

    if (parsedQuery.valid) {
      console.log('Valid query:', parsedQuery);
      // Convert to your backend query format
      const backendQuery = convertToBackendQuery(parsedQuery);
      // Execute search...
    } else {
      console.log('Invalid query:', parsedQuery.errors);
    }
  };

  return (
    <QLInput
      value={query}
      onChange={handleQueryChange}
      config={config}
      placeholder="Search issues... (e.g., project = PROJ1 AND status = Open)"
      showSearchIcon={true}  // Optional: default is true
      showClearIcon={true}   // Optional: default is true
    />
  );
}
```

---

## 📝 **Query Examples by Use Case**

### **1. Issue Tracking System**

```sql
-- Find open issues in specific projects
project IN (PROJ1, PROJ2) AND status = Open

-- Find high priority issues assigned to current user
priority = High AND assignee = currentUser()

-- Find issues created this week, ordered by priority
created >= startOfWeek() ORDER BY priority DESC, created ASC

-- Find issues NOT in done status
NOT status = Done

-- Complex query with parentheses
(project = PROJ1 OR project = PROJ2) AND status != Done AND priority IN (High, Medium)
```

### **2. Customer Support System**

```sql
-- Find urgent tickets
priority = Urgent AND status IN (Open, "In Progress")

-- Find tickets assigned to specific agents
assignee IN (john.doe, jane.smith) AND status != Closed

-- Find escalated tickets from last month
escalated = true AND created >= startOfMonth() ORDER BY created DESC

-- Find tickets with specific categories
category IN (Bug, "Feature Request", Support) AND status = Open
```

### **3. Project Management**

```sql
-- Find overdue tasks
dueDate < now() AND status != Completed

-- Find tasks for current sprint
sprint = "Sprint 23" AND assignee = currentUser()

-- Find blocked tasks
status = Blocked ORDER BY priority DESC, created ASC

-- Find tasks by multiple criteria
(priority = High OR priority = Critical) AND assignee != unassigned AND status IN (Open, "In Progress")
```

### **4. E-commerce Orders**

```sql
-- Find recent orders
status IN (Pending, Processing) AND created >= startOfDay()

-- Find orders by customer
customer = "john.doe@example.com" ORDER BY created DESC

-- Find high-value orders
total > 1000 AND status != Cancelled

-- Find orders needing attention
(status = "Payment Failed" OR status = "Shipping Delayed") AND created >= startOfWeek()
```

---

## 🔧 **Converting to Backend Queries**

### **MongoDB/Mongoose Example**

```typescript
function convertToMongoQuery(qlQuery: QLQuery) {
  const mongoQuery: any = {};

  if (qlQuery.where) {
    mongoQuery.where = convertExpression(qlQuery.where);
  }

  if (qlQuery.orderBy && qlQuery.orderBy.length > 0) {
    mongoQuery.sort = {};
    qlQuery.orderBy.forEach(order => {
      mongoQuery.sort[order.field] = order.direction === 'DESC' ? -1 : 1;
    });
  }

  return mongoQuery;
}

function convertExpression(expr: QLExpression): any {
  if ('conditions' in expr) {
    // Logical group
    const operator = expr.operator === 'AND' ? '$and' : '$or';
    return {
      [operator]: expr.conditions.map(convertExpression)
    };
  } else {
    // Single condition
    const condition: any = {};

    switch (expr.operator) {
      case '=':
        condition[expr.field] = expr.value;
        break;
      case '!=':
        condition[expr.field] = { $ne: expr.value };
        break;
      case 'IN':
        condition[expr.field] = { $in: expr.value };
        break;
      case 'NOT IN':
        condition[expr.field] = { $nin: expr.value };
        break;
    }

    if (expr.not) {
      return { $not: condition };
    }

    return condition;
  }
}

// Usage
const qlQuery = parser.parse('project IN (PROJ1, PROJ2) AND status = Open');
const mongoQuery = convertToMongoQuery(qlQuery);
// Result: { where: { $and: [{ project: { $in: ['PROJ1', 'PROJ2'] } }, { status: 'Open' }] } }
```

### **SQL Example**

```typescript
function convertToSQL(qlQuery: QLQuery): { sql: string; params: any[] } {
  let sql = 'SELECT * FROM issues';
  const params: any[] = [];

  if (qlQuery.where) {
    const { clause, whereParams } = convertExpressionToSQL(qlQuery.where);
    sql += ` WHERE ${clause}`;
    params.push(...whereParams);
  }

  if (qlQuery.orderBy && qlQuery.orderBy.length > 0) {
    const orderClauses = qlQuery.orderBy.map(order =>
      `${order.field} ${order.direction}`
    );
    sql += ` ORDER BY ${orderClauses.join(', ')}`;
  }

  return { sql, params };
}

function convertExpressionToSQL(expr: QLExpression): { clause: string; whereParams: any[] } {
  const params: any[] = [];

  if ('conditions' in expr) {
    // Logical group
    const subclauses = expr.conditions.map(condition => {
      const { clause, whereParams } = convertExpressionToSQL(condition);
      params.push(...whereParams);
      return clause;
    });

    const operator = expr.operator === 'AND' ? ' AND ' : ' OR ';
    let clause = `(${subclauses.join(operator)})`;

    if (expr.not) {
      clause = `NOT ${clause}`;
    }

    return { clause, whereParams: params };
  } else {
    // Single condition
    let clause = '';

    switch (expr.operator) {
      case '=':
        clause = `${expr.field} = ?`;
        params.push(expr.value);
        break;
      case '!=':
        clause = `${expr.field} != ?`;
        params.push(expr.value);
        break;
      case 'IN':
        const placeholders = (expr.value as string[]).map(() => '?').join(', ');
        clause = `${expr.field} IN (${placeholders})`;
        params.push(...(expr.value as string[]));
        break;
      case 'NOT IN':
        const notPlaceholders = (expr.value as string[]).map(() => '?').join(', ');
        clause = `${expr.field} NOT IN (${notPlaceholders})`;
        params.push(...(expr.value as string[]));
        break;
    }

    if (expr.not) {
      clause = `NOT (${clause})`;
    }

    return { clause, whereParams: params };
  }
}

// Usage
const qlQuery = parser.parse('project = PROJ1 AND status IN (Open, "In Progress") ORDER BY priority DESC');
const { sql, params } = convertToSQL(qlQuery);
// Result:
// sql: "SELECT * FROM issues WHERE (project = ? AND status IN (?, ?)) ORDER BY priority DESC"
// params: ["PROJ1", "Open", "In Progress"]
```

---

## 🎨 **Styling and Customization**

### **CSS Custom Properties**

```css
.ql-input {
  --ql-border-color: #d1d5db;
  --ql-border-radius: 8px;
  --ql-focus-color: #3b82f6;
  --ql-suggestion-bg: #ffffff;
  --ql-suggestion-hover: #f3f4f6;
  --ql-suggestion-selected: #dbeafe;
  --ql-error-color: #ef4444;
  --ql-valid-color: #10b981;
}

/* Dark theme */
.ql-input.dark {
  --ql-border-color: #374151;
  --ql-suggestion-bg: #1f2937;
  --ql-suggestion-hover: #374151;
  --ql-suggestion-selected: #1e40af;
}
```

### **Icon Customization**

```tsx
// Minimal design without search icon
<QLInput
  value={query}
  onChange={handleQueryChange}
  config={config}
  showSearchIcon={false}
  placeholder="Enter query..."
/>

// Prevent accidental clearing
<QLInput
  value={query}
  onChange={handleQueryChange}
  config={config}
  showClearIcon={false}
  placeholder="Enter query..."
/>

// Ultra-minimal design
<QLInput
  value={query}
  onChange={handleQueryChange}
  config={config}
  showSearchIcon={false}
  showClearIcon={false}
  placeholder="Enter query..."
/>
```

### **Custom Styling Example**

```tsx
<QLInput
  value={query}
  onChange={handleQueryChange}
  config={config}
  className="my-custom-ql-input"
  showSearchIcon={true}
  showClearIcon={true}
  style={{
    minHeight: '40px',
    fontSize: '14px',
    fontFamily: 'Monaco, monospace'
  }}
/>
```

---

## 🧪 **Testing Your Implementation**

### **Unit Testing**

```typescript
import { QLParser } from './ql-parser';

describe('My QL Implementation', () => {
  const parser = new QLParser(myConfig);

  test('should parse my specific queries', () => {
    const result = parser.parse('project = PROJ1 AND status = Open');

    expect(result.valid).toBe(true);
    expect(result.where.operator).toBe('AND');
    expect(result.where.conditions).toHaveLength(2);
  });

  test('should handle my custom fields', () => {
    const result = parser.parse('customField = "custom value"');

    expect(result.valid).toBe(true);
    expect(result.where.field).toBe('customField');
    expect(result.where.value).toBe('custom value');
  });
});
```

### **Integration Testing**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { QLInput } from './ql-input';

test('should build query through user interaction', async () => {
  const handleChange = jest.fn();

  render(
    <QLInput
      value=""
      onChange={handleChange}
      config={myConfig}
    />
  );

  const input = screen.getByRole('textbox');

  // Type and select suggestions
  fireEvent.change(input, { target: { value: 'proj' } });
  fireEvent.click(screen.getByText('project'));
  fireEvent.click(screen.getByText('='));
  fireEvent.click(screen.getByText('PROJ1'));

  expect(handleChange).toHaveBeenCalledWith(
    'project = PROJ1 ',
    expect.objectContaining({
      valid: true,
      where: expect.objectContaining({
        field: 'project',
        operator: '=',
        value: 'PROJ1'
      })
    })
  );
});
```

---

## 🎯 **Best Practices**

### **1. Configuration**
- ✅ Define clear field names and display names
- ✅ Specify appropriate operators for each field type
- ✅ Provide meaningful option values and display values
- ✅ Include helpful function descriptions

### **2. Error Handling**
- ✅ Always check `parsedQuery.valid` before using the result
- ✅ Display error messages to users for invalid queries
- ✅ Provide query examples and help text

### **3. Performance**
- ✅ Limit `maxSuggestions` to reasonable numbers (5-15)
- ✅ Use debouncing for async value suggestions
- ✅ Cache parsed results when possible

### **4. User Experience**
- ✅ Provide clear placeholder text with examples
- ✅ Show keyboard shortcuts and help
- ✅ Implement proper focus management
- ✅ Support both mouse and keyboard interaction

---

## 🚀 **Ready to Use!**

The QL Input component is now fully functional and ready for production use. Start with the basic implementation above and customize it for your specific needs. The comprehensive test suite ensures reliability, and the flexible configuration system allows for easy adaptation to any domain.
