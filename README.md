# Interview Leaderboard

A modern, full-featured platform to track and share student mock interview performance across multiple rounds.

## Features

### Multi-Round Interview Scoring
- **Round-wise Scoring**: Record multiple interview rounds per student (Round 1, 2, 3, etc.)
- **Score Range**: Each round is scored out of 10 for precise measurement
- **Dynamic Calculations**: Automatically computes:
  - Highest Score (max across all rounds)
  - Total Score (sum of all rounds)
  - Average Score (mean across all rounds)
  - Interviews Given (count of rounds)
  - Last Interview Date

### Analytics Dashboard
- **Total Students**: Count of unique students
- **Total Interviews**: Total rounds conducted
- **Average Score**: Batch-wide average across all rounds
- **Highest Individual Score**: Maximum round score
- **Overall Batch Score**: Sum of all student total scores
- Auto-updates whenever new interviews are recorded

### Leaderboard Table
- **Sortable Columns**: Sort by any metric (highest score, average, total, etc.)
- **Student Search**: Find students by name
- **Rankings**: Visual medals and badges for top performers
- **Color-Coded Scores**: Green (9+), blue (7+), yellow (5+), red (<5)
- **Complete Details**: Click any student to view all their interview rounds

### For Admins
- **Secure Authentication**: Email and password login with Supabase Auth
- **Multi-Board Support**: Create and manage multiple leaderboards (batch-wise)
- **Interview Recording**: Easy form to log interview rounds with all details
- **Detailed Records**: Track strengths, weaknesses, feedback, and notes per round
- **Export/Import**: Download leaderboard data as JSON or import previous exports
- **Public Sharing**: Generate unique shareable links for each leaderboard

### For Public Viewers
- **Read-Only Access**: View dashboard and leaderboard via unique public URL
- **Analytics View**: See batch summary metrics
- **Detailed Rounds**: Click students to view all their interview details
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop

### Design Features
- **Dark Mode**: Toggle between light and dark themes with persistent preference
- **Modern UI**: Clean, professional design with smooth animations
- **Responsive Layout**: Optimized for all screen sizes
- **Medal System**: Automatic badges for top 3 performers

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account

### Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   The database schema has already been applied to your Supabase instance.

3. **Create Admin Account**
   - Start the dev server (done automatically)
   - Visit the application
   - Click "Sign Up" on the login page
   - Enter your email, password, and name
   - You'll be automatically logged in as an admin

4. **Start Using**
   - Create your first leaderboard
   - Record interview rounds using the "Record Interview" button
   - View analytics and student rankings
   - Share the public link with others

## Usage Guide

### Recording an Interview

1. Click "Record Interview" button
2. Select student name (or enter new)
3. Choose round number (1-5)
4. Set score using the slider (0-10)
5. Select interview date
6. Enter interviewer name
7. Add feedback, strengths, and improvements
8. Click "Record Interview"

### Viewing Student Details

1. Click on any student in the leaderboard
2. View summary metrics (highest, average, total, interviews)
3. See all their interview rounds
4. View detailed feedback for each round

### Sharing with Others

1. Click "Copy Public Link" button
2. Share the URL with students or stakeholders
3. Anyone with the link can view (but not edit) the leaderboard

### Exporting Data

1. Click "Export" to download leaderboard as JSON
2. Use "Import" to restore or merge data

## Metrics Explained

### Student Metrics
- **Highest Score**: Best performance across all rounds (out of 10)
- **Total Score**: Sum of all round scores
- **Average Score**: Mean score across all rounds
- **Interviews Given**: Number of rounds attempted
- **Last Interview**: Most recent interview date

### Batch Metrics
- **Total Students**: Number of unique students in leaderboard
- **Total Interviews**: Total number of interview rounds
- **Average Score**: Mean of all round scores (out of 10)
- **Highest Individual Score**: Best single round score
- **Overall Batch Score**: Sum of all students' total scores

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with dark mode
- **Routing**: React Router v7
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Database Schema

### Tables
- **admins**: Admin user profiles
- **leaderboards**: Leaderboard instances
- **interview_rounds**: Individual interview records with round details

### Security
- Row Level Security (RLS) enforced on all tables
- Admins can only access their own leaderboards
- Public links are read-only
- Passwords securely hashed by Supabase

## License

MIT
