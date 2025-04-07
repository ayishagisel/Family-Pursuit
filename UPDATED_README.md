# Pursuit Family App

A private family social network that leverages AI and interactive visualization to help families connect, preserve memories, and understand their genealogical relationships.

<!-- ![Family Tree Interface](screenshots/family-tree.png) -->
<!-- Screenshot will be added in the future -->

## Latest Updates (April 2025)
- ✅ Integrated PostgreSQL database with Drizzle ORM for robust data persistence
- ✅ Implemented complete authentication system with JWT tokens and password hashing
- ✅ Enhanced family tree visualization with dynamic zooming and relationship mapping
- ✅ Created secure document storage with permission controls
- ✅ Added event management with attendance tracking
- ✅ Built help request coordination system for family assistance
- ✅ Integrated AI-powered data validation for family relationships
- ✅ Developed comprehensive frontend components with responsive design

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

- **Authentication System**:
  - Secure user registration and login
  - Role-based access control (admin, user)
  - JWT token authentication
  - Password hashing with bcrypt

- **Event Management**: 
  - Calendar for family events
  - RSVP tracking and notifications
  - Recurring event management
  
- **Document Sharing**: 
  - Secure storage for important family documents
  - Role-based access controls
  - Document categorization and tagging
  
- **Help Requests**: 
  - Coordination system for family assistance
  - Volunteer management
  - Scheduling and reminder functionality
  
- **Private Messaging**: 
  - Secure communication between family members
  - Group chat capabilities
  - Read receipt tracking

## Technology Stack

- **Frontend**: 
  - React 18 with TypeScript
  - Tailwind CSS for styling
  - Shadcn/UI component library
  - Responsive design for mobile/desktop

- **Backend**: 
  - Express.js with RESTful API
  - PostgreSQL database with Drizzle ORM
  - TypeScript for type safety
  
- **State Management**: 
  - TanStack Query for data fetching
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

3. Create a `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your-api-key-here
   DATABASE_URL=postgresql://username:password@localhost:5432/family_app
   JWT_SECRET=your-secret-key-for-jwt
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open your browser to `http://localhost:5000` to view the application

## Usage

### Authentication
- Register a new account with username, email, and password
- Log in with your credentials
- Admin users have access to additional management features

### Family Tree
- Navigate to the Family Tree page to view your complete family structure
- Click on any family member to see their details and relationships
- Use the "Add Member" button to create new family members
- Click "Edit" on a member's details to update their information
- Use the search button to quickly find specific family members
- Zoom in/out and pan around the tree using the controls or mouse/touch gestures
- Use "View Relations" to see detailed relationship connections

### Events
- View and create family events in a calendar interface
- Schedule recurring events like birthdays and anniversaries
- Send invitations and track attendance
- Set reminders for upcoming events

### Documents
- Securely upload and share important family documents
- Categorize documents by type (legal, medical, financial, memories)
- Control access with permission settings
- Search document contents with AI-assisted organization

### Help Needed
- Post requests for assistance from family members
- Volunteer to help with specific tasks
- Schedule and coordinate family support
- Track completion status of help requests

### Messages
- Send private messages to individual family members
- Create group conversations for specific topics
- Track read status of messages
- Share photos and media through the messaging system

## Development

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   ├── pages/        # Page components for each route
│   │   └── App.tsx       # Main application component
├── server/               # Express backend
│   ├── middleware/       # Express middlewares (auth, validation)
│   ├── services/         # Backend services including AI validation
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage interface
│   └── db.ts             # Database connection and configuration
└── shared/               # Shared code between client and server
    └── schema.ts         # Database schema and type definitions
```

### Database Schema

The application uses a PostgreSQL database with the following main tables:

- **users**: Authentication and user management
- **family_members**: Core family member information
- **relationships**: Connections between family members
- **events**: Family gatherings and important dates
- **documents**: Shared family files and records
- **help_requests**: Family assistance coordination
- **messages**: Private communication between members

## AI Integration

The Pursuit Family App leverages OpenAI's GPT-4o model to enhance the user experience in multiple ways:

### Current AI Features

1. **Data Validation**
   - When adding or editing family members, the application validates the entered data for consistency
   - The AI checks if names, roles, and relationships make logical sense in a family context
   - Real-time warnings are displayed if potential issues are detected
   - Intelligent suggestions are provided to correct problematic entries

2. **Relationship Insights**
   - The application uses AI to analyze the complex web of family relationships
   - When viewing relationship details, the AI helps interpret the connections between members

### AI Implementation

The application connects to OpenAI's API using a secure API key stored in environment variables. The integration follows these principles:

- **Privacy First**: All data sent to OpenAI is anonymized and minimized
- **Graceful Fallbacks**: If AI validation is unavailable, the application continues to function
- **Transparent Suggestions**: AI recommendations are clearly marked and presented as suggestions
- **User Control**: Users can always override AI recommendations

## Accessibility & Responsive Design

The Pursuit Family App is designed to be accessible and usable across different devices and for users with various needs:

### Responsive Design

- **Mobile-First Approach**: The interface adapts seamlessly to different screen sizes
- **Touch-Friendly Controls**: All interactive elements work with both mouse and touch input
- **Adaptive Layouts**: Component sizing and positioning adjusts based on available space
- **Zoom Controls**: Custom zoom functionality for the family tree on smaller screens

### Accessibility Features

- **Keyboard Navigation**: All features are accessible via keyboard controls
- **Screen Reader Support**: Semantic HTML and ARIA attributes for assistive technologies
- **Color Contrast**: Careful color selection meeting WCAG standards
- **Focus Indicators**: Clear visual indicators for focused elements
- **Dark Mode**: Reduced eye strain in low-light environments
- **Error Announcements**: Clear notifications for validation issues

## Security Considerations

The application implements several security measures to protect sensitive family data:

- **Authentication**: Secure JWT-based authentication system
- **Password Security**: Bcrypt hashing with salt rounds for password storage
- **Authorization**: Role-based access control for sensitive operations
- **Data Protection**: Input validation and sanitization to prevent injection attacks
- **Secure Documents**: Permission-based access to sensitive family documents
- **API Security**: Protected endpoints with proper authentication checking

## Contributing

Contributions to improve the Pursuit Family App are welcome! Here's how you can contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to update tests as appropriate and ensure your code follows the project's coding standards.

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenAI](https://openai.com/) for AI capabilities via their GPT-4o model
- [shadcn/ui](https://ui.shadcn.com/) for accessible UI components
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database schema
- [TanStack Query](https://tanstack.com/query/v5/) for data fetching and state management
- [React Hook Form](https://react-hook-form.com/) for form handling
- [Tailwind CSS](https://tailwindcss.com/) for styling