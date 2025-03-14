FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
# Use npm install instead of npm ci to avoid package-lock.json issues
RUN npm install --production --no-package-lock

# Copy app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "server.js"]