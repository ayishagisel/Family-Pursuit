# Family-Pursuit
A private social media platform designed to connect and strengthen family bonds through interactive features and secure communication tools.

Frontend
The app’s frontend is built with a modern and efficient stack:

React 18: The core UI library for building reusable, component-based interfaces.

TypeScript: Ensures type safety and improves code maintainability.

Tailwind CSS: Provides utility-based styling for responsive and clean design.

Shadcn UI: A component library built on Radix UI, ensuring accessibility across all components.

TanStack Query: Manages data fetching, caching, and state synchronization seamlessly.

React Hook Form + Zod: Handles form validation with schema-based validation for robust user input handling.

Wouter: A lightweight routing library for smooth navigation.

Custom SVG Implementation: Powers the interactive family tree visualization with dynamic updates.

Backend
On the backend, we use scalable technologies to handle API requests and AI integration:

Express.js: A Node.js framework that serves as the backbone for our API server.

TypeScript: Maintains type safety for backend logic.

OpenAI Node SDK: Integrates AI capabilities like data validation using GPT-4o.

Data Management
For managing data efficiently, we rely on:

In-memory Storage: A custom implementation for fast data persistence during runtime.

Drizzle ORM + Drizzle-Zod: Simplifies database schema definitions while connecting them to Zod for validation.

Build & Development Tools
To ensure a smooth development experience, we use:

Vite: A modern build tool for fast development and optimized builds.

PostCSS: Processes CSS with Tailwind for styling consistency.

AI Validation Workflow
The app leverages OpenAI’s GPT-4o model to validate family member data seamlessly. Here’s how it works:

When users add or edit a family member, the form data (name, role, relationship) is sent to the server via a custom hook.

The backend uses OpenAI to validate if the entries are realistic and consistent within a family context. For example:

If a user enters "X Æ A-12" as a name, the AI might suggest "Alex" as a more appropriate alternative while flagging it as unusual.

Users receive feedback as warnings or suggestions but retain full control over their entries.

Why This Stack?
This stack ensures scalability, accessibility, and seamless user experience while maintaining robust data integrity through AI-powered validation. It’s designed to handle complex family structures while keeping interactions intuitive and secure.
