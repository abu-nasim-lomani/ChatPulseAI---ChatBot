# SaaS Chatbot Monorepo

This directory contains the new multi-tenant SaaS version of the chatbot.

## Structure

*   **`apps/api`**: The backend server (Node.js + Express + TypeScript). Handles business logic, database connections, and API requests.
*   **`apps/web`**: The admin dashboard (Next.js). Where tenants manage their chatbots.
*   **`packages/widget`**: The embeddable chat widget (Vanilla JS).

## Tech Stack

*   **Runtime**: Node.js
*   **Language**: TypeScript
*   **Database**: PostgreSQL (Planned)
*   **Real-time**: Socket.io
