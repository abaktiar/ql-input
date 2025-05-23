import { Page, Locator, expect } from '@playwright/test';

/**
 * Helper class for interacting with QL Input component
 */
export class QLInputHelper {
  private page: Page;
  private input: Locator;
  private suggestionsList: Locator;
  private parseResult: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator('[data-testid="ql-input"]');
    this.suggestionsList = page.locator('[data-testid="suggestions-list"]');
    this.parseResult = page.locator('[data-testid="parse-result"]');
  }

  /**
   * Type text into the QL input
   */
  async type(text: string, options?: { delay?: number }) {
    await this.input.fill('');
    await this.input.type(text, options);
  }

  /**
   * Clear the input
   */
  async clear() {
    await this.input.fill('');
  }

  /**
   * Get the current input value
   */
  async getValue(): Promise<string> {
    return await this.input.inputValue();
  }

  /**
   * Set cursor position
   */
  async setCursorPosition(position: number) {
    await this.input.focus();
    await this.page.keyboard.press('Home');
    for (let i = 0; i < position; i++) {
      await this.page.keyboard.press('ArrowRight');
    }
  }

  /**
   * Wait for suggestions to appear
   */
  async waitForSuggestions(timeout = 5000) {
    await this.suggestionsList.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get all visible suggestions
   */
  async getSuggestions(): Promise<string[]> {
    await this.waitForSuggestions();
    const suggestions = await this.suggestionsList.locator('[data-testid="suggestion-item"]').all();
    return Promise.all(suggestions.map((s) => s.textContent().then((text) => text || '')));
  }

  /**
   * Get suggestion values (just the value part, not the full display text)
   */
  async getSuggestionValues(): Promise<string[]> {
    await this.waitForSuggestions();
    const suggestions = await this.suggestionsList.locator('[data-testid="suggestion-item"]').all();
    const values = [];
    for (const suggestion of suggestions) {
      // Extract the value from the data-value attribute
      const value = await suggestion.getAttribute('data-value');
      if (value) {
        values.push(value);
      } else {
        // Fallback: try to extract from text content
        const text = await suggestion.textContent();
        if (text) {
          // Parse format like "valueProject Alpha" -> "Project Alpha"
          const match = text.match(/^(value|field|operator|logical|function)(.+)$/);
          if (match) {
            values.push(match[2]);
          } else {
            values.push(text);
          }
        }
      }
    }
    return values;
  }

  /**
   * Select a suggestion by text or value
   */
  async selectSuggestion(text: string) {
    await this.waitForSuggestions();
    // Try to find by data-value first, then by text content
    const byValue = this.suggestionsList.locator(`[data-testid="suggestion-item"][data-value="${text}"]`);
    const byText = this.suggestionsList.locator('[data-testid="suggestion-item"]', { hasText: text });

    try {
      await byValue.waitFor({ state: 'visible', timeout: 1000 });
      await byValue.click();
    } catch {
      await byText.click();
    }
  }

  /**
   * Select a suggestion by index
   */
  async selectSuggestionByIndex(index: number) {
    await this.waitForSuggestions();
    const suggestions = await this.suggestionsList.locator('[data-testid="suggestion-item"]').all();
    if (index < suggestions.length) {
      await suggestions[index].click();
    } else {
      throw new Error(`Suggestion index ${index} out of range (${suggestions.length} suggestions available)`);
    }
  }

  /**
   * Check if suggestions are visible
   */
  async areSuggestionsVisible(): Promise<boolean> {
    try {
      await this.suggestionsList.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the parsed query result
   */
  async getParseResult(): Promise<any> {
    const resultText = await this.parseResult.textContent();
    return resultText ? JSON.parse(resultText) : null;
  }

  /**
   * Check if the query is valid
   */
  async isQueryValid(): Promise<boolean> {
    const result = await this.getParseResult();
    return result?.valid === true;
  }

  /**
   * Get parse errors
   */
  async getParseErrors(): Promise<string[]> {
    const result = await this.getParseResult();
    return result?.errors || [];
  }

  /**
   * Press a key
   */
  async pressKey(key: string) {
    await this.input.focus();
    await this.page.keyboard.press(key);
  }

  /**
   * Type and wait for suggestions
   */
  async typeAndWaitForSuggestions(text: string): Promise<string[]> {
    await this.type(text);
    return await this.getSuggestions();
  }

  /**
   * Build a complete query step by step
   */
  async buildQuery(steps: Array<{ type: 'type' | 'select'; value: string | number }>) {
    for (const step of steps) {
      if (step.type === 'type') {
        await this.type(step.value as string);
      } else if (step.type === 'select') {
        if (typeof step.value === 'string') {
          await this.selectSuggestion(step.value);
        } else {
          await this.selectSuggestionByIndex(step.value);
        }
      }
      // Small delay between steps
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Assert suggestions contain specific items
   */
  async assertSuggestionsContain(expectedSuggestions: string[]) {
    const suggestions = await this.getSuggestions();
    for (const expected of expectedSuggestions) {
      expect(suggestions).toContain(expected);
    }
  }

  /**
   * Assert suggestions don't contain specific items
   */
  async assertSuggestionsNotContain(unexpectedSuggestions: string[]) {
    const suggestions = await this.getSuggestions();
    for (const unexpected of unexpectedSuggestions) {
      expect(suggestions).not.toContain(unexpected);
    }
  }

  /**
   * Assert query parses correctly
   */
  async assertQueryValid() {
    const isValid = await this.isQueryValid();
    expect(isValid).toBe(true);
  }

  /**
   * Assert query has errors
   */
  async assertQueryInvalid() {
    const isValid = await this.isQueryValid();
    expect(isValid).toBe(false);
  }

  /**
   * Wait for a specific number of suggestions
   */
  async waitForSuggestionCount(count: number, timeout = 5000) {
    await this.page.waitForFunction(
      (expectedCount) => {
        const suggestions = document.querySelectorAll('[data-testid="suggestion-item"]');
        return suggestions.length === expectedCount;
      },
      count,
      { timeout }
    );
  }

  /**
   * Get suggestion by text content
   */
  async getSuggestionByText(text: string): Promise<string | null> {
    await this.waitForSuggestions();
    const suggestion = this.suggestionsList.locator('[data-testid="suggestion-item"]', { hasText: text });
    return await suggestion.textContent();
  }

  /**
   * Check if a specific suggestion exists
   */
  async hasSuggestion(text: string): Promise<boolean> {
    try {
      await this.waitForSuggestions();
      const suggestion = this.suggestionsList.locator('[data-testid="suggestion-item"]', { hasText: text });
      await suggestion.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the number of visible suggestions
   */
  async getSuggestionCount(): Promise<number> {
    try {
      await this.waitForSuggestions();
      const suggestions = await this.suggestionsList.locator('[data-testid="suggestion-item"]').all();
      return suggestions.length;
    } catch {
      return 0;
    }
  }

  /**
   * Take a screenshot of the current state
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Simulate real user typing with delays
   */
  async typeSlowly(text: string, delay = 100) {
    await this.input.focus();
    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.page.waitForTimeout(delay);
    }
  }

  /**
   * Assert that the input has focus
   */
  async assertInputFocused() {
    await expect(this.input).toBeFocused();
  }

  /**
   * Assert that suggestions are not visible
   */
  async assertNoSuggestions() {
    const hasSuggestions = await this.areSuggestionsVisible();
    expect(hasSuggestions).toBe(false);
  }

  /**
   * Get the current cursor position (approximate)
   */
  async getCursorPosition(): Promise<number> {
    return await this.input.evaluate((input: HTMLInputElement) => {
      return input.selectionStart || 0;
    });
  }

  /**
   * Set text selection
   */
  async setSelection(start: number, end: number) {
    await this.input.evaluate(
      (input: HTMLInputElement, { start, end }) => {
        input.setSelectionRange(start, end);
      },
      { start, end }
    );
  }
}
