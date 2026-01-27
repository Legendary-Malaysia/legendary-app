# Legendary App - Project Context

## Project Overview

**Legendary App** is a comprehensive Next.js application built with a focus on AI integration (LangChain, Gemini) and customer support features. It features an Admin Dashboard, a Voice Agent interface, and a support ticket management system.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) / Shadcn UI patterns
- **State Management:** URL-based state with `nuqs`, React Server Components
- **Backend & Auth:** [Supabase](https://supabase.com/) (`@supabase/ssr`)
- **AI & LLM:** LangChain, LangGraph, Google Gemini (implied by `GeminiAudioChat`)
- **Package Manager:** pnpm

## Key Directories

- `src/app`: Contains the application routes (App Router).
  - `admin/`: Admin dashboard, account settings, and support ticket management.
  - `voice-agent/`: Feature page for the AI voice assistant.
  - `api/`: Backend API routes (Chat, Tickets, Auth).
- `src/components`: Reusable UI components.
  - `ui/`: Base UI components (likely Shadcn UI).
  - `thread/`: Components related to chat interfaces and AI interactions.
  - `voice-call/`: Components for voice interactions.
- `src/lib`: Utility functions and configuration.
  - `supabase/`: Supabase client and server configuration.
  - `utils.ts`: Common utilities including the `cn` helper for Tailwind.

## Building and Running

### Prerequisites

- Node.js (Ensure compatibility with Next.js 16)
- pnpm (`npm install -g pnpm`)
- Supabase project credentials (configured in `.env` files)

### Scripts

The following scripts are defined in `package.json`:

- **Development Server:**

  ```bash
  pnpm dev
  ```

  Starts the local development server at `http://localhost:3000`.

- **Build:**

  ```bash
  pnpm build
  ```

  Builds the application for production.

- **Start Production Server:**

  ```bash
  pnpm start
  ```

  Runs the built application.

- **Linting:**
  ```bash
  pnpm lint
  ```
  Runs ESLint to check for code quality issues.

## Development Conventions

- **Component Structure:** Use functional components. UI components are located in `src/components/ui`.
- **Styling:** Use Tailwind CSS utility classes. Use the `cn()` utility from `src/lib/utils.ts` for conditional class merging.
- **Database Access:** Use the Supabase client initialized in `src/lib/supabase/`. Prefer Server Components for data fetching where possible.
- **Authentication:** Supabase Auth is used for user management. Session handling logic is present in `src/proxy.ts` (likely acting as middleware) and `src/lib/supabase/`.
- **AI Integration:** AI features are built using LangChain/LangGraph. Chat interfaces support multimodal interactions (text, voice).
