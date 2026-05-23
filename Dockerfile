# Use Node 18 on Alpine Linux (lightweight and secure)
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for Prisma and Bcrypt
# - openssl: Required by Prisma Client
# - python3, make, g++: Required to build bcrypt from source if needed
RUN apk add --no-cache openssl python3 make g++

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the Prisma folder specifically
COPY prisma ./prisma

# Generate Prisma Client
# (CRITICAL: This ensures the client is built for the container's Linux OS, not your local OS)
RUN npx prisma generate

# Copy the rest of your source code
COPY . .

# Expose the port defined in your server.js
EXPOSE 4000

# Start the server using the "start" script from package.json
CMD ["npm", "start"]