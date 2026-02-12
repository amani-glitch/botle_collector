FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN mkdir -p /output && \
    if [ -d "build" ]; then cp -r build/* /output/; \
    elif [ -d "dist" ]; then \
      if ls dist/*/browser/index.html 2>/dev/null; then cp -r dist/*/browser/* /output/; \
      else cp -r dist/* /output/; fi; \
    fi

FROM nginx:alpine
COPY --from=build /output /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
