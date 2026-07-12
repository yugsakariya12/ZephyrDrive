# Stage 1: Build the Next.js application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Set dummy env variable to bypass build connection check
ENV MONGODB_URI=mongodb://localhost:27017/car-dealership
ENV JWT_SECRET=dummy_secret_for_build
RUN npm run build

# Stage 2: Run the Next.js application
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/models ./models
COPY --from=builder /app/lib ./lib
RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]
