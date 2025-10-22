<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MangoMind: AI Developer Documentation

This document provides essential information for an AI developer tasked with modifying this application.

View your app in AI Studio: https://ai.studio/apps/drive/1MbcfwOVIoNPAaMnj8N2tJIrFYzTasxsK

## 1. Project Overview

MangoMind is an AI-powered visual creation studio built with React. It allows users to perform various image and video manipulations using generative AI models. Key features include:
- **Image Generation**: Create images from text prompts.
- **Image Editor (Studio)**: A comprehensive suite for:
    - **Virtual Try-On**: Change clothing on a person.
    - **Scene Swap**: Place a person from one image into a different scene.
    - **Hairstyle Try-On**: Change a person's hairstyle.
    - **Marketing Content**: Generate ad campaigns and product shots.
    - **Fine-grained Edits**: Inpainting, accessory/product placement, background changes, and post-processing effects.
- **Dress Me**: A simplified feature to upload a photo and see oneself in various pre-defined scenarios.
- **Video Animation**: Animate a static image based on a prompt.
- **User Management**: Authentication and profile management via Supabase.
- **Generation History**: Users can view their past creations.
- **Resource Management**:
    - **Storage Limit**: New users and basic packages receive 200MB of storage. Higher-tier packages offer increased limits (e.g., 500MB or 1GB). Usage is tracked and displayed in the "My Generations" and "Settings" pages.
    - **Credit System**: API token usage is converted into a user-friendly credit system (200 tokens = 1 credit). Users can monitor their credit consumption in their account settings and via a real-time counter.

## 2. Tech Stack & Key Libraries

*   **Framework**: React 19, TypeScript
*   **Build Tool**: Vite
*   **Routing**: React Router DOM
*   **Styling**:
    *   TailwindCSS (via CDN script in `index.html`)
    *   Custom CSS with modern theme variables (`index.css`)
*   **AI & Vision APIs**:
    *   `@google/genai`: For interacting with Google's Gemini family of models (Imagen, Flash, VEO).
    *   `@mediapipe/tasks-vision`: For face landmark detection, used in the "Restore Original Face" feature.
*   **Backend & Database**:
    *   `@supabase/supabase-js`: Handles user authentication, profiles, and storing generation metadata.
*   **Image Hosting**:
    *   Generated images are persisted as data URLs directly within the Supabase database in the `generations` table.

## 3. Project Structure

```
.
├── public/
├── src/
│   ├── components/    # Reusable React components
│   ├── constants/     # Static data (presets, model names)
│   ├── hooks/         # Custom React hooks for business logic
│   ├── pages/         # Top-level page components
│   ├── services/      # API clients and interaction logic
│   │   ├── gemini/    # Gemini-specific services
│   │   └── ...
│   ├── utils/         # Helper functions (image processing)
│   ├── App.tsx        # Main component, router, global state
│   ├── index.css      # Global styles and theme variables
│   └── index.tsx      # Application entry point
└── index.html         # Main HTML file, includes CDN links
```

## 4. Architecture & Key Concepts

### State Management
The application uses a mix of local component state (`useState`) and custom hooks for managing complex, feature-specific logic. While there is no global state management library like Redux or Zustand, state is primarily managed in top-level page components (like `App.tsx` and `StudioPage.tsx`) and passed down to children via props ("prop drilling"). Complex logic is encapsulated within custom hooks (e.g., `useStudio.ts`) to improve organization.

### Routing
Routing is handled by **`react-router-dom`**. The root of the application is wrapped in a `<HashRouter>`. All page routes are defined declaratively within `App.tsx` using `<Routes>` and `<Route>` components. Navigation is performed using `<NavLink>` for sidebar links and the `useNavigate` hook for programmatic routing.

### API Keys & Configuration
There is a notable inconsistency in API key management:
*   **Gemini API Key**: The `services/gemini/client.ts` file exclusively uses `process.env.API_KEY`. The execution environment is expected to provide this.
*   **Supabase**: Keys are hardcoded in `services/supabaseClient.ts`.

### Image Handling
*   Images are primarily handled as the `UploadedImage` type (`{ base64: string, type: string }`).
*   `utils/image.ts` contains crucial helper functions for converting between formats, fetching images from URLs, and performing client-side manipulations like cropping and pasting.

### Asynchronous Operations
*   Most AI generation tasks are long-running and use `AbortController` for cancellation.

### Resource Management
- **Storage**: The application tracks the size of each generated image, which is stored in the Supabase `generations` table (`size_bytes` column). The total usage is calculated by `generationService.ts` and surfaced to the user in the UI. For older images without a size recorded, a reasonable average size is estimated to ensure accurate accounting.
- **Credits & Tokens**: All token-consuming operations (chat, image generation, etc.) are logged in the `token_usage` table via `tokenService.ts`. The global `appStore` fetches this data and makes it available throughout the application. UI components then convert this raw token usage into a user-friendly "credit" metric for display.

## 5. Run Locally

**Prerequisites:** Node.js

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Set Environment Variables**: Create a file named `.env.local` in the project root and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    ```
    *Note: The application's Gemini services are configured to use `process.env.API_KEY`. The execution environment is expected to make this variable available from the `.env.local` file.*

3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the local URL provided by Vite.