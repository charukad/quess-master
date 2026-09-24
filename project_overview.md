# Quiz Master — Project Overview

Quiz Master is a live quiz management application for a game master. A signed-in host can create games, add and order teams, build multiple-choice or manual questions, attach Cloudinary media, and run either a standard turn-based quiz or an envelope-grid game.

## Architecture

- Next.js App Router provides server-rendered pages and Server Actions.
- NextAuth provides credential authentication and signed JWT sessions.
- MongoDB Atlas is the sole persistent data store.
- Mongoose defines users, games, teams, questions, media metadata, sessions, attempts, scores, envelopes, and event history.
- Cloudinary stores uploaded image, audio, and video content.
- IndexedDB provides the browser-side queue used by offline recovery features.

## Game modes

### Standard

Questions rotate through the configured team order. The game master marks answers correct or wrong, passes to another eligible team, selects an eligible team randomly, adjusts scores, or closes a question. Each completed question advances to the next pending question.

### Envelope Grid

Questions are assigned to numbered envelopes and target teams. Envelopes move through locked, available, opened, and completed states. Completing all envelopes completes the session.

## Data and security rules

- Every Server Action authenticates the user.
- Game and session access is restricted by `createdBy` ownership.
- Related team, question, media, and envelope IDs are validated against the owned parent resource.
- Correct-answer points are read from the frozen session question on the server.
- Score and gameplay actions use unique action IDs to prevent duplicate application.
- Completed sessions retain frozen teams and question settings for stable historical results.

## Reliability

Game actions are recorded as attempts, score transactions, and event entries. Session state includes a monotonically increasing version. The browser displays offline status and retains a persistent local action queue for recovery work.
