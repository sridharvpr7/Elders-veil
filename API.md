# ComicVerse REST API Specification

Base URL: `http://localhost:5000/api`

Standard API Response Format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {}
}
```

---

## 🔐 Authentication Endpoints

### `POST /api/auth/register`
Create a new user account.
- **Request Body**:
  ```json
  {
    "displayName": "Jane Doe",
    "username": "janedoe",
    "email": "jane@example.com",
    "password": "Password123!",
    "dateOfBirth": "2000-01-01"
  }
  ```
- **Response**: `201 Created` with JWT token and user profile object.

### `POST /api/auth/login`
Authenticate user with credentials.
- **Request Body**:
  ```json
  {
    "identifier": "janedoe", // username or email
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK` with JWT token and user profile object.

### `GET /api/auth/me`
Fetch currently authenticated user profile.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response**: `200 OK` with user object.

### `POST /api/auth/change-password`
Update authenticated user's password.
- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**: `{ "currentPassword": "...", "newPassword": "..." }`

### `DELETE /api/auth/account`
Delete current user account and all associated bookmarks/history.
- **Headers**: `Authorization: Bearer <jwt_token>`

---

## 📖 Comic Endpoints

### `GET /api/comics`
Fetch paginated list of comics with optional search and filters.
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search` (text query)
  - `genre` (e.g. Action)
  - `status` (ongoing / completed)
  - `type` (webcomic, manhwa, manga, webtoon)
  - `sort` (latest, oldest, popular, rating, az, za)

### `GET /api/comics/:id`
Fetch single comic detail by ID or slug with chapter list.

### `POST /api/comics` (Admin Only)
Create a new comic entry.
- **Headers**: `Authorization: Bearer <admin_jwt_token>`

### `PUT /api/comics/:id` (Admin Only)
Update existing comic details.

### `DELETE /api/comics/:id` (Admin Only)
Delete comic entry.

---

## 🔖 Favorites & History Endpoints

### `GET /api/users/me/favorites`
Get current user's favorite comics.

### `POST /api/users/me/favorites/:comicId`
Add comic to user's favorites.

### `DELETE /api/users/me/favorites/:comicId`
Remove comic from user's favorites.

### `GET /api/users/me/history`
Fetch current user's reading history.

### `PUT /api/users/me/progress/:comicId`
Update reading progress for a comic.
- **Request Body**:
  ```json
  {
    "chapterId": "chapter-001-1",
    "chapterNumber": 1,
    "pageNumber": 3,
    "totalPages": 4,
    "progressPercentage": 75
  }
  ```
