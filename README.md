# My-Meal-Pal

https://my-meal-pal-bh7o.vercel.app/

A smart meal planning app that suggests recipes based on fridge ingredients and dietary goals.

# Next.js Authentication System with MongoDB
This README provides step-by-step instructions on how to build and run this authentication system with user profile management.

## Table of Contents

1. Prerequisites
2. Project Setup
3. Environment Variables
4. Database Configuration
5. Running the Application
6. Features

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18.0.0 or later)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas account)

## Project Setup

1. Clone the repository

   git clone <repository-url>
   cd <repository-name>

2. Install dependencies

   npm install
   # or
   yarn install

## Environment Variables

1. Create a `.env.local` file in the root directory

   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

   Replace <username>, <password>, <cluster>, and <database> with your MongoDB credentials.

## Database Configuration

The application uses MongoDB for data storage. The connection is handled in the `lib/mongodb.js` file, which uses the `MONGODB_URI` environment variable you set up in the previous step.

The User model is defined in `models/User.js` and includes fields for:
- name
- email
- passwordHash
- nutritionalPreferences (dietary restrictions, allergens, calorie limit)
- createdAt timestamp

## Running the Application

1. Start the development server

   npm run dev
   # or
   yarn dev

2. Access the application

   Open your browser and navigate to http://localhost:3000

3. Register a new user

   Navigate to http://localhost:3000/register and create a new account

4. Log in

   Navigate to http://localhost:3000/login and log in with your credentials

5. View and update your profile

   Navigate to http://localhost:3000/profile to view and update your profile information

## Features

### Authentication

- User registration with password hashing
- User login with session-based authentication
- Logout functionality
- Protected routes with middleware

### User Profile Management

- View and update user profile information
- Manage nutritional preferences (dietary restrictions, allergens, calorie limit)
- Profile data persistence in MongoDB
