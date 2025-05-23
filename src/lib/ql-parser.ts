import type {
  QLToken,
  QLQuery,
  QLOrderBy,
  ParseContext,
  OperatorType,
  LogicalOperatorType,
  QLInputConfig,
  QLExpression,
  SortDirection,
} from './ql-types';
import { QLExpressionParser } from './ql-expression-parser';

// Keywords and operators
const LOGICAL_OPERATORS: LogicalOperatorType[] = ['AND', 'OR', 'NOT'];
const COMPARISON_OPERATORS: OperatorType[] = ['=', '!=', '>', '<', '>=', '<='];
const TEXT_OPERATORS: OperatorType[] = ['~', '!~'];
const LIST_OPERATORS: OperatorType[] = ['IN', 'NOT IN'];
const NULL_OPERATORS: OperatorType[] = ['IS EMPTY', 'IS NOT EMPTY'];
const ALL_OPERATORS: OperatorType[] = [
  ...COMPARISON_OPERATORS,
  ...TEXT_OPERATORS,
  ...LIST_OPERATORS,
  ...NULL_OPERATORS,
];

const KEYWORDS = ['ORDER', 'BY', 'ASC', 'DESC'];

export class QLParser {
  constructor(_config: QLInputConfig) {
    // Config stored for future use if needed
  }

  /**
   * Tokenize the input string into QL tokens
   */
  tokenize(input: string): QLToken[] {
    const tokens: QLToken[] = [];
    let position = 0;

    while (position < input.length) {
      const char = input[position];
      const remaining = input.slice(position);

      // Skip whitespace but track it
      if (/\s/.test(char)) {
        const start = position;
        while (position < input.length && /\s/.test(input[position])) {
          position++;
        }
        tokens.push({
          type: 'whitespace',
          value: input.slice(start, position),
          start,
          end: position,
        });
        continue;
      }

      let matched = false;

      // Handle quoted strings
      if (char === '"' || char === "'") {
        const quote = char;
        const start = position;
        position++; // Skip opening quote

        while (position < input.length && input[position] !== quote) {
          if (input[position] === '\\') {
            position += 2; // Skip escaped character
          } else {
            position++;
          }
        }

        if (position < input.length) {
          position++; // Skip closing quote
        }

        tokens.push({
          type: 'value',
          value: input.slice(start, position),
          start,
          end: position,
        });
        continue;
      }

      // Handle parentheses
      if (char === '(' || char === ')') {
        tokens.push({
          type: 'parenthesis',
          value: char,
          start: position,
          end: position + 1,
        });
        position++;
        continue;
      }

      // Handle commas (for IN lists)
      if (char === ',') {
        tokens.push({
          type: 'comma',
          value: char,
          start: position,
          end: position + 1,
        });
        position++;
        continue;
      }

      // Handle single-character operators
      if (['=', '!', '>', '<', '~'].includes(char)) {
        const start = position;
        let operator = char;

        // Check for multi-character operators
        if (position + 1 < input.length) {
          const nextChar = input[position + 1];
          if ((char === '!' && nextChar === '=') || (char === '>' && nextChar === '=') || (char === '<' && nextChar === '=') || (char === '!' && nextChar === '~')) {
            operator += nextChar;
            position++;
          }
        }

        tokens.push({
          type: 'operator',
          value: operator,
          start,
          end: position + 1,
        });
        position++;
        continue;
      }

      // Check for multi-character operators first (case-insensitive)
      for (const op of ALL_OPERATORS.sort((a, b) => b.length - a.length)) {
        if (remaining.toUpperCase().startsWith(op)) {
          const nextChar = remaining[op.length];
          if (!nextChar || /\s/.test(nextChar) || nextChar === '(' || nextChar === ')') {
            tokens.push({
              type: 'operator',
              value: op, // Always store in uppercase for consistency
              start: position,
              end: position + op.length,
            });
            position += op.length;
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // Check for logical operators (case-insensitive)
      for (const op of LOGICAL_OPERATORS) {
        if (remaining.toUpperCase().startsWith(op)) {
          const nextChar = remaining[op.length];
          if (!nextChar || /\s/.test(nextChar) || nextChar === '(' || nextChar === ')') {
            tokens.push({
              type: 'logical',
              value: op, // Always store in uppercase for consistency
              start: position,
              end: position + op.length,
            });
            position += op.length;
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // Check for keywords (case-insensitive)
      for (const keyword of KEYWORDS) {
        if (remaining.toUpperCase().startsWith(keyword)) {
          const nextChar = remaining[keyword.length];
          if (!nextChar || /\s/.test(nextChar) || nextChar === '(' || nextChar === ')') {
            tokens.push({
              type: 'keyword',
              value: keyword, // Always store in uppercase for consistency
              start: position,
              end: position + keyword.length,
            });
            position += keyword.length;
            matched = true;
            break;
          }
        }
      }

      if (matched) continue;

      // Handle regular words (fields, values, functions)
      const start = position;
      while (
        position < input.length &&
        !/\s/.test(input[position]) &&
        input[position] !== '(' &&
        input[position] !== ')' &&
        input[position] !== ',' &&
        input[position] !== '"' &&
        input[position] !== "'"
      ) {
        position++;
      }

      if (position > start) {
        const value = input.slice(start, position);
        tokens.push({
          type: 'unknown', // Will be classified later
          value,
          start,
          end: position,
        });
      } else {
        // Unknown character, skip it
        position++;
      }
    }

    return this.classifyTokens(tokens);
  }

  /**
   * Classify unknown tokens based on context
   */
  private classifyTokens(tokens: QLToken[]): QLToken[] {
    const context: ParseContext = {
      input: '',
      position: 0,
      tokens,
      expectingField: true,
      expectingOperator: false,
      expectingValue: false,
      expectingLogical: false,
      parenthesesLevel: 0,
      inOrderBy: false,
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'whitespace') continue;

      if (token.type === 'unknown') {
        // Classify based on context
        if (context.expectingField) {
          token.type = 'field';
          context.expectingField = false;
          context.expectingOperator = true;
        } else if (context.expectingValue) {
          token.type = 'value';
          context.expectingValue = false;
          context.expectingLogical = true;
        } else {
          // Default to field if unsure
          token.type = 'field';
        }
      }

      // Update context based on current token
      if (token.type === 'field') {
        context.expectingOperator = true;
        context.expectingField = false;
        context.expectingValue = false;
        context.expectingLogical = false;
      } else if (token.type === 'operator') {
        context.expectingValue = true;
        context.expectingField = false;
        context.expectingOperator = false;
        context.expectingLogical = false;
      } else if (token.type === 'value') {
        context.expectingLogical = true;
        context.expectingField = false;
        context.expectingOperator = false;
        context.expectingValue = false;
      } else if (token.type === 'logical') {
        context.expectingField = true;
        context.expectingOperator = false;
        context.expectingValue = false;
        context.expectingLogical = false;
      } else if (token.type === 'parenthesis') {
        if (token.value === '(') {
          context.parenthesesLevel++;
          context.expectingField = true;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = false;
        } else {
          context.parenthesesLevel--;
          context.expectingLogical = true;
          context.expectingField = false;
          context.expectingOperator = false;
          context.expectingValue = false;
        }
      } else if (token.type === 'keyword') {
        if (token.value.toUpperCase() === 'ORDER') {
          context.inOrderBy = true;
          context.expectingField = false;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = false;
        } else if (token.value.toUpperCase() === 'BY') {
          context.expectingField = true;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = false;
        }
      }
    }

    return tokens;
  }

  /**
   * Parse tokens into a QL query object
   */
  parse(input: string): QLQuery {
    const errors: string[] = [];
    let whereExpression: QLExpression | undefined = undefined;
    let orderBy: QLOrderBy[] = [];

    try {
      // Split input into WHERE and ORDER BY parts
      const { whereClause, orderByClause } = this.splitQuery(input);

      // Parse WHERE clause if present
      if (whereClause.trim()) {
        const tokens = this.tokenize(whereClause);
        const expressionParser = new QLExpressionParser();
        const result = expressionParser.parse(tokens);
        whereExpression = result || undefined;
      }

      // Parse ORDER BY clause if present
      if (orderByClause.trim()) {
        orderBy = this.parseOrderBy(orderByClause);
      }
    } catch (error) {
      // Capture parse errors
      errors.push(error instanceof Error ? error.message : 'Parse error');
    }

    return {
      where: whereExpression || undefined,
      orderBy,
      raw: input,
      valid: errors.length === 0,
      errors,
    };
  }

  private splitQuery(input: string): { whereClause: string; orderByClause: string } {
    // Find ORDER BY keyword (case insensitive)
    const orderByMatch = input.match(/\s*ORDER\s+BY\s+/i);

    if (!orderByMatch) {
      return { whereClause: input, orderByClause: '' };
    }

    const orderByIndex = orderByMatch.index! + orderByMatch[0].length;
    const whereClause = input.substring(0, orderByMatch.index!);
    const orderByClause = input.substring(orderByIndex);

    return { whereClause, orderByClause };
  }

  private parseOrderBy(orderByClause: string): QLOrderBy[] {
    const orderByItems: QLOrderBy[] = [];

    // Split by comma for multiple ORDER BY fields
    const items = orderByClause.split(',').map(item => item.trim());

    for (const item of items) {
      const parts = item.trim().split(/\s+/);

      if (parts.length === 0 || !parts[0]) {
        continue;
      }

      const field = parts[0];
      const direction = parts.length > 1 && parts[1].toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      orderByItems.push({
        field,
        direction: direction as SortDirection,
      });
    }

    return orderByItems;
  }
}
