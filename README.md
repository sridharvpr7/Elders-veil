# ComicVerse - Full-Stack Web Comic Reading Platform

A modern, high-performance, full-stack **Comic Reading Platform** built with **Vanilla HTML5/CSS3/JavaScript** frontend, **Node.js & Express REST API** backend, and a normalized **PostgreSQL** relational database.

---

## 🔒 Security Notice

> [!IMPORTANT]
> This application includes a client-side LocalStorage demonstration mode for standalone local usage as well as a full Express + PostgreSQL REST API backend with bcrypt password hashing and JWT authentication.
> 
> Production authentication requires a secure backend, password hashing, HTTPS, session/token management, and server-side validation. Never store real production passwords or sensitive credentials in unencrypted LocalStorage.

---

## 🌟 Architecture & Features

* **Full-Stack REST API Architecture**:
  * **Frontend**: HTML5, Vanilla CSS3, ES6 Vanilla JS, Fetch API (Zero frontend frameworks)
  * **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs` password hashing, `multer` file uploads, `helmet` security headers, `express-rate-limit`
  * **Database**: PostgreSQL with normalized relational tables (`users`, `comics`, `chapters`, `chapter_pages`, `favorites`, `reading_history`, `reading_progress`, `user_preferences`)
* **User Authentication & Account Management**:
  * Registration with real-time password strength meter and duplicate username/email detection
  * Cinematic dark login screen with password visibility toggle
  * User profile management (display name, avatar preview/upload, bio)
  * Account security settings (password change, reading progress reset, permanent account deletion modal)
  * Guest Mode support (guests can browse, search, and read comics without creating an account)
  * Dynamic header navigation updating based on authentication state
* **Admin Management Console**:
  * Admin dashboard statistics (`admin.html`)
  * Comic title creation & metadata management (`admin-comics.html`)
  * Chapter page uploads (`admin-chapters.html`)
  * User accounts & roles administration (`admin-users.html`)
* **Immersive Webcomic Reader**:
  * Continuous vertical strip reading
  * Page scroll percentage progress tracker
  * Fullscreen toggle, Zoom Fit Width / Fit Screen controls
  * Keyboard navigation (`Arrow Left/Right`, `Space`, `F`, `Esc`, `?`)

---

## 🚀 How to Run the Platform

### Option A: Standalone Client Mode (Zero Backend Setup Needed)

1. Start any local static web server in the root folder:
   ```bash
   # Using Python
   python -m http.server 8000

   # Or using Node http-server
   npx http-server -p 8000
   ```
2. Open your browser at `http://localhost:8000`.
3. The frontend will automatically detect that no Node.js backend is running and seamlessly fall back to local JSON data and `LocalStorage` user authentication.

---

### Option B: Full-Stack Mode (Node.js + PostgreSQL REST API)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Set Up PostgreSQL Database**:
   Create the database and execute `database/schema.sql`:
   ```bash
   psql -U postgres -c "CREATE DATABASE comicverse_db;"
   psql -U postgres -d comicverse_db -f database/schema.sql
   psql -U postgres -d comicverse_db -f database/seed/seed.sql
   ```

4. **Start the Express REST API Server**:
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:5000`.

---

## 📝 User Account Pages Overview

- `login.html`: Cinematic login page
- `register.html`: Account creation with password strength meter
- `profile.html`: Profile page displaying user stats, avatar, and bio
- `account.html`: Account security, password change, history reset, account deletion
- `admin.html`: Admin management portal

---

## ⌨️ Reader Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `→` / `Down` / `Space` | Scroll down / Next Page |
| `←` / `Up` | Scroll up / Previous Page |
| `F` | Toggle Fullscreen Mode |
| `?` | Show Shortcuts Help Modal |
| `Esc` | Exit Fullscreen / Close Modal |
