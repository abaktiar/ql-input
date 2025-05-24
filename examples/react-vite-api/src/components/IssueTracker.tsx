import React, { useState, useEffect } from 'react';
import { QLInput, QLQuery, QLInputConfig, QLValue } from '@abaktiar/ql-input';
import '@abaktiar/ql-input/styles.css';

interface Issue {
  id: number;
  title: string;
  status: string;
  priority: number;
  assignee: string | null;
  project: string;
  tags: string[];
  created: string;
}

interface SearchResponse {
  success: boolean;
  data: Issue[];
  total: number;
  query?: {
    raw: string;
    parsed: QLQuery;
    mongodb: Record<string, unknown>;
    sql: string;
  };
  error?: string;
  errors?: string[];
}

const config: QLInputConfig = {
  fields: [
    {
      name: 'status',
      displayName: 'Status',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' }
      ]
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'user',
      operators: ['=', '!=', 'IS EMPTY', 'IS NOT EMPTY'],
      asyncValueSuggestions: true
    },
    {
      name: 'project',
      displayName: 'Project',
      type: 'option',
      operators: ['=', '!=', 'IN', 'NOT IN'],
      asyncValueSuggestions: true
    },
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'number',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true,
      options: [
        { value: '1', label: 'Low' },
        { value: '2', label: 'Medium' },
        { value: '3', label: 'High' },
        { value: '4', label: 'Critical' }
      ]
    },
    {
      name: 'title',
      displayName: 'Title',
      type: 'text',
      operators: ['~', '!~', 'IS EMPTY', 'IS NOT EMPTY']
    },
    {
      name: 'created',
      displayName: 'Created Date',
      type: 'date',
      operators: ['=', '!=', '>', '<', '>=', '<='],
      sortable: true
    },
    {
      name: 'tags',
      displayName: 'Tags',
      type: 'multiselect',
      operators: ['IN', 'NOT IN'],
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'feature', label: 'Feature' },
        { value: 'enhancement', label: 'Enhancement' },
        { value: 'documentation', label: 'Documentation' },
        { value: 'security', label: 'Security' },
        { value: 'performance', label: 'Performance' },
        { value: 'critical', label: 'Critical' },
        { value: 'audit', label: 'Audit' }
      ]
    }
  ],
  maxSuggestions: 10,
  caseSensitive: false,
  allowParentheses: true,
  allowOrderBy: true,
  allowFunctions: true
};

function IssueTracker() {
  const [query, setQuery] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [showQueryInfo, setShowQueryInfo] = useState(false);

  // Load all issues on component mount
  useEffect(() => {
    loadAllIssues();
  }, []);

  const loadAllIssues = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/issues');
      const data = await response.json();

      if (data.success) {
        setIssues(data.data);
        setSearchResponse(data);
      } else {
        setError('Failed to load issues');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (queryString: string, parsedQuery: QLQuery) => {
    if (!parsedQuery.valid && queryString.trim()) {
      setError(`Invalid query: ${parsedQuery.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/issues/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryString.trim() || undefined
        }),
      });

      const data: SearchResponse = await response.json();

      if (data.success) {
        setIssues(data.data);
        setSearchResponse(data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getAsyncValueSuggestions = async (field: string, typedValue: string): Promise<QLValue[]> => {
    try {
      let endpoint = '';
      if (field === 'assignee') {
        endpoint = '/api/suggestions/users';
      } else if (field === 'project') {
        endpoint = '/api/suggestions/projects';
      } else {
        return [];
      }

      const response = await fetch(`${endpoint}?q=${encodeURIComponent(typedValue)}`);
      const data = await response.json();

      return data.success ? data.data : [];
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      return [];
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleQueryExecute = (parsedQuery: QLQuery) => {
    handleSearch(query, parsedQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setError(null);
    loadAllIssues();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityLabel = (priority: number) => {
    const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
    return labels[priority as keyof typeof labels] || 'Unknown';
  };

  return (
    <div>
      <div className="search-section">
        <h2>Search Issues</h2>
        <p>
          Use the query builder to search and filter issues. Try examples like:
          <br />
          <code>status = "open" AND priority &gt;= 3</code> or <code>assignee IS EMPTY ORDER BY priority DESC</code>
        </p>

        <QLInput
          config={config}
          value={query}
          onChange={handleQueryChange}
          onExecute={handleQueryExecute}
          getAsyncValueSuggestions={getAsyncValueSuggestions}
          placeholder="Search issues... e.g., status = 'open' AND assignee = currentUser()"
        />

        <div className="search-controls">
          <button
            className="button"
            onClick={() => handleQueryExecute({ raw: query, valid: true, errors: [] } as QLQuery)}
            disabled={loading}
          >
            {loading && <div className="spinner"></div>}
            Search
          </button>
          <button className="button secondary" onClick={clearSearch}>
            Clear
          </button>
          <button
            className="button secondary"
            onClick={() => setShowQueryInfo(!showQueryInfo)}
          >
            {showQueryInfo ? 'Hide' : 'Show'} Query Info
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {showQueryInfo && searchResponse?.query && (
          <div className="query-info">
            <h4>Query Information</h4>
            <div>
              <strong>Raw Query:</strong> {searchResponse.query.raw}
            </div>
            <div>
              <strong>Valid:</strong> {searchResponse.query.parsed.valid ? 'Yes' : 'No'}
            </div>
            {searchResponse.query.parsed.errors.length > 0 && (
              <div>
                <strong>Errors:</strong> {searchResponse.query.parsed.errors.join(', ')}
              </div>
            )}
            <div>
              <strong>MongoDB Query:</strong>
              <pre>{JSON.stringify(searchResponse.query.mongodb, null, 2)}</pre>
            </div>
            <div>
              <strong>SQL Query:</strong>
              <pre>{searchResponse.query.sql}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="results-section">
        <div className="results-header">
          <h3>Issues</h3>
          <div className="results-count">
            {loading ? 'Loading...' : `${issues.length} issue(s) found`}
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            Loading issues...
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div className="empty-state">
            <h3>No issues found</h3>
            <p>Try adjusting your search criteria or clear the search to see all issues.</p>
          </div>
        )}

        {!loading && issues.map((issue) => (
          <div key={issue.id} className="issue-card">
            <div className="issue-header">
              <div className="issue-title">{issue.title}</div>
            </div>

            <div className="issue-meta">
              <span className={`status-badge status-${issue.status}`}>
                {issue.status}
              </span>
              <span className={`priority-badge priority-${issue.priority}`}>
                Priority: {getPriorityLabel(issue.priority)}
              </span>
              <span>Assignee: {issue.assignee || 'Unassigned'}</span>
              <span>Project: {issue.project}</span>
              <span>Created: {formatDate(issue.created)}</span>
            </div>

            {issue.tags.length > 0 && (
              <div className="issue-tags">
                {issue.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default IssueTracker;
