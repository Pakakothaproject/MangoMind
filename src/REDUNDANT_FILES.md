# Analysis of Non-Application Files

This document analyzes the project's file structure to identify files that are not part of the compiled application bundle but are kept for reference or can be safely deleted.

## 1. Files Safe for Deletion

The following files are no longer used by the application and can be safely deleted from the project.

-   **`constants/chatModels.ts`**: This file exports an empty array and its comment indicates it was kept for backward compatibility. All components have now been migrated to use `useModelStore` to fetch models from the database, making this file obsolete.

## 2. Previously Redundant Files (Confirmed Removed)

The following files were previously identified as redundant and have been successfully removed from the codebase. This list is kept for historical reference.

-   `enhanced_deletion_service.ts`
-   `simple_diagnostic.js`
-   All files in the `services/gemini/*` directory.

## 3. Non-Application Files (Keep for Reference)

These files are not part of the frontend application's compiled bundle but are crucial for development, database management, or understanding external services. **Do not delete these files.**

-   **Database Schema & Scripts**:
    -   `sql.txt`: Contains the primary SQL schema, RLS policies, and setup scripts for the Supabase database.
    -   `adminsql.txt`: Contains privileged, admin-only SQL functions for database management.
    -   `modelinject.sql.txt`: A script for populating the `models` table, useful for new database setups.
    -   `Supabase Database Schema.json`: A JSON export of the database schema for reference.

-   **Documentation**:
    -   `ARCHITECTURE.md`: The main technical guide for developers.
    -   `README.md`: The primary entry point for developers.
    -   `Aimlapi.md`: Documentation on using the external `AIMLAPI` service.
    -   `runwareapi doc.txt`: Documentation and examples for using the Runware API.
    -   `model via runware.txt`: List of available Runware models and their properties.
    -   `instream doc.md`: Documentation on streaming "think out loud" data from AI models.
    -   `Modeltags.md`: Reference for tags used to categorize AI models.
