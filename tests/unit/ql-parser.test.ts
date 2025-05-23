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
      // Test a few ORDER BY queries since the test data is commented out
      const orderByQueries = [
        'project = PROJ1 ORDER BY priority',
        'project = PROJ1 ORDER BY priority DESC',
        'ORDER BY priority',
        'ORDER BY priority DESC',
      ];

      for (const query of orderByQueries) {
        const result = parser.parse(query);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    test('should parse function queries', () => {
      for (const query of testQueries.functions) {
        const result = parser.parse(query);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    test('should parse multi-word quoted values', () => {
      for (const [category, queries] of Object.entries(testQueries.multiWord)) {
        for (const query of queries) {
          const result = parser.parse(query);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      }
    });
  });

  test.describe('Parsing - Invalid Queries', () => {
    test('should reject invalid queries', () => {
      for (const query of testQueries.simple.invalid) {
        const result = parser.parse(query);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
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
      // Note: Current implementation doesn't include 'type' field
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
      // Note: Current implementation uses 'conditions' array instead of 'left'/'right'
    });

    test('should handle IN operator with array values', () => {
      const result = parser.parse('project IN (PROJ1, PROJ2)');

      expect(result.where).toMatchObject({
        field: 'project',
        operator: 'IN',
        value: ['PROJ1', 'PROJ2'],
      });
      // Note: Current implementation doesn't include 'type' field
    });

    test('should handle ORDER BY clauses', () => {
      const result = parser.parse('project = PROJ1 ORDER BY priority DESC');

      expect(result.orderBy).toHaveLength(1);
      expect(result.orderBy![0]).toMatchObject({
        field: 'priority',
        direction: 'DESC',
      });
    });
  });
});
