// Core types for JQL (JIRA Query Language) input component

export type FieldType = 'text' | 'number' | 'date' | 'datetime' | 'user' | 'option' | 'multiselect';

export type OperatorType =
  | '='
  | '!='
  | '<>'
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
  | 'IS NULL'
  | 'IS NOT NULL';

export type LogicalOperatorType = 'AND' | 'OR' | 'NOT';

export type SortDirection = 'ASC' | 'DESC';

export interface JQLField {
  name: string;
  displayName: string;
  type: FieldType;
  operators: OperatorType[];
  sortable?: boolean;
  description?: string;
  // For option/multiselect fields
  options?: JQLValue[];
  // For async value suggestions
  asyncValueSuggestions?: boolean;
}

export interface JQLValue {
  value: string;
  displayValue?: string;
  description?: string;
}

export interface JQLFunction {
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

export interface JQLSuggestion {
  type: 'field' | 'operator' | 'value' | 'logical' | 'keyword' | 'function' | 'parenthesis' | 'comma';
  value: string;
  displayValue?: string;
  description?: string;
  insertText?: string; // What to actually insert (may differ from value)
  category?: string;
}

export interface JQLToken {
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
export interface JQLCondition {
  field: string;
  operator: OperatorType;
  value?: string | string[];
  not?: boolean;
}

// Logical group (branch node)
export interface JQLLogicalGroup {
  operator: LogicalOperatorType; // 'AND' | 'OR'
  conditions: (JQLCondition | JQLLogicalGroup)[];
  not?: boolean;
}

// Expression can be either a single condition or a logical group
export type JQLExpression = JQLCondition | JQLLogicalGroup;

export interface JQLOrderBy {
  field: string;
  direction: SortDirection;
}

export interface JQLQuery {
  where?: JQLExpression; // Root expression (can be condition or logical group)
  orderBy?: JQLOrderBy[];
  raw: string;
  valid: boolean;
  errors: string[];
}

export interface JQLInputConfig {
  fields: JQLField[];
  functions?: JQLFunction[];
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

export interface JQLInputProps {
  value?: string;
  onChange?: (value: string, query: JQLQuery) => void;
  onExecute?: (query: JQLQuery) => void;
  config: JQLInputConfig;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // Async value suggestions
  getAsyncValueSuggestions?: (field: string, typedValue: string) => Promise<JQLValue[]>;
  // Predefined value suggestions
  getPredefinedValueSuggestions?: (field: string) => JQLValue[];
}

// Parser context for tracking current position and state
export interface ParseContext {
  input: string;
  position: number;
  tokens: JQLToken[];
  currentToken?: JQLToken;
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
  tokens: JQLToken[];
  currentToken?: JQLToken;
  previousToken?: JQLToken;
  nextToken?: JQLToken;
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

export interface JQLInputState {
  value: string;
  tokens: JQLToken[];
  suggestions: JQLSuggestion[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  cursorPosition: number;
  query: JQLQuery;
  validationErrors: ValidationError[];
  isLoading: boolean;
}
