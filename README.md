# Orbit — Social Network Platform (Arch Technologies Task 4)

A responsive social-networking portfolio project built with React, Vite, Express, and Socket.IO.

## Features
- Profile page with editable display name and bio
- Create text posts and attach an image (up to 2 MB)
- Public, Friends, and Only me post-audience options
- Like posts, add comments, and search the feed
- Friend requests, accept/ignore, and friend list
- Notifications panel and unread indicators
- Responsive dark UI
- Local browser persistence with `localStorage`
- Socket.IO events for live post, like, comment, profile, and friend-request updates across connected browser sessions

## Requirements
- Node.js 18+ (Node.js 20 LTS recommended)
- npm

## Run locally (Windows PowerShell)
1. Extract the ZIP.
2. Open the extracted `arch-task-4-social-network` folder in VS Code.
3. Open Terminal > New Terminal and verify you are in the folder containing `package.json`.
4. Install packages:
   ```powershell
   npm install
   ```
5. Start the frontend and real-time server:
   ```powershell
   npm run dev
   ```
6. Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The frontend runs on port 5173 and the Socket.IO server runs on port 4000. Keep the terminal running. Open the app in two browser tabs to try real-time event updates.

## Production build
```powershell
npm run build
```
The build output is created in `dist/`.

## Important notes
- This is a functional internship/demo project, not a production social network.
- Demo accounts are seeded; there is no real login, database, password security, or server-side authorization.
- Posts and settings persist in the current browser via localStorage. The Socket.IO server broadcasts live events but does not store them.
- Privacy options are implemented for the local demo feed, but they are not a substitute for server-enforced access control.
- Uploaded images are held in browser storage as data URLs and are limited to 2 MB.
- The free-form demo uses external Unsplash imagery and Google Fonts; those require internet access.
- For a production release, add authentication, a database, server-side privacy checks, validated uploads/object storage, rate limiting, and secure deployment configuration.
