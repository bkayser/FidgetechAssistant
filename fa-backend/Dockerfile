# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# We copy these two files separately to leverage Docker's caching,
# so npm install is only re-run if dependencies change.
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY package.json server.js ./

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
# We use 'node server.js' directly. For production, consider process managers like PM2 or more robust solutions.
CMD [ "node", "server.js" ]
# To start the container so you can examine files and debug:
# docker run -it --rm -v $(pwd):/app -p 8080:8080 fa-backend:latest sh
# CMD ["tail", "-f", "/dev/null"]
