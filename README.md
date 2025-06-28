# Fidgetech AI Q&A Bot

This is a template application for the Fidgetech AI Training Program coding exercise. The app is a React-based Q&A bot that allows users to ask questions about technical documentation. It uses Retrieval Augmented Generation (RAG) to provide answers, retrieving relevant document snippets and source titles from a backend API.

## Features

- Ask questions about technical documentation.
- AI-generated answers using RAG.
- Displays retrieved document snippets and their sources.
- User-friendly interface with loading and error handling.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for managing Docker containers locally)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (for deploying to Google Cloud)
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Getting Started

1. **Fork the repository**

   Start by forking this repository on GitHub to your own account. This allows you to make changes and submit pull requests
   for any improvements or bug fixes.
 
2. **Clone the repository**
   Clone your forked repository to your local machine using the repository URL found in your forked repository on GitHub.
   For exmample:
   ```bash
   git clone git@github.com:yourgithubid/FidgetechAssistant.git
   ```
   If you are unfamiliar with Github or do not have an account, your instructor can help you get this set up.
 
1. **Authenticate with Google Cloud**

   If you plan to deploy the application to Google Cloud, ensure you have the Google Cloud SDK installed and authenticated. You can authenticate using:
   ```bash
   gcloud auth login
   ```
   Set the default project to `fidgetech`:
   ```bash
   gcloud config set project fidgetech
   ```
   
1. **Install dependencies**

   In both the `fa-backend` and `fa-frontend` directories, run the following commands to install the necessary dependencies:
   ```bash
   npm install
   ```
1. Create a Google Cloud Storage bucket

   Create a Google Cloud Storage bucket to store the documents. You can do this via the Google Cloud Console or using the command line:
   ```bash
   gsutil mb gs://your-bucket-name
   ```
   Replace `your-bucket-name` with a unique name for your bucket.  Pick a name that identifies you, the student, such as `fidgetech-student-yourname`.

1. **Upload documents to the bucket**
   
   Upload the documents you want to use for the Q&A bot to the Google Cloud Storage bucket you created. You can use the command line:
   ```bash
   gsutil cp path/to/your/documents/* gs://your-bucket-name/
   ```
   Ensure that the documents are in a format supported by the backend.  By default, the backend expects Markdown (.md) files, but you can modify the backend to support other formats if needed.
 
1. **Obtain API Key**
   
   You will need an API key for the service account you will use to access the backend.  This key is for you specifically. 
   Treat it as highly sensitive information as it contains your private key.  You will obtain it from your instructor. This will
   be a json file that you will store locally in `fa-backend/gcs-account.json`. Do not commit this file to version control!
 
1. **Start the backend server**

   Navigate to the `fa-backend` directory and run the backend server:
   ```bash
   npm run start
   ```
   The backend API will be available at [http://localhost:8080](http://localhost:8080).
 
1. **Start the frontend server**

   Run the app in development mode:
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

1. **Ask questions**

    - Enter your question in the text area and submit.
    - The AI will respond with an answer and show relevant document snippets and sources.


## Running in Docker Desktop

The application runs cleanly in Docker Desktop using Docker Compose. The `docker-compose.yml` file defines the services for the backend, frontend, and database.
To deploy the application using Docker Compose, follow these steps:
1. **Do a docker build**
   Ensure you have Docker Desktop running and navigate to the root directory of the project. Run the following command to build the Docker images:
   ```bash
   docker compose build
   ```
2. **Run the application**
   After building the images, you can start the application using:
   ```bash
   docker compose up -d
   ```
   This will start the backend and frontend. The application will be accessible at [http://localhost:3000](http://localhost:3000).
   
## Google Cloud Deployment

When you have everything working and want to deploy to the cloud to show your instructor, classmates, friends, or
even complete strangers, you can deploy the backend and frontend services to Google Cloud Run and serve them
on the internet.  Follow [these instructions](README-gcs.md) to deploy the application to Google Cloud.

## Notes
- All code is written in TypeScript for both the backend and frontend.  If you are new to TypeScript, you can find many resources online to help you get started.
  It's basically JavaScript with type annotations, so if you are familiar with JavaScript, you will find it easy to pick up.
- This code was developed using Intellij IDEA, but you can use any IDE or text editor you prefer.  If you are new to IntelliJ, you can find many resources online to help you get started.
- Be sure and start by forking the project in github so you can keep up to date, propose bugfixes, and share your code 
  with your instructor and classmates.
- Familiarize yourself with Docker by finding some articles or querying your favorite LLM.
- This template is intended for educational purposes as part of the Fidgetech AI Training Program.
