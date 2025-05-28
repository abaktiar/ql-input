import { test, expect } from '@playwright/test';
import { QLParser } from '../../src/lib/ql-parser';
import { testFields } from '../fixtures/test-data';
import type { QLInputConfig } from '../../src/lib/ql-types';

/**
 * Comprehensive tests for parameterized function support in QL Parser
 */
test.describe('QL Parser - Parameterized Functions', () => {
  let parser: QLParser;
  let config: QLInputConfig;

  test.beforeEach(() => {
    config = {
      fields: testFields,
      maxSuggestions: 10,
      caseSensitive: false,
      allowParentheses: true,
      allowOrderBy: true,
      allowFunctions: true,
      functions: [
        {
          name: 'currentUser',
          displayName: 'currentUser()',
          description: 'Current logged in user',
        },
        {
          name: 'daysAgo',
          displayName: 'daysAgo()',
          description: 'Date N days ago',
          parameters: [{
            name: 'days',
            type: 'number',
            required: true,
            description: 'Number of days'
          }]
        },
        {
          name: 'dateRange',
          displayName: 'dateRange()',
          description: 'Date range between two dates',
          parameters: [
            {
              name: 'startDate',
              type: 'date',
              required: true,
              description: 'Start date'
            },
            {
              name: 'endDate',
              type: 'date',
              required: true,
              description: 'End date'
            }
          ]
        },
        {
          name: 'userInRole',
          displayName: 'userInRole()',
          description: 'User with specific role',
          parameters: [{
            name: 'role',
            type: 'text',
            required: true,
            description: 'User role'
          }]
        },
        {
          name: 'nested',
          displayName: 'nested()',
          description: 'Function that takes another function as parameter',
          parameters: [{
            name: 'innerFunction',
            type: 'text',
            required: true,
            description: 'Inner function call'
          }]
        }
      ]
    };
    parser = new QLParser(config);
  });

  test.describe('Function Tokenization', () => {
    test('should tokenize parameterless functions correctly', () => {
      const tokens = parser.tokenize('assignee = currentUser()');
      
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'value', // Function names get classified as values in context
        value: 'currentUser' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'parenthesis', 
        value: '(' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'parenthesis', 
        value: ')' 
      }));
    });

    test('should tokenize functions with single parameter', () => {
      const tokens = parser.tokenize('created >= daysAgo(30)');
      
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'value',
        value: 'daysAgo' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'parenthesis', 
        value: '(' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'field',
        value: '30' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'parenthesis', 
        value: ')' 
      }));
    });

    test('should tokenize functions with multiple parameters', () => {
      const tokens = parser.tokenize('created >= dateRange("2023-01-01", "2023-12-31")');
      
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'value',
        value: 'dateRange' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'value',
        value: '"2023-01-01"' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'comma',
        value: ',' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'value',
        value: '"2023-12-31"' 
      }));
    });

    test('should tokenize functions with nested function calls', () => {
      const tokens = parser.tokenize('assignee = nested(currentUser())');
      
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'value',
        value: 'nested' 
      }));
      expect(tokens).toContainEqual(expect.objectContaining({ 
        type: 'field',
        value: 'currentUser' 
      }));
    });
  });

  test.describe('Basic Function Parsing', () => {
    test('should parse parameterless functions', () => {
      const query = parser.parse('assignee = currentUser()');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: '=',
        value: 'currentUser()'
      });
    });

    test('should parse functions with single numeric parameter', () => {
      const query = parser.parse('created >= daysAgo(30)');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '>=',
        value: 'daysAgo(30)'
      });
    });

    test('should parse functions with single string parameter', () => {
      const query = parser.parse('assignee = userInRole("admin")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: '=',
        value: 'userInRole(admin)'
      });
    });

    test('should parse functions with multiple parameters', () => {
      const query = parser.parse('created >= dateRange("2023-01-01", "2023-12-31")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '>=',
        value: 'dateRange(2023-01-01, 2023-12-31)'
      });
    });

    test('should parse functions with mixed parameter types', () => {
      const query = parser.parse('created = dateRange("2023-01-01", daysAgo(30))');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '=',
        value: 'dateRange(2023-01-01, daysAgo(30))'
      });
    });
  });

  test.describe('Nested Function Calls', () => {
    test('should parse simple nested function calls', () => {
      const query = parser.parse('assignee = nested(currentUser())');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: '=',
        value: 'nested(currentUser())'
      });
    });

    test('should parse nested functions with parameters', () => {
      const query = parser.parse('created = nested(daysAgo(30))');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '=',
        value: 'nested(daysAgo(30))'
      });
    });

    test('should parse deeply nested function calls', () => {
      const query = parser.parse('assignee = nested(nested(currentUser()))');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: '=',
        value: 'nested(nested(currentUser()))'
      });
    });
  });

  test.describe('Functions in IN Lists', () => {
    test('should parse parameterless functions in IN lists', () => {
      const query = parser.parse('assignee IN (currentUser(), "john.doe")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: 'IN',
        value: ['currentUser()', 'john.doe']
      });
    });

    test('should parse parameterized functions in IN lists', () => {
      const query = parser.parse('created IN (daysAgo(7), daysAgo(30))');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: 'IN',
        value: ['daysAgo(7)', 'daysAgo(30)']
      });
    });

    test('should parse mixed functions and values in IN lists', () => {
      const query = parser.parse('assignee IN (currentUser(), userInRole("admin"), "jane.smith")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: 'IN',
        value: ['currentUser()', 'userInRole(admin)', 'jane.smith']
      });
    });

    test('should parse nested functions in IN lists', () => {
      const query = parser.parse('assignee IN (nested(currentUser()), "john.doe")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: 'IN',
        value: ['nested(currentUser())', 'john.doe']
      });
    });
  });

  test.describe('Complex Logical Expressions with Functions', () => {
    test('should parse AND expressions with parameterized functions', () => {
      const query = parser.parse('assignee = currentUser() AND created >= daysAgo(30)');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        operator: 'AND',
        conditions: [
          {
            field: 'assignee',
            operator: '=',
            value: 'currentUser()'
          },
          {
            field: 'created',
            operator: '>=',
            value: 'daysAgo(30)'
          }
        ]
      });
    });

    test('should parse OR expressions with parameterized functions', () => {
      const query = parser.parse('assignee = currentUser() OR assignee = userInRole("admin")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        operator: 'OR',
        conditions: [
          {
            field: 'assignee',
            operator: '=',
            value: 'currentUser()'
          },
          {
            field: 'assignee',
            operator: '=',
            value: 'userInRole(admin)'
          }
        ]
      });
    });

    test('should parse parenthesized expressions with functions', () => {
      const query = parser.parse('(assignee = currentUser() OR assignee = userInRole("admin")) AND created >= daysAgo(7)');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        operator: 'AND',
        conditions: [
          {
            operator: 'OR',
            conditions: [
              {
                field: 'assignee',
                operator: '=',
                value: 'currentUser()'
              },
              {
                field: 'assignee',
                operator: '=',
                value: 'userInRole(admin)'
              }
            ]
          },
          {
            field: 'created',
            operator: '>=',
            value: 'daysAgo(7)'
          }
        ]
      });
    });
  });

  test.describe('Parameter Handling Edge Cases', () => {
    test('should handle parameters with spaces in quotes', () => {
      const query = parser.parse('assignee = userInRole("product manager")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: '=',
        value: 'userInRole(product manager)'
      });
    });

    test('should handle parameters with special characters', () => {
      const query = parser.parse('created = dateRange("2023-01-01", "2023-12-31")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '=',
        value: 'dateRange(2023-01-01, 2023-12-31)'
      });
    });

    test('should handle numeric parameters without quotes', () => {
      const query = parser.parse('created >= daysAgo(30)');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '>=',
        value: 'daysAgo(30)'
      });
    });

    test('should handle decimal numeric parameters', () => {
      const query = parser.parse('created >= daysAgo(30.5)');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'created',
        operator: '>=',
        value: 'daysAgo(30.5)'
      });
    });

    test('should handle empty parameter list', () => {
      const query = parser.parse('assignee = currentUser()');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: '=',
        value: 'currentUser()'
      });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle unclosed function parentheses', () => {
      const query = parser.parse('assignee = currentUser(');
      
      expect(query.valid).toBe(false);
      expect(query.errors.length).toBeGreaterThan(0);
      expect(query.errors[0]).toContain('closing parenthesis');
    });

    test('should handle unclosed parameter lists', () => {
      const query = parser.parse('created >= daysAgo(30');
      
      expect(query.valid).toBe(false);
      expect(query.errors.length).toBeGreaterThan(0);
      expect(query.errors[0]).toContain('closing parenthesis');
    });

    test('should handle missing parameters in parentheses', () => {
      const query = parser.parse('created >= daysAgo(,)');
      
      expect(query.valid).toBe(false);
      expect(query.errors.length).toBeGreaterThan(0);
    });

    test('should handle invalid parameter syntax', () => {
      const query = parser.parse('created >= daysAgo(30,,40)');
      
      expect(query.valid).toBe(false);
      expect(query.errors.length).toBeGreaterThan(0);
    });

    test('should handle nested parentheses mismatch', () => {
      const query = parser.parse('assignee = nested(currentUser(()');
      
      expect(query.valid).toBe(false);
      expect(query.errors.length).toBeGreaterThan(0);
    });
  });

  test.describe('Mixed Function and Value Scenarios', () => {
    test('should handle queries with both functions and regular values', () => {
      const query = parser.parse('assignee = currentUser() AND project = "PROJ1" AND created >= daysAgo(30)');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        operator: 'AND',
        conditions: [
          {
            field: 'assignee',
            operator: '=',
            value: 'currentUser()'
          },
          {
            field: 'project',
            operator: '=',
            value: 'PROJ1'
          },
          {
            field: 'created',
            operator: '>=',
            value: 'daysAgo(30)'
          }
        ]
      });
    });

    test('should handle IN lists with mixed functions and values', () => {
      const query = parser.parse('assignee IN (currentUser(), "john.doe", userInRole("admin"))');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: 'IN',
        value: ['currentUser()', 'john.doe', 'userInRole(admin)']
      });
    });

    test('should handle NOT IN with functions', () => {
      const query = parser.parse('assignee NOT IN (userInRole("guest"), "inactive.user")');
      
      expect(query.valid).toBe(true);
      expect(query.errors).toHaveLength(0);
      expect(query.where).toMatchObject({
        field: 'assignee',
        operator: 'NOT IN',
        value: ['userInRole(guest)', 'inactive.user']
      });
    });
  });

  test.describe('Real-world Function Examples', () => {
    test('should parse date range queries', () => {
      const queries = [
        'created >= daysAgo(30)',
        'updated <= daysAgo(7)',
        'created = dateRange("2023-01-01", "2023-12-31")',
        'updated IN (daysAgo(7), daysAgo(14), daysAgo(30))'
      ];

      queries.forEach(queryString => {
        const query = parser.parse(queryString);
        expect(query.valid).toBe(true);
        expect(query.errors).toHaveLength(0);
      });
    });

    test('should parse user-related function queries', () => {
      const queries = [
        'assignee = currentUser()',
        'assignee = userInRole("admin")',
        'assignee IN (currentUser(), userInRole("manager"))',
        'assignee != userInRole("guest")'
      ];

      queries.forEach(queryString => {
        const query = parser.parse(queryString);
        expect(query.valid).toBe(true);
        expect(query.errors).toHaveLength(0);
      });
    });

    test('should parse complex mixed queries', () => {
      const queries = [
        '(assignee = currentUser() OR assignee = userInRole("admin")) AND created >= daysAgo(30)',
        'project IN ("PROJ1", "PROJ2") AND assignee = currentUser() AND updated >= daysAgo(7)',
        '(created >= daysAgo(30) AND assignee = currentUser()) OR (priority = "High" AND assignee = userInRole("manager"))'
      ];

      queries.forEach(queryString => {
        const query = parser.parse(queryString);
        expect(query.valid).toBe(true);
        expect(query.errors).toHaveLength(0);
      });
    });
  });
});
