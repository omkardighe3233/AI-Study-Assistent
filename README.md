# AI Study Assistant

An intelligent study companion that helps you organize notes, manage PDFs, take quizzes, and track tasks.

## Features
- **User Authentication**: Secure sign up and login.
- **PDF Management**: Upload and review PDF documents.
- **Quizzes**: Test your knowledge with interactive quizzes.
- **Notes**: Create and manage your study notes.
- **Tasks**: Keep track of your study tasks.

## Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed or a MongoDB Atlas URI

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install Client dependencies:
   ```bash
   cd client
   npm install
   ```

3. Install Server dependencies:
   ```bash
   cd server
   npm install
   ```

### Environment Variables
Create a `.env` file in the `server` directory and configure the following variables:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Running the App Locally

#### Using Root Scripts:
```bash
# Install all dependencies (client and server)
npm run install:all

# Start backend (dev mode)
npm run server

# Start frontend (dev mode)
npm run client
```

#### Running Separately:
1. Start the server (from the `server` directory):
   ```bash
   npm run dev
   ```
2. Start the client (from the `client` directory):
   ```bash
   npm run dev
   ```

## Deployment on Render

This project is fully prepared for one-click deployment on Render:
- Full documentation: see [DEPLOYMENT.md](file:///c:/Users/omkar/Desktop/Major%20proj/AI-Study-Assistent/DEPLOYMENT.md)
- Blueprint specification: [render.yaml](file:///c:/Users/omkar/Desktop/Major%20proj/AI-Study-Assistent/render.yaml)
- Build command: `npm run build`
- Start command: `npm start`
