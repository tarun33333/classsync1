# ClassSync Backend

## Setup & Installation
1. `cd backend`
2. `npm install`
3. Create `.env` file (see below)
4. `npm run seed` (to populate initial data)
5. `npm run dev` (to start server)

## Environment Variables (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/classsync
JWT_SECRET=your_jwt_secret
```

## API Documentation
- **Auth**:
  - `POST /api/auth/login`: { email, password, macAddress }
  - `POST /api/auth/register`: { name, email, password, role, ... }
- **Sessions** (Teacher):
  - `POST /api/sessions/start`: { subject, section, bssid, ssid }
  - `POST /api/sessions/end`: { sessionId }
  - `GET /api/sessions/active`
- **Attendance** (Student):
  - `GET /api/attendance/dashboard`: Get today's classes
  - `POST /api/attendance/verify-wifi`: { sessionId, bssid }
  - `POST /api/attendance/mark`: { sessionId, code, method: 'otp'|'qr' }

## Database Schema
- **User**: Name, Email, Password, Role, MacAddress (Student)
- **Session**: Teacher, Subject, OTP, QRCode, BSSID, IsActive
- **Attendance**: Session, Student, Status, Method, DeviceMac
- **ClassRoutine**: Teacher, Subject, Day, Time
