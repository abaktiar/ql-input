import type { QLToken, QLExpression, QLCondition, QLLogicalGroup, OperatorType, LogicalOperatorType } from './ql-types';

/**
 * Enhanced QL Expression Parser
 * Builds hierarchical expression trees that properly represent logical grouping
 */
export class QLExpressionParser {
  private tokens: QLToken[] = [];
  private position = 0;

  parse(tokens: QLToken[]): QLExpression | null {
    this.tokens = tokens.filter((t) => t.type !== 'whitespace'); // Remove whitespace for easier parsing
    this.position = 0;

    if (this.tokens.length === 0) {
      return null;
    }

    // Check if all tokens are keywords (like ORDER BY) - if so, return null
    const hasNonKeywordTokens = this.tokens.some((token) => token.type !== 'keyword' && token.type !== 'whitespace');

    if (!hasNonKeywordTokens) {
      return null;
    }

    return this.parseExpression();
  }

  private parseExpression(): QLExpression {
    return this.parseOrExpression();
  }

  private parseOrExpression(): QLExpression {
    let left = this.parseAndExpression();

    while (this.current()?.type === 'logical' && this.current()?.value === 'OR') {
      this.advance(); // consume OR
      const right = this.parseAndExpression();

      // Create OR group
      if (this.isLogicalGroup(left) && left.operator === 'OR') {
        // Extend existing OR group
        left.conditions.push(right);
      } else {
        // Create new OR group
        left = {
          operator: 'OR' as LogicalOperatorType,
          conditions: [left, right],
        };
      }
    }

    return left;
  }

  private parseAndExpression(): QLExpression {
    let left = this.parsePrimaryExpression();

    while (this.current()?.type === 'logical' && this.current()?.value === 'AND') {
      this.advance(); // consume AND
      const right = this.parsePrimaryExpression();

      // Create AND group
      if (this.isLogicalGroup(left) && left.operator === 'AND') {
        // Extend existing AND group
        left.conditions.push(right);
      } else {
        // Create new AND group
        left = {
          operator: 'AND' as LogicalOperatorType,
          conditions: [left, right],
        };
      }
    }

    return left;
  }

  private parsePrimaryExpression(): QLExpression {
    const token = this.current();

    if (!token) {
      throw new Error('Unexpected end of input');
    }

    // Handle NOT operator
    if (token.type === 'logical' && token.value === 'NOT') {
      this.advance(); // consume NOT
      const expr = this.parsePrimaryExpression();

      // Apply NOT to the expression
      if ('operator' in expr && 'conditions' in expr) {
        // It's a logical group
        return { ...expr, not: true };
      } else {
        // It's a condition
        return { ...expr, not: true };
      }
    }

    // Handle parentheses
    if (token.type === 'parenthesis' && token.value === '(') {
      this.advance(); // consume (
      const expr = this.parseExpression();

      if (this.current()?.type !== 'parenthesis' || this.current()?.value !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      this.advance(); // consume )

      return expr;
    }

    // Handle field conditions
    if (token.type === 'field') {
      return this.parseCondition();
    }

    throw new Error(`Unexpected token: ${token.type} "${token.value}"`);
  }

  private parseCondition(): QLCondition {
    const fieldToken = this.current();
    if (!fieldToken || fieldToken.type !== 'field') {
      throw new Error('Expected field name');
    }

    const condition: Partial<QLCondition> = {
      field: fieldToken.value,
    };

    this.advance(); // consume field

    // Parse operator
    const operatorToken = this.current();
    if (!operatorToken || operatorToken.type !== 'operator') {
      throw new Error('Expected operator');
    }

    condition.operator = operatorToken.value as OperatorType;
    this.advance(); // consume operator

    // Parse value (if operator requires one)
    if (this.operatorRequiresValue(condition.operator)) {
      condition.value = this.parseValue(condition.operator);
    }

    return condition as QLCondition;
  }

  private parseValue(operator: OperatorType): string | string[] {
    // Handle IN/NOT IN lists
    if (operator === 'IN' || operator === 'NOT IN') {
      return this.parseInList();
    }

    // Handle single values
    const token = this.current();
    if (!token) {
      throw new Error('Expected value');
    }

    if (token.type === 'value' || token.type === 'field' || token.type === 'function' || token.type === 'unknown') {
      let value = token.value;

      // Check if this is a function call (token followed by parentheses)
      const nextToken = this.tokens[this.position + 1];
      if (nextToken && nextToken.type === 'parenthesis' && nextToken.value === '(') {
        // This is a function call, include the parentheses
        this.advance(); // consume function name
        this.advance(); // consume opening parenthesis

        // Look for closing parenthesis
        const closingToken = this.current();
        if (closingToken && closingToken.type === 'parenthesis' && closingToken.value === ')') {
          this.advance(); // consume closing parenthesis
          return value + '()';
        } else {
          throw new Error('Expected closing parenthesis for function call');
        }
      }

      // Remove quotes if present (for regular values)
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      this.advance();
      return value;
    }

    throw new Error(`Expected value, got ${token.type} "${token.value}"`);
  }

  private parseInList(): string[] {
    // Expect opening parenthesis
    if (this.current()?.type !== 'parenthesis' || this.current()?.value !== '(') {
      throw new Error('Expected opening parenthesis for IN list');
    }
    this.advance(); // consume (

    const values: string[] = [];

    while (this.current() && !(this.current()?.type === 'parenthesis' && this.current()?.value === ')')) {
      const token = this.current();

      if (token?.type === 'value' || token?.type === 'field' || token?.type === 'function' || token?.type === 'unknown') {
        let value = token.value;

        // Check if this is a function call (token followed by parentheses)
        const nextToken = this.tokens[this.position + 1];
        if (nextToken && nextToken.type === 'parenthesis' && nextToken.value === '(') {
          // This is a function call, include the parentheses
          this.advance(); // consume function name
          this.advance(); // consume opening parenthesis

          // Look for closing parenthesis
          const closingToken = this.current();
          if (closingToken && closingToken.type === 'parenthesis' && closingToken.value === ')') {
            this.advance(); // consume closing parenthesis
            value = value + '()';
          } else {
            throw new Error('Expected closing parenthesis for function call in IN list');
          }
        } else {
          // Remove quotes if present (for regular values)
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          this.advance();
        }

        values.push(value);

        // Skip comma if present
        if (this.current()?.type === 'comma') {
          this.advance();
        }
      } else {
        throw new Error(`Unexpected token in IN list: ${token?.type} "${token?.value}"`);
      }
    }

    // Expect closing parenthesis
    if (this.current()?.type !== 'parenthesis' || this.current()?.value !== ')') {
      throw new Error('Expected closing parenthesis for IN list');
    }
    this.advance(); // consume )

    return values;
  }

  private operatorRequiresValue(operator: OperatorType): boolean {
    return !['IS EMPTY', 'IS NOT EMPTY'].includes(operator);
  }

  private current(): QLToken | undefined {
    return this.tokens[this.position];
  }

  private advance(): void {
    this.position++;
  }

  private isLogicalGroup(expr: QLExpression): expr is QLLogicalGroup {
    return 'operator' in expr && 'conditions' in expr;
  }
}
