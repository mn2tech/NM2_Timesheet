# NM2TECH LLC Timesheet Application

A modern timesheet management system for NM2TECH LLC employees and contractors to track their work hours.

## Features

- **User Authentication**: Secure login and registration for employees, contractors, and admins
- **Time Entry**: Easy-to-use form to log work hours with date, project, and description
- **Time Management**: View, edit, and delete time entries
- **Project Tracking**: Track time across different projects
- **Role-Based Access**: Support for employees, contractors, and admins
- **Admin Dashboard**: Admins can view all users' time entries and manage the system
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Register**: Create a new account as either an employee or contractor
2. **Login**: Sign in with your credentials
3. **Add Time Entries**: Click "Add Entry" to log your work hours
4. **Manage Entries**: Edit or delete existing entries as needed
5. **View Summary**: See your total hours tracked at the top of the dashboard

## Admin Access

### Creating an Admin User

To create an admin user, use the provided script:

```bash
npm run create-admin [email] [password] [name]
```

Example:
```bash
npm run create-admin admin@nm2tech.com admin123 "Admin User"
```

If no arguments are provided, it will create a default admin:
- Email: `admin@nm2tech.com`
- Password: `admin123`
- Name: `Admin User`

**⚠️ Important**: Change the default password after first login!

### Admin Registration via UI

Admins can also register through the UI by:
1. Going to the registration page
2. Selecting "Admin" as the role
3. Entering the admin code: `NM2TECH-ADMIN-2024` (or set `ADMIN_SECRET` environment variable)

### Admin Dashboard Features

- View all time entries from all users
- View all registered users with their statistics
- See total hours, users, and entries across the system
- Access user management features

## Data Storage

The application supports two storage options:

### Option 1: Supabase (Recommended for Production)

The app can use Supabase (PostgreSQL) for cloud-based storage. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

**Benefits:**
- Cloud-based storage
- Automatic backups
- Better performance and scalability
- Multi-user access
- Production-ready

### Option 2: JSON File Storage (Default)

If Supabase is not configured, the app automatically falls back to a JSON file-based database stored in the `data/` directory. This is suitable for development and small teams.

**To use Supabase:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql`
3. Add your Supabase credentials to `.env.local`
4. Restart the development server

The app will automatically detect and use Supabase if environment variables are configured.

## Security Notes

- Change the `JWT_SECRET` in production (set via environment variable)
- Passwords are hashed using bcrypt
- Authentication tokens are stored in HTTP-only cookies (consider implementing this for production)

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **bcryptjs**: Password hashing
- **jsonwebtoken**: Authentication tokens
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library

## Project Structure

```
├── app/
│   ├── api/          # API routes
│   │   └── admin/    # Admin API routes
│   ├── admin/        # Admin dashboard
│   ├── dashboard/    # User dashboard
│   ├── login/        # Login page
│   ├── register/     # Registration page
│   └── layout.tsx     # Root layout
├── scripts/
│   └── create-admin.js  # Admin user creation script
├── lib/
│   ├── auth.ts       # Authentication utilities
│   ├── db.ts         # Database operations
│   └── middleware.ts # Auth middleware
└── data/             # JSON database (created at runtime)
```

## License

Copyright © 2024 NM2TECH LLC. All rights reserved.

