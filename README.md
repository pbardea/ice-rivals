<p align="center">
  <img src="client/public/favicon.png" alt="Ice Rivals" width="80" />
</p>

<h1 align="center"><a href="https://icerivals.com">Ice Rivals</a></h1>

<p align="center">A multiplayer figure skating board game where players compete across 3 rounds, building skating programs, rolling dice, and sabotaging opponents.</p>

<p align="center"><strong><a href="https://icerivals.com">Play now →</a></strong></p>

<p align="center">
  <img src="screenshot.png" alt="Ice Rivals gameplay" width="720" />
</p>

## How to Play

**1–8 players** compete in a figure skating competition over **3 rounds**.

### Game Modes
- **Singles** — Free-for-all (1–8 players)
- **Pairs** — Team-based (4+ players, even numbers required)

### Round Flow
1. Each player receives a hand of **element cards** (jumps, spins, steps, choreography) and one **incident card** (sabotage)
2. During the **planning phase**, pick elements for your skating program (3–6 depending on the round)
3. Optionally play your incident card against an opponent (e.g., Loose Blade, Wardrobe Malfunction, Rival Psych-Out)
4. Programs are **revealed**, then each element is **rolled** on a D6:
   - Roll ≥ threshold → success (base score + possible GOE bonus)
   - Roll < threshold → fall (negative penalty)
5. A random **judge card** modifies scoring each round (Technical Judge, Strict Judge, Fan Favorite, etc.)
6. **Round 3 is the Championship** — all scores are multiplied by 1.5x

The player (or team) with the highest cumulative score after 3 rounds wins.

### Rooms & Multiplayer
- Create a room from the home screen and share the link or room code with friends
- Players who join after a game starts become **spectators** and can join the next game
- If you refresh the page, you'll automatically rejoin your room
- Rooms are cleaned up when all players leave

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Getting Started

```bash
# Install dependencies
npm install

# Start dev servers (client on :5173, server on :3001)
npm run dev
```

### Project Structure

```
├── client/          # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/   # UI components (Lobby, GameBoard, etc.)
│   │   ├── hooks/        # useSocket.ts (Socket.io client)
│   │   └── types/        # TypeScript type definitions
│   └── vercel.json       # Vercel rewrites (proxies socket.io to backend)
├── server/          # Express + Socket.io backend
│   └── src/
│       └── game/         # Game logic (cards, mechanics, rooms, state)
├── k8s/             # Kubernetes manifests (Hetzner deployment)
├── deploy.sh        # Manual deploy script
└── package.json     # Monorepo root (npm workspaces)
```

### Building for Production

```bash
npm run build    # Builds both client and server
npm start        # Runs the server (serves client from client/dist)
```

### Deployment

- **Frontend**: Deployed on Vercel (icerivals.com). Vercel rewrites proxy `/socket.io/*` to the backend.
- **Backend**: Deployed on Hetzner via k3s (Kubernetes). CI deploys automatically on push to `main`.
- **Manual deploy**: `npm run deploy` (reads secrets from `.env.deploy`)

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | Allowed origins for Socket.io (comma-separated) | `http://localhost:5173` |

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b my-feature`
3. Install dependencies: `npm install`
4. Run the dev servers: `npm run dev`
5. Make your changes and test locally with multiple browser tabs
6. Commit and push: `git push origin my-feature`
7. Open a Pull Request

### Guidelines
- Keep game logic in `server/src/game/` — the server is the source of truth
- The client is a thin UI layer driven by Socket.io events
- TypeScript strict mode is enabled for both client and server

## Bug Reports

Found a bug? [Open an issue](https://github.com/pbardea/ice-rivals/issues) on GitHub with steps to reproduce and we'll take a look.
