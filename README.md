# RelayAPI
### Full-Stack API Development and Testing Platform

RelayAPI is a full-stack API development and testing platform that combines a React-based frontend with an Express.js backend and PostgreSQL database.

The project integrates the original RelayAPI frontend with API Nova backend functionality while maintaining compatibility with existing RelayAPI API endpoints.

It provides an environment for creating, configuring, executing, managing and sharing API requests through a unified interface.

---

## 1. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 |
| Styling | CSS |
| Security | Helmet, CORS, URL validation |
| Containerization | Docker, Docker Compose |
| Package Management | npm |

## 2. System Architecture

The application follows a frontend–backend–database architecture.

```text
          USER
            |
            v
    REACT + TYPESCRIPT
        FRONTEND
            |
            | HTTP / REST API
            v
      EXPRESS.JS SERVER
            |
     +------+-------+
     |      |       |
     v      v       v
  AUTH   REQUEST  SHARE &
 ROUTES  EXECUTION COLLECTIONS
     |      |       |
     +------+-------+
            |
            v
       POSTGRESQL
        DATABASE
```

### Main Components

**Frontend**
- React-based user interface.
- TypeScript application structure.
- API request configuration and execution interface.
- Collection and request management.
- Sharing functionality.

**Backend**
- Express.js REST API.
- Authentication routes.
- API request execution proxy.
- Collection management.
- Share-link generation and retrieval.
- RelayAPI-compatible endpoints.

**Database**
- PostgreSQL relational database.
- Persistent storage for collections, history and environments.
- Database schema and initialization scripts.

## 3. Project Structure

```text
RelayAPI-Integrated/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── init.js
│   │   │   ├── pool.js
│   │   │   └── schema.sql
│   │   │
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

## 4. Key Features

### API Request Management
- Configure and execute HTTP requests.
- Support for GET, POST, PUT, PATCH, DELETE and HEAD methods.
- Configure request headers, parameters and request bodies.
- View API responses.

### Backend API Services
- Express.js server architecture.
- REST API endpoints.
- Authentication routes.
- Request execution and validation services.
- RelayAPI-compatible API routes.

### Collection Management
- Organise API requests into collections.
- Store collection information.
- Manage saved API requests.

### Shareable API Requests
- Generate unique share tokens.
- Store request snapshots in PostgreSQL.
- Retrieve shared snapshots through API endpoints.
- Generate API URLs and cURL commands.
- Share links with a 30-day expiration period.

### Database Integration
- PostgreSQL 16 integration.
- Persistent storage.
- Database initialization scripts.
- Docker-based database setup.

### Security
- HTTP security headers using Helmet.
- Configurable CORS.
- URL validation for request execution.
- Private and local network destination restrictions by default.

## 5. Installation and Setup

### Prerequisites

Install the following:

- Node.js 20 or newer (Node.js 22 LTS recommended).
- npm.
- Docker Desktop.
- Git.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Habeeba908/RelayAPI-Integrated.git
cd RelayAPI-Integrated
```

### Step 2: Start the Database

From the project root:

```bash
docker compose up -d db
```

Wait until the PostgreSQL container reports a healthy status.

### Step 3: Configure the Backend

Open a separate terminal:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run db:init
npm run dev
```

Backend server:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

### Step 4: Start the Frontend

Open another terminal in the project root:

```bash
npm install
npm run dev
```

Open the URL provided by Vite in your browser.

The frontend normally runs at:

`http://localhost:3000`

## 6. API Endpoints

The backend exposes the following API groups:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend and database health |
| POST | `/api/requests/execute` | Execute API requests |
| POST | `/api/requests/validate` | Validate requests |
| POST | `/api/security/check` | Security checks |
| POST | `/api/errors/explain` | Explain request errors |
| GET / POST | `/api/collections` | Manage collections |
| PUT / DELETE | `/api/collections/:id` | Update or delete collections |
| POST | `/api/collections/:id/run` | Collection compatibility endpoint |
| GET / POST / DELETE | `/api/history` | Manage request history |
| GET / PUT / DELETE | `/api/environments` | Manage environments |
| POST | `/api/auth/signup` | User registration |
| POST | `/api/auth/login` | User authentication |
| GET / POST / DELETE | `/api/share` | Share-link operations |

Additional API Nova collection endpoints are available under:

`/api/nova/collections/`

Share-link retrieval is available under:

`/api/share/:token`

## 7. Database Configuration

RelayAPI uses PostgreSQL 16 for backend data persistence.

The database configuration is managed through environment variables.

Configuration templates:

- `.env.example`
- `backend/.env.example`

Database initialization:

```bash
npm run db:init
```

The PostgreSQL service is managed through Docker Compose.

Never commit actual `.env` files or database credentials to GitHub.

## 8. Development Commands

**Frontend — project root**

```bash
npm install
npm run dev
npm run build
npm run lint
```

**Backend — backend directory**

```bash
npm install
npm run dev
npm start
npm run db:init
```

## 9. Implementation Notes and Limitations

- The original RelayAPI React frontend is retained.
- API Nova backend functionality is integrated without replacing the original frontend.
- PostgreSQL provides backend persistence, while the frontend retains its existing local-storage fallback.
- The current frontend does not yet include login and signup screens.
- The collection runner interface uses the existing RelayAPI request service. The backend collection-run compatibility endpoint currently reports saved requests as skipped.
- Private and local network destinations are restricted by default by the backend request proxy.
- Shared snapshots are retrieved through backend API endpoints; a complete frontend shared-view route should not be assumed.

## 10. Future Improvements

Potential future development includes:

- Frontend authentication and user profiles.
- Role-based access control.
- Enhanced API response visualisation.
- Advanced collection execution and reporting.
- Improved shared-request viewing interface.
- Deployment to a cloud hosting platform.
- Automated backend and frontend testing.

## 11. Contributors

**Project:** RelayAPI — Full-Stack Integrated Project

**Repository:** [GitHub — RelayAPI-Integrated](https://github.com/Habeeba908/RelayAPI-Integrated)

---

*Built with React, TypeScript, Express.js and PostgreSQL.*
