# FE: build bằng Node, phục vụ tĩnh bằng Nginx; Nginx chuyển /api sang BE (cùng origin nên cookie refresh hoạt động).
FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 80
