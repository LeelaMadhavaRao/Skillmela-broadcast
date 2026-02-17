# Skillmela Broadcast Platform

A real-time broadcast platform built with Next.js, Supabase, and TypeScript for instructors to share messages and files with students.

## Features

- **Real-time WebSocket updates** using Supabase Realtime
- **Role-based access**: Instructor (can send/edit/delete) and Student (view-only)
- **File sharing** with Supabase Storage
- **Central admin panel** for managing all broadcasts
- **Unique broadcast codes** auto-generated (6-character alphanumeric)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key

### 3. Setup Environment Variables

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run Database Migration

Copy the contents of `supabase-schema.sql` and run it in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Paste the entire SQL schema
3. Click "Run"

This will create:
- `broadcasts` and `messages` tables
- Storage bucket for files
- RLS policies
- Realtime configuration

### 5. Enable Realtime (Important!)

In Supabase Dashboard:
1. Go to **Database → Replication**
2. Ensure the `messages` table has Realtime enabled
3. Toggle it on if it's not already enabled

### 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home page (Join Broadcast button)
│   ├── join/                       # Join page (Instructor/Student role selector)
│   ├── broadcast/
│   │   ├── instructor/             # Instructor chat interface
│   │   └── student/                # Student chat interface (view-only)
│   ├── manage/                     # Admin panel (create/delete broadcasts)
│   └── api/
│       ├── broadcasts/             # Broadcast CRUD operations
│       └── messages/               # Message CRUD operations
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   └── server.ts              # Server Supabase client
│   └── types.ts                    # TypeScript interfaces
└── supabase-schema.sql             # Database schema
```

## Usage

### For End Users

1. **Join a Broadcast**
   - Visit the home page and click "Join Broadcast"
   - Select your role (Instructor or Student)
   - Enter the broadcast code
   - Instructors also need to enter the password

2. **As an Instructor**
   - Send text messages
   - Upload and share files
   - Copy, edit, or delete your messages
   - All changes are live for students

3. **As a Student**
   - View messages and files in real-time
   - Copy messages
   - Download shared files
   - No editing/deleting permissions

### For Administrators

1. **Access Admin Panel**
   - Navigate to `/manage` route directly
   - Default password: `admin123` (change this in production!)

2. **Create Broadcasts**
   - Click "Create Broadcast"
   - Enter administrator name and broadcast password
   - A unique code is auto-generated
   - Share the code with instructors/students

3. **Manage Broadcasts**
   - View all broadcasts in the system
   - See broadcast codes, passwords, and admin names
   - Copy codes and passwords to clipboard
   - Delete broadcasts (permanently removes all messages/files)

## Security Notes

⚠️ **Important for Production:**

1. **Change Admin Password**
   - Update the `ADMIN_PASSWORD` constant in `src/app/manage/page.tsx`
   - Consider using environment variables instead
   - Implement proper authentication (NextAuth, Clerk, etc.)

2. **RLS Policies**
   - Current setup allows public read/write for simplicity
   - For production, implement proper row-level security based on your needs

3. **File Upload Limits**
   - Configure file size limits in Supabase Storage settings
   - Add client-side validation for file types/sizes

## Real-time Updates

The platform uses Supabase Realtime with PostgreSQL change events:

- **INSERT**: New messages appear instantly for all viewers
- **UPDATE**: Edited messages update in real-time
- **DELETE**: Deleted messages are removed from all viewers immediately

The `REPLICA IDENTITY FULL` setting on the messages table ensures DELETE events work correctly with filters.

## Troubleshooting

### Messages not appearing in real-time?
- Check that Realtime is enabled on the `messages` table in Supabase Dashboard
- Verify the `supabase_realtime` publication includes the messages table
- Check browser console for WebSocket connection errors

### File uploads failing?
- Verify the `broadcast-files` storage bucket exists
- Check storage policies allow public insert/read/delete
- Check file size limits in Supabase settings

### Build errors?
- Run `npm install` to ensure all dependencies are installed
- Check that `.env.local` has valid Supabase credentials
- Try deleting `.next` folder and rebuilding

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (WebSockets)
- **Storage**: Supabase Storage
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## License

MIT
