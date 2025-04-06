# Pursuit Family App

A private family social network that leverages AI and interactive visualization to help families connect, preserve memories, and understand their genealogical relationships.

<!-- ![Family Tree Interface](https://github.com/ayishagisel/Family-Pursuit/raw/main/screenshots/family-tree.png) -->
<!-- Screenshot will be added in the future -->

## Latest Updates
- Enhanced dark mode accessibility with improved text contrast
- Fixed family tree visualization with better label readability
- Improved event and help request management

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
  - In-memory data storage (extensible to PostgreSQL)
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

## Getting Started

### Prerequisites

- Node.js 18+ installed
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

3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5000` to view the application

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
│   ├── services/         # Backend services including AI validation
│   ├── routes.ts         # API route definitions
│   └── storage.ts        # Data storage interface
└── shared/               # Shared code between client and server
    └── schema.ts         # Database schema and type definitions
```

### Future Development

1. **Database Integration**: 
   - The application currently uses in-memory storage
   - Future plans include PostgreSQL integration for persistent data

2. **Authentication & Authorization**:
   - Implement user authentication system
   - Add role-based access controls for family content

3. **AI Enhancements**:
   - Family relationship analysis and suggestions
   - Historical event detection and timeline generation
   - Document classification and information extraction

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

### Sample AI Validation Flow

1. User submits a new family member form
2. Application sends structured data to the AI validation service
3. OpenAI analyzes the data for consistency and logical issues
4. Results are returned with validation status, issues, and recommendations
5. User receives clear feedback and can make informed decisions

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

### Cross-Browser Compatibility

The application is built to work consistently across modern browsers including:
- Chrome/Edge (Chromium-based)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Android Chrome)

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

## Latest Updates
- Enhanced dark mode accessibility with improved text contrast
- Fixed family tree visualization with better label readability
- Improved event and help request management
