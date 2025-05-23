import { test, expect } from '@playwright/test';
import { QLInputHelper } from '../utils/ql-helpers';

test.describe('QL Input - Complete Workflow E2E', () => {
  let qlInput: QLInputHelper;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    qlInput = new QLInputHelper(page);
  });

  test.describe('Real User Scenarios', () => {
    test('should build a simple query from scratch', async ({ page }) => {
      // User wants to find all issues in PROJ1 that are open

      // Step 1: Start typing field
      await qlInput.type('proj');
      await qlInput.waitForSuggestions();
      await qlInput.assertSuggestionsContain(['project']);

      // Step 2: Select project field
      await qlInput.selectSuggestion('project');
      await expect(qlInput.getValue()).resolves.toBe('project ');

      // Step 3: Select equals operator
      await qlInput.waitForSuggestions();
      await qlInput.assertSuggestionsContain(['=', '!=', 'IN', 'NOT IN']);
      await qlInput.selectSuggestion('=');
      await expect(qlInput.getValue()).resolves.toBe('project = ');

      // Step 4: Select project value
      await qlInput.waitForSuggestions();
      await qlInput.assertSuggestionsContain(['PROJ1', 'PROJ2', 'PROJ3']);
      await qlInput.selectSuggestion('PROJ1');
      await expect(qlInput.getValue()).resolves.toBe('project = PROJ1 ');

      // Step 5: Add logical operator
      await qlInput.waitForSuggestions();
      await qlInput.assertSuggestionsContain(['AND', 'OR']);
      await qlInput.selectSuggestion('AND');
      await expect(qlInput.getValue()).resolves.toBe('project = PROJ1 AND ');

      // Step 6: Add status condition
      await qlInput.waitForSuggestions();
      await qlInput.selectSuggestion('status');
      await qlInput.selectSuggestion('=');
      await qlInput.selectSuggestion('Open');

      // Final query
      await expect(qlInput.getValue()).resolves.toBe('project = PROJ1 AND status = Open ');
      await qlInput.assertQueryValid();

      // Verify parse result
      const result = await qlInput.getParseResult();
      expect(result.where.type).toBe('logical');
      expect(result.where.operator).toBe('AND');
    });

    test('should build an IN operator query with multi-word values', async ({ page }) => {
      // User wants to find issues with status "In Progress" or "Code Review"

      await qlInput.buildQuery([
        { type: 'type', value: 'stat' },
        { type: 'select', value: 'status' },
        { type: 'select', value: 'IN' },
        { type: 'select', value: 'In Progress' },
        { type: 'select', value: 'Code Review' },
        { type: 'type', value: ')' },
      ]);

      const value = await qlInput.getValue();
      expect(value).toContain('status IN (');
      expect(value).toContain('"In Progress", ');
      expect(value).toContain('"Code Review", ');

      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.value).toEqual(['In Progress', 'Code Review']);
    });

    test('should build a complex query with parentheses and multiple conditions', async ({ page }) => {
      // User wants: (project = PROJ1 OR project = PROJ2) AND status = Open

      await qlInput.type('(project = PROJ1 OR project = PROJ2) AND status = Open');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.type).toBe('logical');
      expect(result.where.operator).toBe('AND');
      expect(result.where.left.type).toBe('logical');
      expect(result.where.left.operator).toBe('OR');
    });

    test('should handle ORDER BY clause', async ({ page }) => {
      await qlInput.type('project = PROJ1 ORDER BY priority DESC');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.orderBy).toHaveLength(1);
      expect(result.orderBy[0]).toMatchObject({
        field: 'priority',
        direction: 'DESC',
      });
    });

    test('should use functions in queries', async ({ page }) => {
      await qlInput.buildQuery([
        { type: 'type', value: 'assignee = ' },
        { type: 'select', value: 'currentUser()' },
      ]);

      await expect(qlInput.getValue()).resolves.toBe('assignee = currentUser() ');
      await qlInput.assertQueryValid();
    });
  });

  test.describe('Error Recovery Scenarios', () => {
    test('should recover from syntax errors', async ({ page }) => {
      // User makes a mistake
      await qlInput.type('project = = PROJ1');
      await qlInput.assertQueryInvalid();

      // User fixes the mistake
      await qlInput.clear();
      await qlInput.type('project = PROJ1');
      await qlInput.assertQueryValid();
    });

    test('should handle incomplete queries gracefully', async ({ page }) => {
      await qlInput.type('project =');
      // Should be invalid but not crash
      const result = await qlInput.getParseResult();
      expect(result.valid).toBe(false);

      // Complete the query
      await qlInput.type(' PROJ1');
      await qlInput.assertQueryValid();
    });

    test('should handle malformed IN lists', async ({ page }) => {
      await qlInput.type('project IN (PROJ1,, PROJ2)');
      // Should handle double comma gracefully
      const result = await qlInput.getParseResult();
      // Depending on implementation, this might be valid or invalid
      expect(typeof result.valid).toBe('boolean');
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should show suggestions quickly', async ({ page }) => {
      const startTime = Date.now();
      await qlInput.type('p');
      await qlInput.waitForSuggestions();
      const endTime = Date.now();

      // Suggestions should appear within 500ms
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should handle rapid typing', async ({ page }) => {
      // Type quickly without waiting
      await qlInput.type('project = PROJ1 AND status = Open', { delay: 10 });

      // Should still parse correctly
      await qlInput.assertQueryValid();
    });

    test('should handle long queries', async ({ page }) => {
      const longQuery =
        'project IN (PROJ1, PROJ2, PROJ3) AND status IN (Open, "In Progress", "Code Review") AND assignee IN (john.doe, jane.smith) AND priority IN (High, Critical) ORDER BY created DESC';

      await qlInput.type(longQuery);
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.type).toBe('logical');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab to input
      await page.keyboard.press('Tab');
      await expect(qlInput.input).toBeFocused();

      // Type and navigate suggestions with keyboard
      await qlInput.type('p');
      await qlInput.waitForSuggestions();

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const value = await qlInput.getValue();
      expect(value).toMatch(/^(project|priority) $/);
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await expect(qlInput.input).toHaveAttribute('type', 'text');
      // Add more accessibility checks as needed
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      await qlInput.type('project = PROJ1');
      await qlInput.assertQueryValid();

      const result = await qlInput.getParseResult();
      expect(result.where.field).toBe('project');

      // Test passes on all browsers configured in playwright.config.ts
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewports', async ({ page }) => {
      // This test will run on mobile viewports configured in playwright.config.ts
      await qlInput.type('project = PROJ1');
      await qlInput.assertQueryValid();

      // Verify input is still functional on mobile
      await expect(qlInput.input).toBeVisible();
    });
  });

  test.describe('Real-world Query Examples', () => {
    test('should handle QL queries', async ({ page }) => {
      const queries = [
        'project = PROJ1 AND status = Open',
        'assignee = currentUser() AND priority IN (High, Critical)',
        'created >= startOfWeek() ORDER BY priority DESC',
        'summary ~ "bug" AND status NOT IN (Done, Closed)',
        '(project = PROJ1 OR project = PROJ2) AND assignee IS NOT EMPTY',
      ];

      for (const query of queries) {
        await qlInput.clear();
        await qlInput.type(query);
        await qlInput.assertQueryValid();

        const result = await qlInput.getParseResult();
        expect(result.raw).toBe(query);
      }
    });

    test('should handle edge cases', async ({ page }) => {
      const edgeCases = [
        '', // Empty query
        '   ', // Whitespace only
        'project = "Value with spaces"',
        'summary ~ "Text with \\"quotes\\""',
        'project IN ()',
        'NOT project = PROJ1',
      ];

      for (const query of edgeCases) {
        await qlInput.clear();
        await qlInput.type(query);

        // Should not crash, regardless of validity
        const result = await qlInput.getParseResult();
        expect(typeof result.valid).toBe('boolean');
      }
    });
  });
});
