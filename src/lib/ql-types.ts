// Core types for QL (Query Language) input component

// Field types
export type FieldType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'option' | 'multiselect' | 'user';

// Operators
export type OperatorType =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | '~'
  | '!~'
  | 'IN'
  | 'NOT IN'
  | 'IS EMPTY'
  | 'IS NOT EMPTY'
  | 'WAS'
  | 'WAS IN'
  | 'WAS NOT IN'
  | 'CHANGED';

export type LogicalOperatorType = 'AND' | 'OR' | 'NOT';

export type SortDirection = 'ASC' | 'DESC';

export interface QLField {
  name: string;
  displayName: string;
  type: FieldType;
  operators: OperatorType[];
  sortable?: boolean;
  description?: string;
  // For option/multiselect fields
  options?: QLValue[];
  // For async value suggestions
  asyncValueSuggestions?: boolean;
}

export interface QLValue {
  value: string;
  displayValue?: string;
  description?: string;
}

export interface QLFunction {
  name: string;
  displayName: string;
  description?: string;
  parameters?: {
    name: string;
    type: FieldType;
    required: boolean;
    description?: string;
  }[];
}

export interface QLSuggestion {
  type: 'field' | 'operator' | 'value' | 'logical' | 'keyword' | 'function' | 'parenthesis' | 'comma';
  value: string;
  displayValue?: string;
  description?: string;
  insertText?: string; // What to actually insert (may differ from value)
  category?: string;
}

export interface QLToken {
  type:
    | 'field'
    | 'operator'
    | 'value'
    | 'logical'
    | 'keyword'
    | 'function'
    | 'parenthesis'
    | 'comma'
    | 'whitespace'
    | 'unknown';
  value: string;
  start: number;
  end: number;
  valid?: boolean;
  error?: string;
}

// Basic condition (leaf node)
export interface QLCondition {
  field: string;
  operator: OperatorType;
  value?: string | string[];
  not?: boolean;
}

// Logical group (branch node)
export interface QLLogicalGroup {
  operator: LogicalOperatorType; // 'AND' | 'OR'
  conditions: (QLCondition | QLLogicalGroup)[];
  not?: boolean;
}

// Expression can be either a single condition or a logical group
export type QLExpression = QLCondition | QLLogicalGroup;

export interface QLOrderBy {
  field: string;
  direction: SortDirection;
}

export interface QLQuery {
  where?: QLExpression; // Root expression (can be condition or logical group)
  orderBy?: QLOrderBy[];
  raw: string;
  valid: boolean;
  errors: string[];
}

export interface QLInputConfig {
  fields: QLField[];
  functions?: QLFunction[];
  operators?: OperatorType[];
  logicalOperators?: LogicalOperatorType[];
  keywords?: string[];
  maxSuggestions?: number;
  debounceMs?: number;
  caseSensitive?: boolean;
  allowParentheses?: boolean;
  allowOrderBy?: boolean;
  allowFunctions?: boolean;
}

export interface QLInputProps {
  value?: string;
  onChange?: (value: string, query: QLQuery) => void;
  onExecute?: (query: QLQuery) => void;
  config: QLInputConfig;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Async value suggestions
  getAsyncValueSuggestions?: (field: string, typedValue: string) => Promise<QLValue[]>;
  // Predefined value suggestions
  getPredefinedValueSuggestions?: (field: string) => QLValue[];
}

// Parser context for tracking current position and state
export interface ParseContext {
  input: string;
  position: number;
  tokens: QLToken[];
  currentToken?: QLToken;
  expectingField: boolean;
  expectingOperator: boolean;
  expectingValue: boolean;
  expectingLogical: boolean;
  parenthesesLevel: number;
  inOrderBy: boolean;
  lastField?: string;
}

// Suggestion context for determining what to suggest
export interface SuggestionContext {
  input: string;
  cursorPosition: number;
  tokens: QLToken[];
  currentToken?: QLToken;
  previousToken?: QLToken;
  nextToken?: QLToken;
  expectingField: boolean;
  expectingOperator: boolean;
  expectingValue: boolean;
  expectingLogical: boolean;
  inOrderBy: boolean;
  parenthesesLevel: number;
  inInList: boolean;
  lastField?: string;
  lastOperator?: string;
  partialInput?: string;
}

export interface ValidationError {
  message: string;
  start: number;
  end: number;
  severity: 'error' | 'warning';
}

export interface QLInputState {
  value: string;
  tokens: QLToken[];
  suggestions: QLSuggestion[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  cursorPosition: number;
  query: QLQuery;
  validationErrors: ValidationError[];
  isLoading: boolean;
}
