import type { QLExpression, QLCondition, QLLogicalGroup } from './ql-types';

/**
 * Helper functions to work with QL expressions and convert them to database queries
 */

// Type guards
export function isCondition(expr: QLExpression): expr is QLCondition {
  return 'field' in expr && 'operator' in expr;
}

export function isLogicalGroup(expr: QLExpression): expr is QLLogicalGroup {
  return 'operator' in expr && 'conditions' in expr;
}

/**
 * Convert QL expression to Mongoose query
 */
export function toMongooseQuery(expr: QLExpression): any {
  if (isCondition(expr)) {
    return conditionToMongoDB(expr);
  } else if (isLogicalGroup(expr)) {
    return logicalGroupToMongoDB(expr);
  }
  return {};
}

function conditionToMongoDB(condition: QLCondition): any {
  const { field, operator, value } = condition;
  
  switch (operator) {
    case '=':
      return { [field]: value };
    case '!=':
      return { [field]: { $ne: value } };
    case '>':
      return { [field]: { $gt: value } };
    case '<':
      return { [field]: { $lt: value } };
    case '>=':
      return { [field]: { $gte: value } };
    case '<=':
      return { [field]: { $lte: value } };
    case 'IN':
      return { [field]: { $in: Array.isArray(value) ? value : [value] } };
    case 'NOT IN':
      return { [field]: { $nin: Array.isArray(value) ? value : [value] } };
    case '~':
      return { [field]: { $regex: value, $options: 'i' } };
    case '!~':
      return { [field]: { $not: { $regex: value, $options: 'i' } } };
    case 'IS EMPTY':
      return { $or: [{ [field]: null }, { [field]: { $exists: false } }] };
    case 'IS NOT EMPTY':
      return { [field]: { $ne: null, $exists: true } };
    default:
      return { [field]: value };
  }
}

function logicalGroupToMongoDB(group: QLLogicalGroup): any {
  const conditions = group.conditions.map(toMongooseQuery);
  
  if (group.operator === 'AND') {
    return { $and: conditions };
  } else if (group.operator === 'OR') {
    return { $or: conditions };
  }
  
  return {};
}

/**
 * Convert QL expression to SQL WHERE clause
 */
export function toSQLQuery(expr: QLExpression): string {
  if (isCondition(expr)) {
    return conditionToSQL(expr);
  } else if (isLogicalGroup(expr)) {
    return logicalGroupToSQL(expr);
  }
  return '';
}

function conditionToSQL(condition: QLCondition): string {
  const { field, operator, value } = condition;
  
  switch (operator) {
    case '=':
      return `${field} = '${value}'`;
    case '!=':
      return `${field} != '${value}'`;
    case '>':
      return `${field} > '${value}'`;
    case '<':
      return `${field} < '${value}'`;
    case '>=':
      return `${field} >= '${value}'`;
    case '<=':
      return `${field} <= '${value}'`;
    case 'IN':
      const inValues = Array.isArray(value) ? value : [value];
      return `${field} IN (${inValues.map(v => `'${v}'`).join(', ')})`;
    case 'NOT IN':
      const notInValues = Array.isArray(value) ? value : [value];
      return `${field} NOT IN (${notInValues.map(v => `'${v}'`).join(', ')})`;
    case '~':
      return `${field} LIKE '%${value}%'`;
    case '!~':
      return `${field} NOT LIKE '%${value}%'`;
    case 'IS EMPTY':
      return `${field} IS NULL`;
    case 'IS NOT EMPTY':
      return `${field} IS NOT NULL`;
    default:
      return `${field} = '${value}'`;
  }
}

function logicalGroupToSQL(group: QLLogicalGroup): string {
  const conditions = group.conditions.map(toSQLQuery);
  const operator = group.operator;
  
  if (conditions.length === 1) {
    return conditions[0];
  }
  
  return `(${conditions.join(` ${operator} `)})`;
}

/**
 * Count total conditions in an expression
 */
export function countConditions(expr: QLExpression): number {
  if (isCondition(expr)) {
    return 1;
  } else if (isLogicalGroup(expr)) {
    return expr.conditions.reduce((count, condition) => count + countConditions(condition), 0);
  }
  return 0;
}

/**
 * Get all field names used in an expression
 */
export function getUsedFields(expr: QLExpression): string[] {
  if (isCondition(expr)) {
    return [expr.field];
  } else if (isLogicalGroup(expr)) {
    return expr.conditions.flatMap(getUsedFields);
  }
  return [];
}

/**
 * Pretty print expression for debugging
 */
export function printExpression(expr: QLExpression, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (isCondition(expr)) {
    return `${spaces}${expr.field} ${expr.operator} ${Array.isArray(expr.value) ? `[${expr.value.join(', ')}]` : expr.value}`;
  } else if (isLogicalGroup(expr)) {
    const conditions = expr.conditions.map(c => printExpression(c, indent + 1)).join('\n');
    return `${spaces}${expr.operator}:\n${conditions}`;
  }
  
  return '';
}
