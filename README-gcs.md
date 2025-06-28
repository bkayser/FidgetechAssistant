# Google Cloud Deployment Instructions

Now it's time to get serious!  Let's deploy your application to the cloud!
This application will run cleanly in any cloud infrastructure provider, but this document will guide you on 
deploying to Google Cloud.  The application is designed to run in Docker containers, and you can use 
`gcloud run deploy` to deploy the application to Google Cloud Run.  This document assumes you have a basic understanding of Docker and Google Cloud.

This assumes you have successfully deployed your containers to Docker Desktop and tested them thoroughly.  

Before executing these instructions, decide on a unique identifier for your images.
Since we are all deploying to the same project, you need a unique identifier to keep your server components 
distinct.  As a convention, we will use initials to identify your images and your services so that you won't overwrite anyone else's images.
Use at least three letters, or any other short unique identifier that you prefer.  This will be used in the image URLs, secret identifier, and service names.
 
In the instructions below, replace `IDENTIFIER` with your unique identifier.  This is important to avoid overwriting the class images!
It would be a good idea to copy the commands to a text editor and replace `IDENTIFIER` with your unique identifier before 
executing the commands, and that save the file so you can re-execute them in the future.
 
1. **Authenticate with Google Cloud**
   Authenticate and set your local default project.
   ```bash
   gcloud auth login
   gcloud config set project fidgetech
   gcloud config set compute/region us-central1
   # Authenticate Docker with Google Artifact Registry so you can push images.
   gcloud auth configure-docker us-central1-docker.pkg.dev
   ```
1. **Declare your Image URLs**   
   In the `docker-compose.yml` file, ensure you have the correct image URLs for your backend and frontend services. 
   Replace "whk" in the existing image URLS with a unique identifier. 

   Here's an example of how your `docker-compose.yml` file should look:
 
   ```yaml
   services:
     backend:
       image: us-central1-docker.pkg.dev/fidgetech/fidgetech-images/IDENTIFIER-frontend:latest
       ...
     frontend:
       image: us-central1-docker.pkg.dev/fidgetech/fidgetech-images/IDENTIFIER-frontend:latest
       ...
   ```
1. **Store your Service Account Key in the Secret Manager**
   You already have a file named `gcs-account.json` in the root of your project directory.  You tested it so you know it works.
   Now we need to make that available to the backend service in Google Cloud.  We could bundle it in the Docker image but that is not secure. Instead, we will use Google Cloud Secret Manager to store the service account key securely.
   It's a few extra steps but it's critical to keep your service account key secure and not expose it in your Docker images.
   * Create a secret in Google Cloud Secret Manager:
   ```bash
    gcloud secrets create gcp-IDENTIFIER-service-account-key --replication-policy="automatic"
    ```
    Add the key file as a secret version:
    ```bash
    gcloud secrets versions add gcp-IDENTIFIER-service-account-key --data-file=gcs-account.json
    ```
1. **Build the Docker Images**
   ```bash
   docker compose build
   ``` 
2. **Push the Images to Google Container Registry**
   This will push the images you just built to the Google Artifact Repository where they can be accessed by Google Cloud Run.

   ```bash
   docker compose push
   ```
   Ensure you are authenticated with Google Cloud and the registry before pushing the images.
3. **Deploy to Google Cloud**
   Use this command to deploy the backend service:
   ```bash
    gcloud run deploy backend-IDENTIFIER \
      --image="us-central1-docker.pkg.dev/fidgetech/fidgetech-images/IDENTIFIER-backend:latest" \
      --platform=managed \
      --region=us-central1 \
      --port=8080 \
      --allow-unauthenticated \
      --set-env-vars="SPRING_PROFILES_ACTIVE=prod" \
      --update-secrets="GCS_ACCOUNT_KEY=gcp-IDENTIFIER-service-account-key:latest"
    ```
    Make a note of the URL that is printed after the deployment completes.  This is the URL you will use to access the backend API
    and you will need it in the next step to set the environment variable for the frontend service.
 
    Use this command to deploy the frontend service:
    ```bash
    gcloud run deploy frontend-IDENTIFIER \
      --image="us-central1-docker.pkg.dev/fidgetech/fidgetech-images/IDENTIFIER-frontend:latest" \
      --platform=managed \
      --region=us-central1 \
      --port=3000 \
      --allow-unauthenticated \
      --set-env-vars="BACKEND_API_URL=BACKEND_URL_FROM_PREVIOUS_STEP"
    ```
    Make a note of the URL that is printed after the deployment completes.  This is the URL you will use to access the frontend application.

# Recap

This is basically how you can deploy your application to Google Cloud using Docker and Google Cloud Run.  It's suitable
for a demo environment and you can use it to showcase your application.  You can also use this as a starting point for deploying
your application to production.  For production, you would want to set up a more robust infrastructure with load balancing, scaling, and monitoring.

And remember, none of this is free!  As long as you are using it to show off your work, you can use the free tier.  But if you are using it for production, you will 
start to incur costs.

# Troubleshooting
If you encounter issues during deployment, here are some common troubleshooting steps:
- **Check Logs**: Use `gcloud run logs read backend-service` and `gcloud run logs read frontend-service` to check the logs for any errors.
- **Verify Environment Variables**: Ensure that the environment variables are set correctly in the deployment commands.
- **Check Secret Manager**: Ensure that the secret is created correctly and the service account key is accessible.
- **Permissions**: Ensure that the service account used for the deployment has the necessary permissions to access the resources, such as the Secret Manager and Cloud Run.
- **Service URL**: Ensure that you are using the correct service URL in your frontend application. The URL should match the one provided after the deployment of the backend service.
- **Docker Image Issues**: If you encounter issues with the Docker images, ensure that the images are built correctly and pushed to the Google Artifact Registry. You can check the images in the Google Cloud Console under "Artifact Registry" to verify that they are present and correctly tagged.
- **Google Cloud Quotas**: Ensure that you are not exceeding your Google Cloud quotas. You can check your quotas in the Google Cloud Console under "IAM & Admin" > "Quotas". If you are hitting a quota limit, you may need to request an increase or adjust your usage.
