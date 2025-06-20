# Incident Management System

A modern incident management system with synchronized operator and client dashboards.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Set up environment**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Set up database**
   ```bash
   cd backend
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── models/    # Database models
│   │   ├── middleware/# Auth & validation
│   │   └── services/  # Business logic
│   └── drizzle/       # Database migrations
├── frontend/          # React application
│   ├── src/
│   │   ├── components/# Reusable components
│   │   ├── pages/     # Page components
│   │   ├── hooks/     # Custom hooks
│   │   └── services/  # API services
└── shared/           # Shared types & utilities
```

## 🔧 Features

- **Multi-tenancy**: Support multiple clients with isolated data
- **Real-time sync**: Socket.io for live updates
- **Role-based access**: Operator and Client dashboards
- **Context switching**: Dynamic workflows per client
- **Incident management**: Create, track, and resolve incidents
- **Activity logging**: Real-time activity feeds

## 🎯 Tech Stack

- **Backend**: Node.js, Express, TypeScript, Socket.io
- **Database**: PostgreSQL, Drizzle ORM
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Authentication**: JWT tokens

## 📝 Usage

### Operator Dashboard
- Switch between client contexts
- Create and manage incidents
- Real-time activity monitoring
- Quick action buttons

### Client Dashboard
- View incident status
- Real-time activity feed
- Add comments to incidents
- Filter by status

## 🔐 Default Credentials

**Operator**: 
- Email: operator@example.com
- Password: operator123

**Client**: 
- Email: client@acme.com
- Password: client123
