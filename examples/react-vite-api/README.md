# React + Vite + API Example

This is a comprehensive full-stack example demonstrating how to use `@abaktiar/ql-input` and `@abaktiar/ql-parser` in a real-world application with API integration.

## 🎯 What This Example Shows

- **Full-stack integration** - React frontend with Express.js backend
- **Real API integration** - Live search with QL query processing
- **Async value suggestions** - Server-side autocomplete for users and projects
- **Query conversion** - QL to MongoDB and SQL formats
- **Issue tracking system** - Real-world use case implementation
- **Interactive playground** - Query testing and experimentation
- **API documentation** - Complete endpoint documentation with testing

## 🏗️ Architecture

```
Frontend (React + Vite)     Backend (Express.js)
├── Issue Tracker          ├── Mock Database
├── Query Playground       ├── QL Parser Integration
├── API Documentation      ├── Search Endpoints
└── Real-time Search       └── Suggestion APIs
```

## 📦 Installation

```bash
cd examples/react-vite-api
npm install
```

## 🚀 Running the Example

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev:full
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### Option 2: Run Separately

**Start the backend API server:**
```bash
npm run server
```

**In another terminal, start the frontend:**
```bash
npm run dev
```

## 🔧 Features

### 1. Issue Tracker (`/`)
- **Real-time search** with QL queries
- **Async suggestions** for users and projects
- **Query validation** with error feedback
- **Results filtering** based on parsed queries
- **Query information** showing MongoDB and SQL conversions

### 2. Query Playground (`/playground`)
- **Interactive query testing** without data constraints
- **Real-time parsing** and validation
- **Multiple output formats** (Expression Tree, MongoDB, SQL)
- **Example queries** for learning
- **Tabbed interface** for different query formats

### 3. API Documentation (`/api-docs`)
- **Live API status** monitoring
- **Interactive endpoint testing**
- **Complete documentation** with examples
- **Request/response formats**
- **Parameter descriptions**

## 🔍 API Endpoints

### Issues
- `GET /api/issues` - Get all issues
- `POST /api/issues/search` - Search with QL query

### Suggestions
- `GET /api/suggestions/users?q=search` - User autocomplete
- `GET /api/suggestions/projects?q=search` - Project autocomplete

### Utility
- `GET /api/health` - Server health check

## 📊 Mock Data

The example includes realistic mock data:

### Issues
- 5 sample issues with different statuses, priorities, and assignments
- Tags, projects, and creation dates
- Realistic titles and metadata

### Users
- 5 mock users with names and emails
- Used for assignee suggestions

### Projects
- 3 mock projects with descriptions
- Used for project filtering

## 🎮 Usage Examples

### Basic Search
```
status = "open"
```

### Complex Filtering
```
(status = "open" OR status = "pending") AND priority >= 3
```

### Text Search
```
title ~ "bug" AND assignee IS NOT EMPTY
```

### Sorting
```
status = "open" ORDER BY priority DESC, created ASC
```

### Function Usage
```
assignee = currentUser() AND created >= startOfWeek()
```

## 🔧 Technical Implementation

### Frontend (React + TypeScript)
- **React Router** for navigation
- **TypeScript** for type safety
- **Vite** for fast development
- **CSS Modules** for styling
- **Async/await** for API calls

### Backend (Node.js + Express)
- **Express.js** server
- **CORS** enabled for development
- **QL Parser** integration
- **Mock data** with realistic filtering
- **Error handling** and validation

### Query Processing Flow
1. User types query in QL Input component
2. Component validates query in real-time
3. On search, query sent to `/api/issues/search`
4. Server parses query using `@abaktiar/ql-parser`
5. Server filters mock data based on parsed query
6. Results returned with query metadata
7. Frontend displays filtered results

### Async Suggestions Flow
1. User types in assignee or project field
2. Component calls `getAsyncValueSuggestions`
3. Function makes API call to suggestion endpoint
4. Server filters users/projects based on search term
5. Suggestions returned and displayed in dropdown

## 🎨 UI Features

### Responsive Design
- Mobile-friendly layout
- Flexible grid system
- Touch-friendly interactions

### Visual Feedback
- Loading states with spinners
- Error messages with styling
- Success/failure indicators
- Query validation status

### Interactive Elements
- Clickable example queries
- Tabbed interface for query formats
- Hover effects and transitions
- Real-time API status monitoring

## 🧪 Testing the API

### Using the UI
1. Go to API Documentation tab
2. Select an endpoint from the list
3. Click "Test Endpoint" to make a live API call
4. View the response in a popup

### Using curl
```bash
# Get all issues
curl http://localhost:3001/api/issues

# Search with QL query
curl -X POST http://localhost:3001/api/issues/search \
  -H "Content-Type: application/json" \
  -d '{"query": "status = \"open\" AND priority >= 3"}'

# Get user suggestions
curl "http://localhost:3001/api/suggestions/users?q=john"
```

## 🔄 Development Workflow

### Adding New Fields
1. Update field configuration in both frontend and backend
2. Add mock data for the new field
3. Update filtering logic in server
4. Test with various queries

### Adding New Endpoints
1. Add route to Express server
2. Update API documentation component
3. Add endpoint to apiEndpoints array
4. Test functionality

### Customizing UI
1. Modify CSS in `src/index.css`
2. Update component styles
3. Add new themes or color schemes

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
```bash
# Deploy server/ folder to your Node.js hosting service
# Set PORT environment variable if needed
```

## 🔗 Integration Ideas

This example can be extended for:
- **Real database integration** (MongoDB, PostgreSQL, etc.)
- **Authentication and authorization**
- **Real-time updates** with WebSockets
- **Advanced filtering** with more field types
- **Export functionality** for search results
- **Saved queries** and query history
- **Multi-tenant support**

## 📚 Learning Resources

- [QL Input Documentation](../../README-input.md)
- [QL Parser Documentation](../../README-parser.md)
- [React Router Documentation](https://reactrouter.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)

## 🐛 Troubleshooting

### API Server Not Starting
- Check if port 3001 is available
- Ensure all dependencies are installed
- Check console for error messages

### Frontend Not Connecting to API
- Verify API server is running on port 3001
- Check Vite proxy configuration
- Ensure CORS is properly configured

### Suggestions Not Loading
- Check network tab for API calls
- Verify suggestion endpoints are working
- Check async function implementation

This example provides a solid foundation for building production-ready applications with QL Input integration!
