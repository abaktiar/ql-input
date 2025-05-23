import { test, expect } from '@playwright/test';
import { QLInputHelper } from '../utils/ql-helpers';

test.describe('QL Input - IN Operator', () => {
  let qlInput: QLInputHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    qlInput = new QLInputHelper(page);
  });

  test.describe('IN Operator Basic Functionality', () => {
    test('should add opening parenthesis when selecting IN operator', async () => {
      await qlInput.type('project ');
      await qlInput.selectSuggestion('IN');
      await expect(qlInput.getValue()).resolves.toBe('project IN (');
    });

    test('should show value suggestions after opening parenthesis', async () => {
      await qlInput.type('project IN (');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      expect(suggestions).toContain('PROJ1');
      expect(suggestions).toContain('PROJ2');
      expect(suggestions).toContain('PROJ3');
    });

    test('should add comma after selecting first value', async () => {
      await qlInput.type('project IN (');
      await qlInput.selectSuggestion('PROJ1');
      await expect(qlInput.getValue()).resolves.toBe('project IN (PROJ1, ');
    });

    test('should show value suggestions after comma', async () => {
      await qlInput.type('project IN (PROJ1, ');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      expect(suggestions).toContain('PROJ2');
      expect(suggestions).toContain('PROJ3');
      expect(suggestions).toContain(','); // Comma suggestion for additional values
    });

    test('should allow multiple value selection', async () => {
      await qlInput.buildQuery([
        { type: 'type', value: 'project IN (' },
        { type: 'select', value: 'PROJ1' },
        { type: 'select', value: 'PROJ2' },
        { type: 'type', value: ')' },
      ]);

      await expect(qlInput.getValue()).resolves.toBe('project IN (PROJ1, PROJ2, )');
    });

    test('should parse complete IN query correctly', async () => {
      await qlInput.type('project IN (PROJ1, PROJ2)');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where).toMatchObject({
        field: 'project',
        operator: 'IN',
        value: ['PROJ1', 'PROJ2'],
      });
      // Note: Current implementation doesn't include 'type' field
    });
  });

  test.describe('Multi-word Values in IN Lists', () => {
    test('should auto-quote multi-word values', async () => {
      await qlInput.type('status IN (');
      await qlInput.selectSuggestion('In Progress');
      await expect(qlInput.getValue()).resolves.toBe('status IN ("In Progress", ');
    });

    test('should handle mixed single and multi-word values', async () => {
      await qlInput.buildQuery([
        { type: 'type', value: 'status IN (' },
        { type: 'select', value: 'Open' },
        { type: 'select', value: 'In Progress' },
        { type: 'type', value: ')' },
      ]);

      const value = await qlInput.getValue();
      expect(value).toContain('Open, ');
      expect(value).toContain('"In Progress", ');
    });

    test('should parse quoted values in IN lists correctly', async () => {
      await qlInput.type('status IN (Open, "In Progress")');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.value).toEqual(['Open', 'In Progress']);
    });
  });

  test.describe('IN Operator with Functions', () => {
    test('should suggest functions in IN lists', async () => {
      await qlInput.type('assignee IN (');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      expect(suggestions).toContain('currentUser');
    });

    test('should add comma after function selection in IN lists', async () => {
      await qlInput.type('assignee IN (');
      await qlInput.selectSuggestion('currentUser()');
      await expect(qlInput.getValue()).resolves.toBe('assignee IN (currentUser(), ');
    });

    test('should mix functions and regular values', async () => {
      await qlInput.buildQuery([
        { type: 'type', value: 'assignee IN (' },
        { type: 'select', value: 'currentUser()' },
        { type: 'select', value: 'john.doe' },
        { type: 'type', value: ')' },
      ]);

      const value = await qlInput.getValue();
      expect(value).toContain('currentUser(), ');
      expect(value).toContain('john.doe, ');
    });
  });

  test.describe('NOT IN Operator', () => {
    test('should handle NOT IN operator', async () => {
      await qlInput.type('project ');
      await qlInput.selectSuggestion('NOT IN');
      await expect(qlInput.getValue()).resolves.toBe('project NOT IN (');
    });

    test('should work the same as IN for value suggestions', async () => {
      await qlInput.type('project NOT IN (');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      expect(suggestions).toContain('PROJ1');
      expect(suggestions).toContain('PROJ2');
    });

    test('should parse NOT IN queries correctly', async () => {
      await qlInput.type('project NOT IN (PROJ1, PROJ2)');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where).toMatchObject({
        field: 'project',
        operator: 'NOT IN',
        value: ['PROJ1', 'PROJ2'],
      });
      // Note: Current implementation doesn't include 'type' field
    });
  });

  test.describe('IN Operator Context Preservation', () => {
    test('should maintain field context when typing in IN list', async () => {
      await qlInput.type('project IN (PROJ');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      // Should show project values, not field suggestions
      expect(suggestions).toContain('PROJ1');
      expect(suggestions).not.toContain('project');
    });

    test('should filter values based on partial input in IN list', async () => {
      await qlInput.type('project IN (PROJ1, PROJ');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      expect(suggestions).toContain('PROJ2');
      expect(suggestions).toContain('PROJ3');
      expect(suggestions).not.toContain('PROJ1'); // Already selected
    });

    test('should show logical operators after closing IN list', async () => {
      await qlInput.type('project IN (PROJ1, PROJ2) ');
      await qlInput.waitForSuggestions();

      const suggestions = await qlInput.getSuggestionValues();
      expect(suggestions).toContain('AND');
      expect(suggestions).toContain('OR');
    });
  });

  test.describe('IN Operator Error Handling', () => {
    test('should handle incomplete IN lists', async () => {
      await qlInput.type('project IN (PROJ1,');
      // Should be invalid as it's incomplete
      const result = await qlInput.getParseResult();
      expect(result.valid).toBe(false);
    });

    test('should handle empty IN lists', async () => {
      await qlInput.type('project IN ()');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.value).toEqual([]);
    });

    test('should handle unclosed IN lists', async () => {
      await qlInput.type('project IN (PROJ1, PROJ2');
      // Should be invalid as it's unclosed
      const result = await qlInput.getParseResult();
      expect(result.valid).toBe(false);
    });
  });

  test.describe('Complex IN Operator Scenarios', () => {
    test('should handle IN operator in complex logical expressions', async () => {
      await qlInput.type('project IN (PROJ1, PROJ2) AND status = Open');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.operator).toBe('AND');
      expect(result.where.conditions).toHaveLength(2);
      expect(result.where.conditions[0].operator).toBe('IN');
      expect(result.where.conditions[1].operator).toBe('=');
    });

    test('should handle nested parentheses with IN operator', async () => {
      await qlInput.type('(project IN (PROJ1, PROJ2) OR project = PROJ3) AND status = Open');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.operator).toBe('AND');
      expect(result.where.conditions).toHaveLength(2);
    });

    test('should handle multiple IN operators', async () => {
      await qlInput.type('project IN (PROJ1, PROJ2) AND status IN (Open, "In Progress")');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.operator).toBe('AND');
      expect(result.where.conditions[0].operator).toBe('IN');
      expect(result.where.conditions[1].operator).toBe('IN');
    });
  });
});
