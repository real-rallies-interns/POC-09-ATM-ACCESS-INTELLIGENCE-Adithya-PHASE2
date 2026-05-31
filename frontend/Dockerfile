# Stage 1: Build the production bundle
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Set up build arguments for static baking
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Serve the Next.js app
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy already-installed node_modules and compiled assets directly from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000
ENV PORT 3000

CMD ["npx", "next", "start"]
