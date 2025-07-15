# 🌐 Smart Route Planning - Frontend Documentation

This frontend is part of the Smart Route Planning application, a route optimization platform that helps organizations reduce travel time, lower costs, and increase operational efficiency for field service workers.

> **Note**: For general project information, setup instructions, and backend details, please refer to the [main README](../README.md) in the root directory.

## 🛠️ Technology Stack

### Core Framework & Build Tools

- **React 19** - Modern React with latest features and hooks
- **TypeScript 5.7** - Static type checking and enhanced development experience
- **Vite 6.2** - Fast build tool with Hot Module Replacement (HMR)
- **@vitejs/plugin-react** - Official Vite plugin for React Fast Refresh

### UI & Styling

- **Tailwind CSS 4.1** - Utility-first CSS framework for rapid UI development
- **@tailwindcss/vite** - Vite integration for Tailwind CSS
- **ShadcnUi** - Unstyled, accessible components
- **Lucide React** - Beautiful, customizable SVG icons
- **Class Variance Authority (CVA)** - Component variant management

### Routing & Navigation

- **TanStack Router 1.119** - Type-safe routing with automatic code splitting
- **@tanstack/router-plugin** - Vite plugin for automatic route generation
- **@tanstack/react-router-devtools** - Development tools for debugging routes

### State Management

- **Redux Toolkit 2.7** - Modern Redux with simplified API
- **React Redux 9.2** - React bindings for Redux
- **Redux Persist 6.0** - Persistent state across browser sessions

### Data Fetching & Server State

- **TanStack Query 5.72** - Powerful data synchronization for server state
- **@tanstack/react-query-devtools** - Development tools for debugging queries
- **Axios 1.8** - HTTP client for API communication

### Map Integration

- **@react-google-maps/api 2.20** - React components for Google Maps integration
- Provides interactive mapping, route visualization, and location services

### Form Handling & Validation

- **React Hook Form 7.56** - Performant forms with minimal re-renders
- **@hookform/resolvers 5.0** - Validation resolvers for form schemas
- **Zod 3.24** - TypeScript-first schema validation

### Data Visualization & Tables

- **TanStack Table 8.21** - Headless table building blocks
- **React Day Picker 9.7** - Date picker component
- **Date-fns 4.1** - Date utility library
- **Dayjs 1.11** - Fast date parsing and formatting

### User Experience

- **Sonner 2.0** - Toast notifications
- **React Dropzone 14.3** - File upload with drag & drop
- **React Zoom Pan Pinch 3.7** - Interactive image/map manipulation

### Development Tools

- **ESLint 9.25** - Code linting with TypeScript support
- **Prettier 3.5** - Code formatting
- **TypeScript ESLint** - TypeScript-specific linting rules

## 🗂️ Project Structure

```
frontend/src/
├── components/         # Reusable UI components
├── routes/             # Page components and routing
├── store/              # Redux state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and API client
├── css/                # Global styles
├── assets/             # Static assets
└── lib/                # Library configurations
```

## 🧭 Routing Structure

Our application uses TanStack Router for type-safe, file-based routing with automatic code splitting:

### **`/` (Home/Landing Page)**

- **Purpose**: File upload interface and entry point
- **Key Features**:
  - CSV appointment data upload via drag-and-drop
  - Automatic scenario parsing and validation
  - Navigation to scenario calendar view
- **Components**: `FileDropzone`, scenario validation logic

### **`/scenarios/`**

- **Purpose**: Calendar overview of all appointment scenarios
- **Key Features**:
  - Interactive calendar showing days with appointments
  - Visual indicators for solved/unsolved scenarios
  - Modal dialogs showing appointment details
  - Quick navigation to specific dates
- **Components**: `ScenarioCalendar`, `DataTable`, appointment modals

### **`/map-view/`**

- **Purpose**: Interactive map visualization and route optimization
- **Key Features**:
  - Google Maps integration with appointment locations
  - Real-time route optimization controls
  - Vehicle and appointment exclusion management
  - Visual route overlays with color coding
- **Components**: `RouteOverlay`, `OptimizationBar`, Google Maps integration

### **`/daily-plan/`**

- **Purpose**: Detailed view of optimized daily routes
- **Key Features**:
  - Route-by-route breakdown with turn-by-turn directions
  - Validation reports and constraint checking
  - Downloadable route information
  - Performance metrics and statistics
- **Components**: `RouteCard`, `ValidationReportDialog`, download utilities

### **`/week-view/`**

- **Purpose**: Weekly appointment scheduling interface
- **Key Features**:
  - 7-day calendar view with week navigation
  - Appointment scheduling across multiple days
  - Week-based optimization planning
- **Components**: `AppointmentScheduler` with week-specific logic

### **`/multi-days-view/`**

- **Purpose**: Custom date range appointment management
- **Key Features**:
  - Flexible date selection for non-consecutive days
  - Bulk appointment operations
  - Cross-day appointment analysis
- **Components**: `AppointmentScheduler` with multi-day support

### **`/company-config/`**

- **Purpose**: Company settings and fleet management
- **Key Features**:
  - Vehicle fleet configuration
  - Company address management (start/finish locations)
  - Worker skills and capabilities setup
  - Cost parameters and optimization settings
- **Components**: `CompanyConfigForm`, `VehicleList`, `AddressSection`

### **`/testdata-generate/`**

- **Purpose**: Generate synthetic appointment data for testing
- **Key Features**:
  - Configurable date ranges and appointment volumes
  - Realistic appointment distribution patterns
  - Integration with existing scenarios
- **Components**: Date range pickers, configuration sliders

### **`/worker-view/`**

- **Purpose**: Individual worker interface (under development)
- **Key Features**:
  - Worker-specific route information
  - Individual task management
  - Mobile-optimized interface

## 🗄️ State Management (Redux Store)

Our application uses Redux Toolkit with persistence for comprehensive state management:

### **`scenariosSlice`**

- **Purpose**: Manages parsed appointment scenarios from CSV uploads
- **State**: `{ scenarios: Scenario[] }`
- **Key Actions**:
  - `setScenarios`: Replace all scenarios with new data
  - `resetScenarios`: Clear all scenario data
- **Usage**: Primary data source for calendar views and route planning

### **`companyInfoSlice`**

- **Purpose**: Company configuration and fleet management
- **State**: Company addresses, vehicle fleet, solver settings
- **Key Actions**:
  - `setCompanyInfo`: Update complete company configuration
  - `resetCompanyInfo`: Restore default settings
- **Default State**: Includes default vehicle with basic configuration
- **Usage**: Optimization parameters and company-wide settings

### **`solutionsSlice`**

- **Purpose**: Stores optimization results by date
- **State**: `{ byDate: Record<string, Solution> }`
- **Key Actions**:
  - `addSolution`: Store optimization result for specific date
  - `clearSolutions`: Remove all cached solutions
- **Usage**: Caches expensive optimization calculations, enables offline viewing

### **`enrichedAppointmentsSlice`**

- **Purpose**: Caches geocoded appointment data with enhanced address information
- **State**: Keyed by date, contains geocoding results
- **Usage**: Reduces Google Maps API calls by persisting location data

### **`excludedAppointmentsSlice`**

- **Purpose**: Manages appointments excluded from optimization
- **State**: Date-keyed arrays of excluded appointment IDs
- **Usage**: User control over which appointments to include in routes

### **`excludedVehiclesSlice`**

- **Purpose**: Manages vehicles excluded from specific dates
- **State**: Date-keyed arrays of excluded vehicle IDs
- **Usage**: Fleet management and vehicle availability control

### **`routeVisibilitySlice`**

- **Purpose**: Controls visual display of routes on maps
- **State**: Visibility toggles for individual routes
- **Usage**: Map visualization customization and route comparison

## 🔧 Key Integrations

### Google Maps API

- **Location Services**: Geocoding for address validation
- **Route Visualization**: Interactive maps with customizable overlays
- **Navigation**: Turn-by-turn directions and route optimization
- **Configuration**: Requires `VITE_GOOGLE_MAPS_API_KEY` environment variable

### Backend API Communication

- **Base URL**: Configured via `VITE_API_URL` environment variable
- **Endpoints**: RESTful API for optimization, geocoding, and data management
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Caching**: TanStack Query for intelligent server state management

## 🚀 Development Guidelines

### Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

### Required Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Code Quality Tools

- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured for React and TypeScript best practices
- **Prettier**: Consistent code formatting

### Performance Considerations

- **Code Splitting**: Automatic route-based splitting via TanStack Router
- **State Persistence**: Redux Persist for improved user experience
- **Query Caching**: TanStack Query reduces redundant API calls
- **Lazy Loading**: Components loaded on-demand for faster initial load

### Architecture Patterns

- **Container/Presenter**: Clear separation between data logic and UI
- **Custom Hooks**: Reusable stateful logic abstraction
- **Type Safety**: Comprehensive TypeScript coverage
- **Error Boundaries**: Graceful error handling and user feedback
