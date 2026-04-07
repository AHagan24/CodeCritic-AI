# CodeCritic AI

AI-powered code review platform that analyzes, scores, and improves your code in real time.

## Live Demo
[Link here]

## Features

- AI-powered code analysis using OpenAI
- Code quality scoring (0–100)
- Detailed issue breakdown with severity levels
- Suggested improved code output
- Monaco code editor (VS Code-like experience)
- Persistent review history (MongoDB)
- Search and filter past reviews
- Dedicated review detail pages
- Copy-to-clipboard for improved code
- Rate-limited API for safe usage

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- OpenAI API
- Monaco Editor

## Architecture

- Frontend: Next.js + Tailwind UI
- Backend: API routes (App Router)
- Database: MongoDB for persistent review storage
- AI: OpenAI for structured code analysis

## Security & Considerations

- Input validation and payload size limits
- Rate limiting to prevent API abuse
- Server-side API key handling (no client exposure)
- Demo-focused architecture (no authentication layer yet)

Future improvements:
- User authentication and per-user data isolation
- Distributed rate limiting (Redis)
- Data retention controls

## Future Improvements

- Authentication and user accounts
- Review sharing/export (PDF)
- Code diff visualization
- Advanced scoring categories (performance, security, readability)

## Author

Addison Hagan  
[LinkedIn]  
[GitHub]