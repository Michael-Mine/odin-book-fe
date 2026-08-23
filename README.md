# Odin-Book - Frontend Repo (Backend is Separate)

A frontend repo for a Social Media Site - similar to Facebook, by Michael Mine.

Live Link on Netlify: https://mrmine-odin-book.netlify.app/

![Screenshot](/public/screenshot-odin-book.png)

This is one of the final projects from The Odin Project - a free, open-source curriculum teaching full-stack web development.

Built from scratch with Vite using React and Javascript with 141 tests using Vitest and React Testing Library. Hosted on Netlify.

Connects to this separate backend API repo using Node, Express, PostgreSQL and Prisma ORM. Hosted on Railway.

Backend repo here: https://github.com/Michael-Mine/odin-book-api

Note: As backend is REST API, it cannot handle real time updates. Page reloads (top left icon) are needed to check for new posts.

## Features

- Users can send follow request to other users.
- Users can create, comment on and like posts.
- Users have a feed to see recent posts.
- Updatable profiles for users to view.
- Authorisation using Passport local and sessions
- Validations on backend.

## Tech Stack

| Layer    | Technologies                                |
| -------- | ------------------------------------------- |
| Frontend | React, JavaScript, Vite, Native CSS modules |
| Backend  | Node, Express, JavaScript                   |
| Database | PostgreSQL, Prisma ORM                      |
| Testing  | Vitest, React Testing Library, Jest         |

## System Architecture

The application is split into a 2 repos for clear separation of concerns.

- **Server**: A RESTful API focused on controller functions and middleware validation.
- **Client**: Component-based SPA.

## Database Schema

```prisma
model Session {
  id          String   @id
  sid         String   @unique
  data        String
  expiresAt   DateTime
}

model User {
  id            Int       @id @default(autoincrement())
  cuid          String    @default(cuid(2))
  username      String    @unique
  password      String
  name          String
  bio           String?
  picURL        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
  following     Follow[]  @relation("Following")
  followers     Follow[]  @relation("Followers")
  posts         Post[]
  comments      Comment[]
  likes         Like[]
}

enum FollowStatus {
  PENDING
  ACCEPTED
  REJECTED
  BLOCKED
}

model Follow {
  follower    User          @relation("Following", fields: [followerId], references: [id])
  followerId  Int
  following   User          @relation("Followers", fields: [followingId], references: [id])
  followingId Int
  createdAt   DateTime      @default(now())
  status      FollowStatus  @default(PENDING)
  @@id([followerId, followingId])
}

model Post {
  id            Int       @id @default(autoincrement())
  cuid          String    @default(cuid(2))
  content       String
  picURL        String?
  createdAt     DateTime  @default(now())
  deletedAt     DateTime?
  author        User      @relation(fields: [authorId], references: [id])
  authorId      Int
  comments      Comment[]
  likes         Like[]
  @@index([authorId])
}

model Comment {
  id          Int         @id @default(autoincrement())
  cuid        String      @default(cuid(2))
  content     String
  createdAt   DateTime    @default(now())
  deletedAt   DateTime?
  author      User        @relation(fields: [authorId], references: [id])
  authorId    Int
  post        Post        @relation(fields: [postId], references: [id])
  postId      Int
  @@index([authorId])
  @@index([postId])
}

model Like {
  user      User        @relation(fields: [userId], references: [id])
  userId    Int
  post      Post        @relation(fields: [postId], references: [id])
  postId    Int
  @@id([userId, postId])
  createdAt DateTime    @default(now())
}
```

## API Endpoints

| Method | Endpoint                          | Description                            | Auth |
| ------ | --------------------------------- | -------------------------------------- | ---- |
| POST   | /auth/sign-up                     | Create a new account                   | No   |
| POST   | /auth/login                       | Log in and create a session            | No   |
| POST   | /auth/logout                      | End the current session                | No   |
| GET    | /auth/session                     | Return the logged-in user              | No   |
| GET    | /users                            | Search or list users                   | Yes  |
| PUT    | /users/me                         | Update a user's profile                | Yes  |
| GET    | /users/:userCuid                  | Get a user's profile                   | Yes  |
| GET    | /users/:userCuid/posts            | Get a user's posts                     | Yes  |
| GET    | /users/:userCuid/followers        | Get a user's followers                 | Yes  |
| GET    | /users/:userCuid/following        | Get users they follow                  | Yes  |
| POST   | /users/:userCuid/follow           | Sends a follow request                 | Yes  |
| POST   | /follow-requests/:userCuid/accept | Accept a request                       | Yes  |
| DELETE | /follow-requests/:userCuid        | Reject or cancel a request             | Yes  |
| GET    | /follow-requests/received         | Get received requests                  | Yes  |
| GET    | /follow-requests/sent             | Get sent requests                      | Yes  |
| GET    | /feed                             | Get posts from user and followed users | Yes  |
| GET    | /posts/:postCuid                  | Get one post                           | Yes  |
| POST   | /posts                            | Create a post                          | Yes  |
| GET    | /posts/:postCuid/comments         | Get a post's comments                  | Yes  |
| POST   | /posts/:postCuid/comments         | Create a comment                       | Yes  |
| GET    | /posts/:postCuid/likes            | Get users who liked a post             | Yes  |
| POST   | /posts/:postCuid/likes            | Like a post                            | Yes  |

Note: POST used instead of GET due to JWTs needed in request body for authentication.

## Local Development

### Setup

**1. Clone & Install:**

```bash
git clone https://github.com/Michael-Mine/odin-odin-book-fe.git

npm install
```

**2. Environment Setup:**

Create a `.env` in root with `VITE_API_URL="http://localhost:3000/"`

**3. Run Development Server:**

```bash
npm run dev
```

**4. Run Tests:**

```bash
npm run test
```

## Deployment on Netlify

1. Link GitHub repo

2. Check default Build command is as:

```bash
npm run build
```

3. Check default Publish directory is as `dist`

4. Add an environment variable key: `VITE_API_URL` with value as the public hosted URL for the API repo.
