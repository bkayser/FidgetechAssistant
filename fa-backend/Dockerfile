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
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
# We use 'node server.js' directly. For production, consider process managers like PM2 or more robust solutions.
CMD [ "node", "server.js" ]
