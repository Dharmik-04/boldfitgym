# Integration & Setup Instructions

This document provides setup instructions for **shadcn/ui**, **Tailwind CSS**, and **TypeScript**, along with the architectural reasoning behind project structure conventions.

---

## 1. Project Architecture & The Importance of `/components/ui`

In a standard modern frontend React/Next.js workspace, the component tree is divided by responsibilities:
- **`/components/ui/`**: Reserved for raw, atomic, reusable primitive components (e.g., buttons, input fields, checkboxes, modals) added via the **shadcn/ui** CLI.
- **`/components/blocks/` (or `/components/`)**: Reserved for composite layout sections, feature sections, or complex composed widgets (like `ScrollExpandMedia`).

### Why is `/components/ui` Critical?
1. **shadcn CLI Default Targeting**: The shadcn configuration (`components.json`) specifies a `ui` key under `aliases.components`. When you run `npx shadcn@latest add <component>`, the CLI automatically generates the file under the configured UI path (typically `@/components/ui`). If this folder doesn't exist or is not matching the config, CLI installations will be misplaced or fail.
2. **Separation of Concerns**: Atomic components inside `ui` should be decoupled from business logic and page-specific layouts, serving as the design system's vocabulary. Keeping them in `ui` keeps the design system clean.
3. **Deterministic Alias Resolution**: The project path mappings in `tsconfig.json` resolve `@/*` to `./*`. A clean structure prevents circular dependencies and complex relative path navigation (e.g., `../../ui/button` vs `@/components/ui/button`).

---

## 2. Setting Up a New Project from Scratch

If you are setting up this project structure in a new codebase, follow these steps:

### Step 2.1: Initialize TypeScript & Tailwind CSS (via Next.js)
If initializing a new Next.js application, run:
```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --import-alias "@/*" --use-npm --yes
```
This automatically sets up:
1. **TypeScript** (generates `tsconfig.json`, `next-env.d.ts`)
2. **Tailwind CSS** (installs Tailwind and PostCSS configuration)
3. **App Router** (`app/` folder)

### Step 2.2: Setup shadcn/ui CLI
Initialize shadcn configuration in the project:
```bash
npx shadcn@latest init
```
During initialization, the CLI will ask:
- **Style**: Default or New York
- **Base Color**: Zinc, Slate, etc.
- **CSS Variables**: Yes/No
- **tailwind.config.ts path**: (e.g., `tailwind.config.ts`)
- **Global CSS path**: (e.g., `app/globals.css`)
- **Import Alias**: `@/*`
- **Components Alias**: `@/components`
- **Utils Alias**: `@/lib/utils`

This command generates `components.json` at the root of your project, which guides subsequent component installations.

### Step 2.3: Install Peer Dependencies
For animations and interactions used by premium components, install:
```bash
npm install framer-motion lucide-react
```

---

## 3. Running & Verifying the Workspace

Start the local development server:
```bash
npm run dev
```
To verify the production build:
```bash
npm run build
```
