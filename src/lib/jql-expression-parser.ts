import type { JQLToken, JQLExpression, JQLCondition, JQLLogicalGroup, OperatorType, LogicalOperatorType } from './jql-types';

/**
 * Enhanced JQL Expression Parser
 * Builds hierarchical expression trees that properly represent logical grouping
 */
export class JQLExpressionParser {
  private tokens: JQLToken[] = [];
  private position = 0;

  parse(tokens: JQLToken[]): JQLExpression | null {
    this.tokens = tokens.filter(t => t.type !== 'whitespace'); // Remove whitespace for easier parsing
    this.position = 0;

    if (this.tokens.length === 0) {
      return null;
    }

    try {
      return this.parseExpression();
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  private parseExpression(): JQLExpression {
    return this.parseOrExpression();
  }

  private parseOrExpression(): JQLExpression {
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
          conditions: [left, right]
        };
      }
    }

    return left;
  }

  private parseAndExpression(): JQLExpression {
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
          conditions: [left, right]
        };
      }
    }

    return left;
  }

  private parsePrimaryExpression(): JQLExpression {
    const token = this.current();

    if (!token) {
      throw new Error('Unexpected end of input');
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

  private parseCondition(): JQLCondition {
    const fieldToken = this.current();
    if (!fieldToken || fieldToken.type !== 'field') {
      throw new Error('Expected field name');
    }

    const condition: Partial<JQLCondition> = {
      field: fieldToken.value
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

    return condition as JQLCondition;
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
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
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
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        values.push(value);
        this.advance();

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

  private current(): JQLToken | undefined {
    return this.tokens[this.position];
  }

  private advance(): void {
    this.position++;
  }

  private isLogicalGroup(expr: JQLExpression): expr is JQLLogicalGroup {
    return 'operator' in expr && 'conditions' in expr;
  }
}
