# Wizarding World Fan Hub

An animated Harry Potter fan website with user authentication backed by a SQLite database.

## Quick Start

### Backend
```bash
cd harrypotter-fansite/backend
npm install
npm run dev
```

### Frontend
The frontend is served statically by the Express backend. Open `http://localhost:5000` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Create new account (username, email, password, house) |
| POST | `/api/login` | Log in (email, password) |
| GET | `/api/me` | Get current user (requires JWT token) |
| GET | `/api/houses` | List the four Hogwarts houses |

## Tech Stack

- **Backend**: Express.js, better-sqlite3, JWT, bcryptjs
- **Frontend**: Vanilla JS, CSS animations, particle effects canvas
- **Database**: SQLite (file-based, auto-created on first run)

## Disclaimer

This is an unofficial fan site. Harry Potter and all related characters are trademarks of J.K. Rowling and Warner Bros.
