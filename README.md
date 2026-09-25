# Quiz Master

Quiz Master is a Next.js application for building and running live team quiz games. It supports standard turn-based games and team envelope grids, multiple-choice and manually judged questions, Cloudinary media, live scoring, passing, wheel selection, results, and event history.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharukad%2Fquess-master&env=MONGODB_URI%2CNEXTAUTH_SECRET%2CNEXT_PUBLIC_CLOUDINARY_CLOUD_NAME%2CCLOUDINARY_API_KEY%2CCLOUDINARY_API_SECRET&project-name=quess-master&repository-name=quess-master)

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

## Vercel deployment

The repository is configured for zero-configuration Next.js deployment on Vercel using Node.js 24. Import the GitHub repository, configure the required secrets, and deploy. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for the exact Atlas, environment-variable, health-check, and custom-domain steps.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Every database operation is scoped to the signed-in owner. Durable game state, attempts, scores, media metadata, sessions, envelope state, and history are stored in MongoDB.
