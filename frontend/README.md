# ClassSync Frontend

## Setup & Installation
1. `cd frontend`
2. `npm install`
3. Update `api/client.js` with your computer's IP address.
4. `npx expo start`

## Features
- **Student**:
  - View today's classes
  - Mark attendance (WiFi check + OTP/QR)
  - View history
- **Teacher**:
  - Start session
  - View live attendance
  - Generate OTP/QR

## Testing
- Use Expo Go app on your phone.
- Ensure phone and computer are on the same WiFi.
- For "WiFi Verification", the app sends a debug BSSID. In production, use a native module to get real BSSID.
