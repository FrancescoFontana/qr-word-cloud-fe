# QR Word Cloud

An interactive web application that allows users to submit words associated with artwork and view them in a real-time word cloud visualization.

## Features

- Real-time word cloud updates via WebSocket
- Two main pages:
  - Submit page: Users can input words associated with artwork
  - View page: Displays the word cloud visualization
- Blurred background effect with word cloud
- Modern, responsive UI with Tailwind CSS
- TypeScript for type safety

## Prerequisites

- Node.js 18.x or later
- npm or yarn

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables file:
   ```bash
   cp .env.local.example .env.local
   ```
4. Update the environment variables in `.env.local` with your WebSocket server URL
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/
│   ├── submit/[code]/
│   │   └── page.tsx    # Submit page component
│   ├── view/[code]/
│   │   └── page.tsx    # View page component
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── components/
│   └── WordCloud.tsx   # Word cloud component
├── services/
│   └── websocket.ts    # WebSocket service
└── store/
    └── wordCloudStore.ts # Zustand store
```

## Environment Variables

- `NEXT_PUBLIC_WS_URL`: WebSocket server URL
- `NEXT_PUBLIC_API_URL`: API base URL

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Socket.IO Client
- React-Wordcloud
- Zustand

## Development

The application uses the following development tools:

- ESLint for code linting
- TypeScript for type checking
- Tailwind CSS for styling

## License

MIT 