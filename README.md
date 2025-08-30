# Quiz Knight Challenge

An interactive, gamified quiz platform for teachers and students, featuring advanced proctoring, user profiles, achievements, social features, and a modern UI/UX.

## Features

- **User Authentication**: Teacher/Student roles, secure login, and registration.
- **User Profile System**: Sidebar, profile page, and edit functionality.
- **Quiz Creation & Management**: Teachers can create quizzes with MCQ, True/False, fill-in-the-blanks, and short answer questions.
- **Live Quiz Sessions**: Real-time participation and monitoring.
- **Quiz Review & Analytics**: Detailed results, review feature, and analytics for teachers.
- **Leaderboard System**: Monthly reset, global and class rankings.
- **Achievements & Social Features**: Earn achievements, manage friendships, and view user progress.
- **Advanced Proctoring**:
  - Tab/window switching detection
  - Copy-paste prevention
  - Keyboard shortcut blocking
  - Full-screen enforcement
  - Webcam monitoring for multiple people
  - Single-attempt restriction
- **Enhanced UI/UX**:
  - Dark/light theme toggle
  - Progress indicators
  - Countdown timer
  - Smooth transitions and particle backgrounds

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

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
    Edit `.env` with your configuration.

4. Set up the database:
    ```bash
    createdb myktcdb
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

## Current Development Highlights

- **User Profile System**: Users can view and edit their profiles, including profile pictures, bio, branch, and year.
- **Achievements & Social Features**: Track achievements, manage friendships, and view earned badges.
- **Advanced Proctoring**: Real-time monitoring and restriction features for live quizzes.
- **Quiz Review**: Students can review completed quizzes and answers.
- **Enhanced UI/UX**: Particle backgrounds, theme switching, and improved navigation.

## About the Creator

I'm Shaikh Mohd Arsan, the architect behind the ideas, structure, and vision of this project. Every concept, feature, and future enhancement originates from my mind, meticulously framed and structured before execution.

While I leverage Generative and Agentic AI as powerful tools in the implementation process, the core logic, planning, and innovation are entirely my own. AI assists in execution, but the blueprint is purely human.

"Machines assist, but ideas are built by the mind."

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details