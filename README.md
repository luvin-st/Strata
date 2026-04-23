# Strata
Strata is a clean, minimalist task and habit tracking application designed to help users stay organized and consistent without feeling overwhelmed.

## Overview
Strata focuses on simplicity and structure. Rather than cluttered dashboards or excessive analytics, it provides a calm and intentional way to manage tasks and habits over time.
The goal is to make productivity feel sustainable and easy to maintain.

## Features
- Task tracking
- Habit tracking
- Monthly progress overview
- Clean, minimalist UI
- Intuitive user experience

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL
- ORM: Prisma

## Deployment
The frontend is planned for deployment on **Vercel** and the backend and database on **Render**.

Vercel is chosen for the frontend because it offers instant static site hosting with zero configuration, automatic deploys on every push to GitHub, and a free tier well suited for a project of this scope.

Render is chosen for the backend and database because it supports Node.js web services and managed PostgreSQL databases on the same platform, making it straightforward to connect the two without additional configuration. Like Vercel, it offers a free tier and integrates directly with GitHub for automatic deploys.

## Running Locally

### Prerequisites
Make sure you have the following installed on your machine before getting started:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)

### Step 1 — Clone the repository
```bash
git clone https://github.com/luvin-st/Strata.git
cd Strata
```

### Step 2 — Install backend dependencies
```bash
cd backend
npm install
```

### Step 3 — Set up environment variables
Create a `.env` file inside the `backend` folder with the following variables:
```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/strata"
JWT_SECRET="your_jwt_secret"
PORT=3000
```
Replace `your_user` and `your_password` with your local PostgreSQL credentials. The database name `strata` will be created in the next step.

### Step 4 — Create the database
Open pgAdmin or run the following in your terminal:
```bash
psql -U postgres -c "CREATE DATABASE strata;"
```

### Step 5 — Run database migrations
```bash
npx prisma migrate dev
npx prisma generate
```

### Step 6 — Start the backend server
```bash
npm run dev
```
The backend will be running at `http://localhost:3000`.

### Step 7 — Open the frontend
Open the `frontend` folder in VS Code, then right click `index.html` and select **Open with Live Server**. The app will open in your browser at `http://127.0.0.1:5500`.

You can now register a new account and use the application.

## Team Members
- Shaden AlGhamdi
- Omar Bharwani
- Bukunmi Odejayi
- Denilson Montalvo
- Ana Rosales
