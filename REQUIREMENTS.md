# Project Requirements - Construction ERP v1.0.0

## System Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **SQLite**: (Bundled via `sqlite3` driver)
- **External Hosting**: Ngrok (optional, for public testing)

## Backend Dependencies (Node.js/Express)
- **Framework**: `express`
- **Database**: `sqlite3`
- **Security**: `bcrypt`, `jsonwebtoken`, `helmet`, `xss`, `cors`, `express-rate-limit`
- **Validation**: `joi`
- **Documentation**: `swagger-ui-express`, `swagger-jsdoc`
- **File Generation**: `pdfkit`
- **Utilities**: `dotenv`, `compression`, `winston`, `node-cron`, `node-schedule`, `nodemailer`
- **Development**: `nodemon`, `jest`, `supertest`

## Frontend Dependencies (React/Vite)
- **Core**: `react`, `react-dom`, `react-router-dom`
- **HTTP Client**: `axios`
- **Charts/Analytics**: `recharts`
- **Development**: `vite`, `@vitejs/plugin-react`, `eslint`

## Configuration
- Environment variables: `.env` (Backend)
- Port assignment: 5001 (Backend), 5173 (Frontend)
- Build system: Vite (Frontend)
