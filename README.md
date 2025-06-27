# Fidgetech AI Q&A Bot

This is a template application for the Fidgetech AI Training Program coding exercise. The app is a React-based Q&A bot that allows users to ask questions about technical documentation. It uses Retrieval Augmented Generation (RAG) to provide answers, retrieving relevant document snippets and source titles from a backend API.

## Features

- Ask questions about technical documentation.
- AI-generated answers using RAG.
- Displays retrieved document snippets and their sources.
- User-friendly interface with loading and error handling.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Backend API running at `http://localhost:8080` (see your exercise instructions for backend setup)

## Getting Started

1. **Install dependencies**

   Navigate to the `app` directory and install the required packages:

   ```bash
   cd app
   npm install
   ```

2. **Start the development server**

   Run the app in development mode:

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

3. **Ask questions**

    - Enter your question in the text area and submit.
    - The AI will respond with an answer and show relevant document snippets and sources.

## Notes

- Make sure the backend API is running and accessible at `http://localhost:8080`.
- This template is intended for educational purposes as part of the Fidgetech AI Training Program.

## License

This project is for educational use only.

