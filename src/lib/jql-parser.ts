import type {
  JQLToken,
  JQLQuery,
  JQLOrderBy,
  ParseContext,
  OperatorType,
  LogicalOperatorType,
  SortDirection,
  JQLInputConfig,
} from './jql-types';
import { JQLExpressionParser } from './jql-expression-parser';

// Keywords and operators
const LOGICAL_OPERATORS: LogicalOperatorType[] = ['AND', 'OR', 'NOT'];
const COMPARISON_OPERATORS: OperatorType[] = ['=', '!=', '<>', '>', '<', '>=', '<='];
const TEXT_OPERATORS: OperatorType[] = ['~', '!~'];
const LIST_OPERATORS: OperatorType[] = ['IN', 'NOT IN'];
const NULL_OPERATORS: OperatorType[] = ['IS EMPTY', 'IS NOT EMPTY', 'IS NULL', 'IS NOT NULL'];
const ALL_OPERATORS: OperatorType[] = [
  ...COMPARISON_OPERATORS,
  ...TEXT_OPERATORS,
  ...LIST_OPERATORS,
  ...NULL_OPERATORS,
];

const KEYWORDS = ['ORDER', 'BY', 'ASC', 'DESC'];
const SORT_DIRECTIONS: SortDirection[] = ['ASC', 'DESC'];

export class JQLParser {
  constructor(_config: JQLInputConfig) {
    // Config stored for future use if needed
  }

  /**
   * Tokenize the input string into JQL tokens
   */
  tokenize(input: string): JQLToken[] {
    const tokens: JQLToken[] = [];
    let position = 0;

    while (position < input.length) {
      const char = input[position];

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

      // Handle operators and keywords
      const remaining = input.slice(position);
      let matched = false;

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

      const word = input.slice(start, position);

      // Determine if it's a function (ends with parentheses)
      if (position < input.length && input[position] === '(') {
        tokens.push({
          type: 'function',
          value: word,
          start,
          end: position,
        });
      } else {
        // Could be field or value - context will determine
        tokens.push({
          type: 'unknown',
          value: word,
          start,
          end: position,
        });
      }
    }

    return this.classifyTokens(tokens);
  }

  /**
   * Classify unknown tokens based on context
   */
  private classifyTokens(tokens: JQLToken[]): JQLToken[] {
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

      if (token.type === 'comma') {
        // Commas don't change the context much, just continue
        continue;
      }

      if (token.type === 'parenthesis') {
        if (token.value === '(') {
          context.parenthesesLevel++;
          context.expectingField = true;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = false;
        } else {
          context.parenthesesLevel--;
          context.expectingField = false;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = true;
        }
        continue;
      }

      if (token.type === 'keyword') {
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
        continue;
      }

      if (token.type === 'logical') {
        context.expectingField = true;
        context.expectingOperator = false;
        context.expectingValue = false;
        context.expectingLogical = false;
        continue;
      }

      if (token.type === 'operator') {
        context.expectingField = false;
        context.expectingOperator = false;
        context.expectingValue = true;
        context.expectingLogical = false;
        continue;
      }

      if (token.type === 'value') {
        context.expectingField = false;
        context.expectingOperator = false;
        context.expectingValue = false;
        context.expectingLogical = true;
        continue;
      }

      if (token.type === 'unknown') {
        if (context.expectingField) {
          token.type = 'field';
          context.lastField = token.value;
          context.expectingField = false;
          context.expectingOperator = true;
          context.expectingValue = false;
          context.expectingLogical = false;
        } else if (context.expectingValue) {
          token.type = 'value';
          context.expectingField = false;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = true;
        } else if (context.inOrderBy && SORT_DIRECTIONS.includes(token.value.toUpperCase() as SortDirection)) {
          token.type = 'keyword';
          token.value = token.value.toUpperCase();
          context.expectingField = false;
          context.expectingOperator = false;
          context.expectingValue = false;
          context.expectingLogical = true;
          context.inOrderBy = false;
        }
      }
    }

    return tokens;
  }

  /**
   * Parse tokens into a JQL query object
   */
  parse(input: string): JQLQuery {
    const tokens = this.tokenize(input);
    const orderBy: JQLOrderBy[] = [];
    const errors: string[] = [];

    // Use new expression parser for hierarchical structure
    const expressionParser = new JQLExpressionParser();
    const whereExpression = expressionParser.parse(tokens);

    // Parse ORDER BY clause (simple implementation for now)
    // TODO: Enhance ORDER BY parsing if needed

    return {
      where: whereExpression || undefined,
      orderBy,
      raw: input,
      valid: errors.length === 0,
      errors,
    };
  }
}
