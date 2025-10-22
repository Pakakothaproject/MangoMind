# MangoMind: Application Architecture

This document provides a comprehensive overview of the MangoMind application's architecture, data flow, and key design patterns. It is intended to be the primary technical guide for developers working on this project.

## 1. Guiding Principles

The architecture is built on the following core principles:

-   **Centralized State Management**: Business logic, user interactions, and asynchronous operations are managed centrally within dedicated **Zustand stores**, not in UI components. This is the core of the application's design.
-   **Component Decoupling**: UI components are kept as "dumb" as possible. They subscribe directly to the state they need from a Zustand store and dispatch actions. This eliminates "prop drilling," promotes reusability, and simplifies testing.
-   **Service Abstraction**: All external API communications (Supabase, AIMLAPI, Runware) are isolated in a dedicated "service" layer. The UI and state logic are agnostic to the specific API implementation.
-   **Modularity**: The codebase is organized by feature and responsibility (`pages`, `components`, `services`, `store`) to ensure maintainability and scalability.

## 2. Architectural Diagram

The application follows a unidirectional data flow, orchestrated by multiple feature-specific Zustand stores.

```
+-----------------------------------------------------------------------------------+
|                                  Browser/Client                                   |
| +-------------------------------------------------------------------------------+ |
| |                                   React UI                                    | |
| | +---------------------+ +-----------------------+ +-------------------------+ | |
| | |      Pages          | |      Components       | |          Hooks          | | |
| | | (e.g., StudioPage)  | | (e.g., LeftPanel)     | | (e.g., useLocalStorage) | | |
| | +---------------------+ +-----------------------+ +-------------------------+ | |
| |           ^                         ^                           ^             | |
| |           | Subscribes to           | Subscribes to             | Uses        | |
| |           | (via selectors)         | (via selectors)           |             | |
| | +---------+-------------------------+---------------------------+-----------+ | |
| | |                                                                           | | |
| | |                 Zustand "Feature Stores" (Global State)                   | | |
| | | +------------------+ +------------------+ +-----------------+ +----------+ | | |
| | | |    appStore      | |   studioStore    | |   chatStores    | |  ...etc  | | | |
| | | | (Global/Auth)    | | (w/ Slices)      | | (Chat Feature)  | |          | | | |
| | | +------------------+ +------------------+ +-----------------+ +----------+ | | |
| | |                                     |                                   | | |
| | |                                     | Calls (via Actions)               | | |
| | |                                     v                                   | | |
| | +-------------------------------------+-----------------------------------+ | |
| |                                     |                                       | |
| | +-------------------------------------+-----------------------------------+ | |
| | |                              Service Layer                            | | |
| | |                            (services/*)                               | | |
| | | +-----------------+  +-----------------+  +-------------------------+ | | |
| | | |   AI Services   |  | Supabase Service|  | Supabase Edge Functions | | | |
| | | | (AIMLAPI, etc.) |  |  (DB, Auth)     |  |   (Secure API Proxies)  | | | |
| | | +-----------------+  +-----------------+  +-------------------------+ | | |
| |           |                    |                    |                     | |
| +-----------+--------------------+--------------------+---------------------+ |
+-------------+--------------------+--------------------+-----------------------+
              |                    |                    |
              v                    v                    v
+------------------------+ +------------------------+ +------------------------+
|   External AI APIs     | |   External Services    | |   External AI APIs     |
|   (AIMLAPI/Runware)    | |      (Supabase)        | |    (Direct via Proxy)  |
+------------------------+ +------------------------+ +------------------------+
```

## 3. Layered Architecture

### 3.1. Presentation Layer (UI)

-   **`pages`**: Top-level components mapped to routes (e.g., `StudioPage`, `ChatPage`). They assemble the overall page layout and connect to their dedicated state store(s).
-   **`components`**: Reusable UI elements. These components often connect directly to the relevant Zustand store for the state and actions they need, which is a key pattern in this app to avoid "prop drilling".

### 3.2. State Management Layer (Zustand)

The application's state is managed by **Zustand**, a lightweight state management library. The architecture uses a "feature store" pattern, where each major feature has its own dedicated store. This keeps state management modular, scoped, and highly performant.

-   **`store/appStore.ts`**: The main global store. It manages application-wide state such as user authentication (session, profile), top-level navigation, and global resource usage (token/credit and storage consumption).
-   **`store/studioStore.ts`**: A complex store for the `StudioPage`, composed of smaller, domain-specific **slices** (`assetsSlice`, `generationSlice`, `historySlice`, etc.). This pattern keeps the large store organized by concern.
-   **`store/chat/*`**: The chat feature's state is split across multiple domain-specific stores: `useChatSessionStore`, `useChatMessagesStore`, and `usePersonaStore`. This pattern provides excellent separation of concerns for a complex feature.
-   **`store/imageGenerationStore.ts`**: Manages all state related to the standalone "Generate Image" feature.
-   **Other Stores**: `dressMeStore`, `marketingStore`, and `generationsStore` follow the same pattern, encapsulating the state and logic for their respective features.

### 3.3. Service Layer

-   **`services`**: This layer abstracts all communication with external APIs. Its sole responsibility is to make API requests and return data or throw an error. It contains no application state logic; that resides in the Zustand store actions.
-   **`services/ai/*`**: A business-logic layer that composes prompts and orchestrates calls to lower-level services like `runwareService` and `aimlapiService`.
-   **`supabase/functions/*`**: **Supabase Edge Functions** (`aimlapi`, `runware`) act as secure server-side proxies. These functions receive requests from the client, inject secret API keys on the server, and then forward the requests to the respective external APIs. This critical pattern prevents sensitive credentials from ever being exposed in the browser.

## 4. Resource Management

-   **Token & Credit Usage**: `services/tokenService.ts` logs token consumption to the database by calling the `consume_resource_and_log` and `log_runware_usage_and_deduct_tokens` RPC functions. The global `appStore` fetches the user's balance, and UI components like `TokenCounter` display it.
-   **Storage Limit**: `services/generationService.ts` records image sizes in the `generations` table. The `appStore` fetches the total usage via `getTotalStorageUsage`, which is then displayed in the UI relative to the user's limit.

## 5. Architectural Recommendations

This section outlines critical areas for improvement to enhance security, performance, and maintainability.

### 5.1. Security (High Priority)

*   **Hardcoded API Keys**:
    *   **Vulnerability**: The `services/supabaseClient.ts` file contains hardcoded, plaintext Supabase credentials (`supabaseUrl`, `supabaseAnonKey`).
    *   **Risk**: These keys are exposed on the client-side and, if ever committed to version control, must be considered compromised. While they are `anon` keys, this is poor practice.
    *   **Recommendation**: **Immediately rotate all Supabase credentials**. Move the new keys to environment variables (`.env`) and update `supabaseClient.ts` to read from `import.meta.env`. The `README.md` and `REDUNDANT_FILES.md` provide further guidance on this critical issue.

### 5.2. Performance & Optimization

*   **Route-based Code Splitting**:
    *   **Observation**: `App.tsx` eagerly imports all page components, increasing the initial bundle size and load time.
    *   **Recommendation**: Implement route-based code splitting. Use `React.lazy()` to dynamically import page components and wrap the `<Routes>` component with `<React.Suspense>` and a loading fallback UI. This will significantly improve initial page load speed.

*   **Efficient Image Handling**:
    *   **Observation**: The application frequently passes large `base64` data URLs between components and stores them in state. This is memory-intensive.
    *   **Recommendation**: For client-side rendering (e.g., image previews), use `URL.createObjectURL()` to create lightweight Blob URLs. Only convert images to `base64` strings immediately before sending them to an API that requires it.

### 5.3. Code Quality & Maintainability

*   **Refactor Playground State Management**:
    *   **Observation**: The `PlaygroundPage` component directly imports and uses `useStudioStore` and `useMarketingStore`. This is a significant architectural flaw that couples the Playground to the implementation details of other pages.
    *   **Recommendation**: The `PlaygroundPage` should be self-contained. Any shared functionality (e.g., a try-on feature) should be encapsulated in a reusable service or custom hook, not by sharing page-level stores. This will improve modularity and reduce unexpected side effects.

*   **Stale Code Comments**:
    *   **Observation**: The codebase contains numerous `// FIX:` comments that refer to issues that have already been resolved (e.g., incorrect argument counts, missing types).
    *   **Recommendation**: Perform a codebase-wide search for `// FIX:` and remove all stale comments. This improves code clarity and ensures developers focus on actual, current issues.
