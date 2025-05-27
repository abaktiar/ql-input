import { test, expect } from '@playwright/test';
import { QLParser } from '../../src/lib/ql-parser';
import { testFields, testQueries } from '../fixtures/test-data';

test.describe('QL Parser Unit Tests', () => {
  let parser: QLParser;

  test.beforeEach(() => {
    parser = new QLParser({
      fields: testFields,
      maxSuggestions: 10,
      caseSensitive: false,
      allowParentheses: true,
      allowOrderBy: true,
      allowFunctions: true,
    });
  });

  test.describe('Tokenization', () => {
    test('should tokenize simple field-operator-value query', () => {
      const tokens = parser.tokenize('project = PROJ1');

      expect(tokens).toHaveLength(5);
      expect(tokens[0]).toMatchObject({ type: 'field', value: 'project' });
      expect(tokens[1]).toMatchObject({ type: 'whitespace', value: ' ' });
      expect(tokens[2]).toMatchObject({ type: 'operator', value: '=' });
      expect(tokens[3]).toMatchObject({ type: 'whitespace', value: ' ' });
      expect(tokens[4]).toMatchObject({ type: 'value', value: 'PROJ1' }); // Fixed: should be 'value', not 'field'
    });

    test('should tokenize quoted values', () => {
      const tokens = parser.tokenize('status = "In Progress"');

      expect(tokens).toHaveLength(5);
      expect(tokens[4]).toMatchObject({ type: 'value', value: '"In Progress"' });
    });

    test('should tokenize IN operator with parentheses', () => {
      const tokens = parser.tokenize('project IN (PROJ1, PROJ2)');

      expect(tokens).toContainEqual(expect.objectContaining({ type: 'operator', value: 'IN' }));
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'parenthesis', value: '(' }));
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'comma', value: ',' }));
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'parenthesis', value: ')' }));
    });

    test('should tokenize logical operators', () => {
      const tokens = parser.tokenize('project = PROJ1 AND status = Open');

      expect(tokens).toContainEqual(expect.objectContaining({ type: 'logical', value: 'AND' }));
    });

    test('should tokenize ORDER BY clause', () => {
      const tokens = parser.tokenize('project = PROJ1 ORDER BY priority DESC');

      expect(tokens).toContainEqual(expect.objectContaining({ type: 'keyword', value: 'ORDER' }));
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'keyword', value: 'BY' }));
      expect(tokens).toContainEqual(expect.objectContaining({ type: 'keyword', value: 'DESC' }));
    });
  });

  test.describe('Parsing - Valid Queries', () => {
    test('should parse simple equality queries', () => {
      for (const query of testQueries.simple.valid) {
        const result = parser.parse(query);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.raw).toBe(query);
      }
    });

    test('should parse operator queries', () => {
      for (const [category, queries] of Object.entries(testQueries.operators)) {
        for (const query of queries) {
          const result = parser.parse(query);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      }
    });

    test('should parse logical operator queries', () => {
      for (const [category, queries] of Object.entries(testQueries.logical)) {
        for (const query of queries) {
          const result = parser.parse(query);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      }
    });

    test('should parse IN operator queries', () => {
      for (const [category, queries] of Object.entries(testQueries.inOperator)) {
        for (const query of queries) {
          const result = parser.parse(query);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      }
    });

    test('should parse ORDER BY queries', () => {
      const allOrderByQueries = [...testQueries.orderBy.simple, ...testQueries.orderBy.multiple];

      for (const query of allOrderByQueries) {
        const result = parser.parse(query);
        expect(result.valid, `Query: "${query}"`).toBe(true);
        expect(result.errors, `Query: "${query}"`).toHaveLength(0);
        expect(result.raw, `Query: "${query}"`).toBe(query);

        // Determine expected orderBy structure
        const expectedOrderBy: { field: string; direction: 'ASC' | 'DESC' }[] = [];
        const orderByClauseMatch = query.match(/ORDER\s+BY\s+(.*)/i);
        if (orderByClauseMatch && orderByClauseMatch[1]) {
          const items = orderByClauseMatch[1].split(',').map((item) => item.trim());
          for (const item of items) {
            const parts = item.split(/\s+/);
            const field = parts[0];
            const direction = parts.length > 1 && parts[1].toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            expectedOrderBy.push({ field, direction });
          }
        }
        expect(result.orderBy, `Query: "${query}"`).toEqual(expectedOrderBy);

        // Check if WHERE clause should exist
        if (query.toUpperCase().startsWith('ORDER BY')) {
          expect(result.where, `Query: "${query}"`).toBeUndefined();
        } else {
          expect(result.where, `Query: "${query}"`).toBeDefined();
        }
      }
    });

    test('should parse function queries', () => {
      for (const query of testQueries.functions.valid) { // Ensure using .valid
        const result = parser.parse(query);
        expect(result.valid, `Query: "${query}"`).toBe(true);
        expect(result.errors, `Query: "${query}"`).toHaveLength(0);
      }
    });

    test('should parse multi-word quoted values', () => {
      for (const [category, queries] of Object.entries(testQueries.multiWord)) {
        for (const query of queries) {
          const result = parser.parse(query);
          expect(result.valid, `Query: "${query}"`).toBe(true);
          expect(result.errors, `Query: "${query}"`).toHaveLength(0);
        }
      }
    });

    test('should parse queries with varied whitespace', () => {
      for (const query of testQueries.whitespace.valid) {
        const result = parser.parse(query);
        expect(result.valid, `Query: "${query}"`).toBe(true);
        expect(result.errors, `Query: "${query}"`).toHaveLength(0);
        // Optional: Add more specific structural checks if whitespace might affect parsing results
      }
    });

    test('should parse valid edge case queries', () => {
      for (const query of testQueries.edgeCases.valid) {
        const result = parser.parse(query);
        expect(result.valid, `Query: "${query}"`).toBe(true);
        expect(result.errors, `Query: "${query}"`).toHaveLength(0);
      }
    });
  });

  test.describe('Parsing - Invalid Queries', () => {
    test('should reject all categories of invalid queries', () => {
      const allInvalidQueries = [
        ...testQueries.simple.invalid,
        ...testQueries.logical.invalid,
        ...testQueries.functions.invalid,
        ...testQueries.orderBy.invalid,
        ...testQueries.edgeCases.invalid,
      ];

      for (const query of allInvalidQueries) {
        const result = parser.parse(query);
        expect(result.valid, `Query: "${query}"`).toBe(false);
        expect(result.errors.length, `Query: "${query}"`).toBeGreaterThan(0);
      }
    });

    test('should handle empty queries', () => {
      const result = parser.parse('');
      expect(result.valid).toBe(true);
      expect(result.where).toBeUndefined();
    });

    test('should handle whitespace-only queries', () => {
      const result = parser.parse('   ');
      expect(result.valid).toBe(true);
      expect(result.where).toBeUndefined();
    });
  });

  test.describe('Query Structure', () => {
    test('should create proper hierarchical structure for simple conditions', () => {
      const result = parser.parse('project = PROJ1');

      expect(result.where).toMatchObject({
        field: 'project',
        operator: '=',
        value: 'PROJ1',
      });
      // Verified: No 'type' property expected or present.
    });

    test('should create proper hierarchical structure for logical expressions', () => {
      const result = parser.parse('project = PROJ1 AND status = Open');

      expect(result.where).toMatchObject({
        operator: 'AND',
        conditions: [
          {
            field: 'project',
            operator: '=',
            value: 'PROJ1',
          },
          {
            field: 'status',
            operator: '=',
            value: 'Open',
          },
        ],
      });
      // Verified: 'conditions' array is correctly used.
    });

    test('should handle IN operator with array values', () => {
      const result = parser.parse('project IN (PROJ1, PROJ2)');

      expect(result.where).toMatchObject({
        field: 'project',
        operator: 'IN',
        value: ['PROJ1', 'PROJ2'],
      });
      // Verified: No 'type' property expected or present.
    });

    test('should handle ORDER BY clauses', () => {
      // This test is now covered by the more comprehensive 'should parse ORDER BY queries' test.
      // Kept a simple case here for basic check.
      const result = parser.parse('project = PROJ1 ORDER BY priority DESC');
      expect(result.orderBy).toHaveLength(1);
      expect(result.orderBy![0]).toMatchObject({
        field: 'priority',
        direction: 'DESC',
      });

      const resultWithAsc = parser.parse('project = PROJ1 ORDER BY priority ASC');
      expect(resultWithAsc.orderBy).toHaveLength(1);
      expect(resultWithAsc.orderBy![0]).toMatchObject({
        field: 'priority',
        direction: 'ASC',
      });

      const resultWithoutDirection = parser.parse('project = PROJ1 ORDER BY priority');
      expect(resultWithoutDirection.orderBy).toHaveLength(1);
      expect(resultWithoutDirection.orderBy![0]).toMatchObject({
        field: 'priority',
        direction: 'ASC', // Default direction
      });
    });
  });
});
