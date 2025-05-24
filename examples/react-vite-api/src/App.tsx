import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import IssueTracker from './components/IssueTracker';
import QueryPlayground from './components/QueryPlayground';
import ApiDocs from './components/ApiDocs';

function App() {
  const location = useLocation();

  return (
    <div className="container">
      <div className="header">
        <h1>QL Input - React + Vite + API</h1>
        <p>Full-stack example with real API integration and issue tracking</p>
      </div>

      <nav className="nav">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Issue Tracker
        </Link>
        <Link 
          to="/playground" 
          className={`nav-link ${location.pathname === '/playground' ? 'active' : ''}`}
        >
          Query Playground
        </Link>
        <Link 
          to="/api-docs" 
          className={`nav-link ${location.pathname === '/api-docs' ? 'active' : ''}`}
        >
          API Documentation
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<IssueTracker />} />
        <Route path="/playground" element={<QueryPlayground />} />
        <Route path="/api-docs" element={<ApiDocs />} />
      </Routes>
    </div>
  );
}

export default App;
