# Quiz Master

Quiz Master is a Next.js application for building and running live team quiz games. It supports standard turn-based games and team envelope grids, multiple-choice and manually judged questions, Cloudinary media, live scoring, passing, wheel selection, results, and event history.

## Stack

- Next.js 16, React 19, and TypeScript
- MongoDB Atlas with Mongoose
- NextAuth credential sessions
- Cloudinary media storage
- Tailwind CSS and Framer Motion

## Local setup

Copy `.env.example` to `.env.local` and configure MongoDB Atlas, NextAuth, and Cloudinary. Then run:

```bash
npm install
npm run dev
```

The development server runs at <http://localhost:3006>.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Every database operation is scoped to the signed-in owner. Durable game state, attempts, scores, media metadata, sessions, envelope state, and history are stored in MongoDB.
