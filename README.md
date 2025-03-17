# Quiz Knight Challenge

An interactive quiz application that allows teachers to create and manage quizzes while students can participate in both standard and live quiz sessions.

## Features

- User authentication (Teacher/Student roles)
- Quiz creation and management
- Live quiz sessions
- Leaderboard system
- Real-time quiz participation
- Detailed quiz results and analytics
- Advanced proctoring system with:
  - Tab/window switching detection
  - Copy-paste prevention
  - Keyboard shortcut blocking
  - Full-screen enforcement
  - Webcam monitoring for detecting multiple people
  - Single-attempt restriction for quizzes

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd quiz-knight-challenge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` with your configuration.

4. Set up the database:
```bash
# Create database
createdb myktcdb

# Run migrations
npm run migrate
```

## Development

1. Start the server:
```bash
npm run dev
```

2. Start the client (in a separate terminal):
```bash
cd client
npm run dev
```

The application will be available at:
- Client: http://localhost:5173
- Server: http://localhost:5000

## Project Structure

```
quiz-knight-challenge/
├── client/             # Frontend React application
├── server/             # Backend Express server
├── shared/             # Shared types and utilities
├── migrations/         # Database migrations
└── checkpoints/        # Development checkpoints
```

## 👨‍💻 About the Creator

I'm Shaikh Mohd Arsan, the architect behind the ideas, structure, and vision of this project. Every concept, feature, and future enhancement originates from my mind, meticulously framed and structured before execution.

While I leverage Generative and Agentic AI as powerful tools in the implementation process, the core logic, planning, and innovation are entirely my own. AI assists in execution, but the blueprint is purely human.

"Machines assist, but ideas are built by the mind."

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details 