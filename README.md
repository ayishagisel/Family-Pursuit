# Pursuit Family App

A private family social network that leverages AI and interactive visualization to help families connect, preserve memories, and understand their genealogical relationships.

## Features

- **Interactive Family Tree Visualization**: Explore family relationships with an intuitive, zoomable canvas
- **AI-Powered Validation**: Ensure consistency in family relationships with OpenAI-powered validation
- **Search Functionality**: Quickly find family members by name or role
- **Relationship Insights**: View detailed connections between family members
- **Event Planning**: Manage family gatherings and important dates
- **Document Sharing**: Share and organize important family documents
- **Help Requests**: Coordinate assistance within your family network
- **Private Messaging**: Communicate securely with family members

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Express.js with RESTful API
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **AI Integration**: OpenAI API for data validation and insights
- **Storage**: In-memory database (can be connected to PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key for AI features

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pursuit-family-app.git
   cd pursuit-family-app
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

- **Family Tree**: Navigate to the Family Tree page to view, add, and edit family members
- **Events**: Manage and organize family gatherings and important dates
- **Documents**: Share and organize important family documents
- **Help Needed**: Coordinate assistance within your family network
- **Messages**: Communicate with family members

## License

[MIT License](LICENSE)

## Acknowledgements

- [OpenAI](https://openai.com/) for AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Drizzle ORM](https://orm.drizzle.team/) for database schema