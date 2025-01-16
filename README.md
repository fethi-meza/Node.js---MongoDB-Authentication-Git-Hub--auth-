# Node.js + MongoDB Authentication Project

## Features
- User Registration
- Login with Email & Password
- Email Verification
- Forgot Password & Reset Password
- GitHub Authentication (via Passport.js)
- Update User Information
- Logout

## Prerequisites
- Node.js (v14 or later)
- MongoDB (local or cloud, e.g., MongoDB Atlas)
- GitHub account for OAuth


1. Create a `.env` file in the project root and configure the following:
   ```env
   PORT=3000
   MONGO_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   NODEMAILER_USER=<your_email_user>
   NODEMAILER_PASS=<your_email_password>
   GITHUB_CLIENT_ID=<your_github_client_id>
   GITHUB_CLIENT_SECRET=<your_github_client_secret>
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

#### Register User
- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
   msg: "check your mail to verify email",
   email
   }
  ```
#### Login User
- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "userID":"", // Mongodb-ObjectId
    "name": "fethi",
    "role": "user"
  }
  ```

#### Verify Email
- **URL:** `/api/auth/verify-email?token=<token>&email=<email>`
- **Method:** `GET`

#### Forgot Password
- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "email": "fethi-dev@example.com"
  }
  ```

#### Reset Password
- **URL:** `/api/auth/reset-password?token=<token>`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "password": "newpassword123"
  }
  ```

#### GitHub Authentication
- **URL:** `/auth/github`
- **Method:** `GET`

#### GitHub Callback
- **URL:** `/auth/github/callback`
- **Method:** `GET`

### User Management

#### Update User
- **URL:** `/api/auth/update`
- **Method:** `PATCH`
- **Headers:**
  - Authorization: `CookieToken`
- **Request Body:**
  ```json
  {
    "name": "John Doe Updated",
    "email": "fethi-dev@example.com"
  }
  ```

#### Logout
- **URL:** `/api/auth/logout`
- **Method:** `POST`

## Folder Structure
```
project-root/
├── src/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── errros/
│   ├── utils/
    ├── test/
│   └── app.js
├── .env
├── .gitignore
├── package.json
├── README.md
└── app.js
```

## Libraries Used
- **Express.js**: For building the server.
- **Mongoose**: MongoDB object modeling.
- **Passport.js**: For GitHub authentication.
- **JWT**: For handling authentication tokens.
- **Nodemailer**: For email functionality.
- **BCrypt.js**: For password hashing.
- **Jest.js**: For unit testing.

## GitHub Authentication Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) and create a new OAuth application.
2. Set the callback URL to `http://localhost:3000/auth/github/callback`.
3. Copy the Client ID and Client Secret into the `.env` file.

