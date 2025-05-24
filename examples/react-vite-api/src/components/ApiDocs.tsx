import React, { useState, useEffect } from 'react';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  parameters?: { name: string; type: string; description: string; required?: boolean }[];
  requestBody?: { type: string; description: string; example?: any };
  response: { type: string; description: string; example?: any };
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    description: 'Health check endpoint to verify API is running',
    response: {
      type: 'object',
      description: 'Health status',
      example: {
        success: true,
        message: 'QL Input API Server is running',
        timestamp: '2024-01-15T10:30:00.000Z'
      }
    }
  },
  {
    method: 'GET',
    path: '/api/issues',
    description: 'Get all issues without filtering',
    response: {
      type: 'object',
      description: 'List of all issues',
      example: {
        success: true,
        data: [
          {
            id: 1,
            title: 'Fix login bug',
            status: 'open',
            priority: 4,
            assignee: 'john.doe',
            project: 'project-alpha',
            tags: ['bug', 'critical'],
            created: '2024-01-15T10:30:00Z'
          }
        ],
        total: 5
      }
    }
  },
  {
    method: 'POST',
    path: '/api/issues/search',
    description: 'Search and filter issues using QL query',
    requestBody: {
      type: 'object',
      description: 'Search request with QL query',
      example: {
        query: 'status = "open" AND priority >= 3 ORDER BY created DESC'
      }
    },
    response: {
      type: 'object',
      description: 'Filtered issues with query information',
      example: {
        success: true,
        data: [
          {
            id: 1,
            title: 'Fix login bug',
            status: 'open',
            priority: 4,
            assignee: 'john.doe',
            project: 'project-alpha',
            tags: ['bug', 'critical'],
            created: '2024-01-15T10:30:00Z'
          }
        ],
        total: 1,
        query: {
          raw: 'status = "open" AND priority >= 3 ORDER BY created DESC',
          parsed: '{ /* QLQuery object */ }',
          mongodb: { status: 'open', priority: { $gte: 3 } },
          sql: 'status = \'open\' AND priority >= 3 ORDER BY created DESC'
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/suggestions/users',
    description: 'Get user suggestions for autocomplete',
    parameters: [
      {
        name: 'q',
        type: 'string',
        description: 'Search query to filter users',
        required: false
      }
    ],
    response: {
      type: 'object',
      description: 'List of user suggestions',
      example: {
        success: true,
        data: [
          { value: 'john.doe', label: 'John Doe' },
          { value: 'jane.smith', label: 'Jane Smith' }
        ]
      }
    }
  },
  {
    method: 'GET',
    path: '/api/suggestions/projects',
    description: 'Get project suggestions for autocomplete',
    parameters: [
      {
        name: 'q',
        type: 'string',
        description: 'Search query to filter projects',
        required: false
      }
    ],
    response: {
      type: 'object',
      description: 'List of project suggestions',
      example: {
        success: true,
        data: [
          { value: 'project-alpha', label: 'Project Alpha' },
          { value: 'project-beta', label: 'Project Beta' }
        ]
      }
    }
  }
];

function ApiDocs() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setServerStatus(data.success ? 'online' : 'offline');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  const testEndpoint = async (endpoint: ApiEndpoint) => {
    try {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await fetch(endpoint.path);
      } else if (endpoint.method === 'POST') {
        response = await fetch(endpoint.path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(endpoint.requestBody?.example || {}),
        });
      }

      if (response) {
        const data = await response.json();
        alert(`Response from ${endpoint.path}:\n\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      alert(`Error testing ${endpoint.path}:\n\n${error}`);
    }
  };

  return (
    <div>
      <div className="search-section">
        <h2>API Documentation</h2>
        <p>
          This example includes a mock API server that demonstrates how to integrate QL queries 
          with backend services. The server runs on port 3001 and provides endpoints for 
          searching issues and fetching suggestions.
        </p>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginTop: '1rem',
          padding: '1rem',
          background: serverStatus === 'online' ? '#f0fff4' : '#fed7d7',
          border: `1px solid ${serverStatus === 'online' ? '#9ae6b4' : '#fc8181'}`,
          borderRadius: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: serverStatus === 'online' ? '#38a169' : serverStatus === 'offline' ? '#e53e3e' : '#a0aec0'
          }}></div>
          <span>
            API Server Status: {' '}
            <strong>
              {serverStatus === 'checking' && 'Checking...'}
              {serverStatus === 'online' && 'Online'}
              {serverStatus === 'offline' && 'Offline'}
            </strong>
          </span>
          <button className="button secondary" onClick={checkServerStatus}>
            Refresh
          </button>
        </div>

        {serverStatus === 'offline' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#feebc8', 
            border: '1px solid #f6ad55', 
            borderRadius: '8px',
            color: '#7b341e'
          }}>
            <strong>Server not running!</strong> To start the API server, run:
            <pre style={{ marginTop: '0.5rem', background: '#1a202c', color: '#e2e8f0', padding: '0.5rem', borderRadius: '4px' }}>
              npm run server
            </pre>
            Or run both frontend and backend together:
            <pre style={{ marginTop: '0.5rem', background: '#1a202c', color: '#e2e8f0', padding: '0.5rem', borderRadius: '4px' }}>
              npm run dev:full
            </pre>
          </div>
        )}
      </div>

      <div className="results-section">
        <h3>API Endpoints</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div>
            <h4>Endpoints</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {apiEndpoints.map((endpoint, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: selectedEndpoint === endpoint ? '#ebf8ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: endpoint.method === 'GET' ? '#c6f6d5' : '#bee3f8',
                      color: endpoint.method === 'GET' ? '#22543d' : '#2a4365'
                    }}>
                      {endpoint.method}
                    </span>
                    <span style={{ fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace', fontSize: '0.875rem' }}>
                      {endpoint.path}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.25rem' }}>
                    {endpoint.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            {selectedEndpoint ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <h4>{selectedEndpoint.method} {selectedEndpoint.path}</h4>
                  <button 
                    className="button" 
                    onClick={() => testEndpoint(selectedEndpoint)}
                    disabled={serverStatus !== 'online'}
                  >
                    Test Endpoint
                  </button>
                </div>
                
                <p style={{ marginBottom: '1rem', color: '#718096' }}>
                  {selectedEndpoint.description}
                </p>

                {selectedEndpoint.parameters && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h5>Parameters</h5>
                    <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '6px' }}>
                      {selectedEndpoint.parameters.map((param, index) => (
                        <div key={index} style={{ marginBottom: '0.5rem' }}>
                          <code>{param.name}</code> ({param.type})
                          {param.required && <span style={{ color: '#e53e3e' }}> *</span>}
                          <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                            {param.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEndpoint.requestBody && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h5>Request Body</h5>
                    <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '6px' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        Type: <code>{selectedEndpoint.requestBody.type}</code>
                      </div>
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                        {selectedEndpoint.requestBody.description}
                      </div>
                      {selectedEndpoint.requestBody.example && (
                        <pre style={{ background: '#1a202c', color: '#e2e8f0', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                          {JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h5>Response</h5>
                  <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      Type: <code>{selectedEndpoint.response.type}</code>
                    </div>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                      {selectedEndpoint.response.description}
                    </div>
                    {selectedEndpoint.response.example && (
                      <pre style={{ background: '#1a202c', color: '#e2e8f0', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                        {JSON.stringify(selectedEndpoint.response.example, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                Select an endpoint to view its documentation
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiDocs;
