# Pursuit Family App

A private family social network that leverages AI and interactive visualization to help families connect, preserve memories, and understand their genealogical relationships.

## Latest Updates
- Implemented PostgreSQL integration with Drizzle ORM for persistent data storage
- Enhanced family tree visualization with improved responsiveness and unique colors
- Added JWT authentication system with bcrypt password hashing
- Created CSV data import utilities for bulk data loading
- Added automated testing for API endpoints and authentication

## Project Overview

The Pursuit Family App is designed to help families maintain connections and preserve their shared history in today's digital world. The application supports modern family structures with flexible relationship definitions, providing tools for visualization, communication, and coordination.

### Key Goals

- Support non-traditional family structures with custom relationship types
- Provide intuitive visualization of complex family relationships
- Integrate AI for data validation and relationship insights
- Create secure spaces for sharing sensitive family documents
- Facilitate family coordination through events and help requests

## Features

### Currently Implemented

- **Interactive Family Tree Visualization**: 
  - Zoomable and pannable canvas with intuitive navigation
  - Color-coded relationships (biological, adoptive, step)
  - Detail view for each family member
  - Edit capabilities for family member information

- **AI-Powered Validation**: 
  - OpenAI integration for validating family member data
  - Intelligent suggestions for inconsistent relationship information
  - Real-time feedback during member addition/editing

- **Advanced Search Functionality**: 
  - Find family members by name or role
  - Instant results with focused navigation to selected members
  - Searchable relationships and connections

- **Relationship Insights**: 
  - Detailed view of connections between members
  - Visualization of relationship paths
  - Support for complex relationship types

- **Authentication & Authorization**:
  - User authentication with JWT tokens
  - Secure password hashing with bcrypt
  - Role-based access controls for sensitive information

- **Database Integration**:
  - PostgreSQL database for persistent data storage
  - Drizzle ORM for type-safe database operations
  - Schema migrations and data seeding

- **CSV Data Import**:
  - Bulk import of family members, relationships, and events
  - Data validation and transformation
  - Customizable import process

### Planned Features

- **Event Planning**: 
  - Calendar for family events
  - RSVP tracking and notifications
  - Recurring event management
  
- **Document Sharing**: 
  - Secure storage for important family documents
  - Role-based access controls
  - AI-powered document redaction for sensitive information
  
- **Help Requests**: 
  - Coordination system for family assistance
  - Volunteer management
  - Scheduling and reminder functionality
  
- **Private Messaging**: 
  - Secure communication between family members
  - Group chat capabilities
  - Media sharing options

## Technology Stack

- **Frontend**: 
  - React 18 with TypeScript
  - Tailwind CSS for styling
  - Shadcn/UI component library
  - Responsive design for mobile/desktop

- **Backend**: 
  - Express.js with RESTful API
  - PostgreSQL database with Drizzle ORM
  - JWT authentication
  - TypeScript for type safety
  
- **State Management**: 
  - TanStack Query (React Query) for data fetching
  - React Context for global state
  
- **Form Handling**: 
  - React Hook Form with Zod validation
  - Client and server-side validation

- **AI Integration**: 
  - OpenAI API (GPT-4o) for data validation
  - Intelligent relationship suggestions
  
- **Data Visualization**:
  - Custom SVG-based family tree rendering
  - Interactive zoom/pan capabilities

- **Testing**:
  - Jest for unit and integration testing
  - Supertest for API endpoint testing
  - Mocked dependencies for isolated testing

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- An OpenAI API key for AI features

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ayishagisel/Family-Pursuit.git
   cd Family-Pursuit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/family_app
   OPENAI_API_KEY=your-api-key-here
   JWT_SECRET=your-jwt-secret-key
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5000` to view the application

### Running Tests

Run the tests using the provided script:
```bash
node scripts/run-tests.js
```

For coverage report:
```bash
node scripts/run-tests.js --coverage
```

For watch mode during development:
```bash
node scripts/run-tests.js --watch
```

## Usage

### Family Tree
- Navigate to the Family Tree page to view your complete family structure
- Click on any family member to see their details and relationships
- Use the "Add Member" button to create new family members
- Click "Edit" on a member's details to update their information
- Use the search button to quickly find specific family members
- Zoom in/out and pan around the tree using the controls or mouse/touch gestures
- Use "View Relations" to see detailed relationship connections

### Events (Coming Soon)
- View and create family events in a calendar interface
- Schedule recurring events like birthdays and anniversaries
- Send invitations and track attendance

### Documents (Coming Soon)
- Securely upload and share important family documents
- Control access with permission settings
- Search document contents with AI-assisted organization

### Help Needed (Coming Soon)
- Post requests for assistance from family members
- Volunteer to help with specific tasks
- Schedule and coordinate family support

### Messages (Coming Soon)
- Send private messages to individual family members
- Create group conversations for specific topics
- Share photos and media through the messaging system

## Development

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   ├── pages/        # Page components for each route
│   │   └── App.tsx       # Main application component
├── server/               # Express backend
│   ├── middleware/       # Express middleware including authentication
│   ├── services/         # Backend services including AI validation
│   ├── scripts/          # Utility scripts for data import and migration
│   ├── tests/            # Test files for API and services
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage interface
│   ├── db.ts             # Database connection setup
│   └── storage.db.ts     # Database storage implementation
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema and type definitions
└── data/                 # Sample CSV data for import
    ├── family_members.csv
    ├── relationships.csv
    ├── events.csv
    └── documents.csv
```

### Future Development

1. **WebSocket Integration**: 
   - Real-time updates and notifications
   - Live chat functionality
   - Collaborative family tree editing

2. **Mobile Application**:
   - React Native version for mobile platforms
   - Offline capabilities
   - Push notifications

3. **AI Enhancements**:
   - Family relationship analysis and suggestions
   - Historical event detection and timeline generation
   - Document classification and information extraction

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenAI](https://openai.com/) for AI capabilities via their GPT-4o model
- [shadcn/ui](https://ui.shadcn.com/) for accessible UI components
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database schema
- [TanStack Query](https://tanstack.com/query/v5/) for data fetching and state management
- [React Hook Form](https://react-hook-form.com/) for form handling
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [PostgreSQL](https://www.postgresql.org/) for database services
- [Jest](https://jestjs.io/) for testing framework