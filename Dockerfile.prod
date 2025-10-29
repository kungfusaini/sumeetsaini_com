# Base the website on a lean Nginx image
FROM nginx:stable-alpine

# Copy all the static website files into the Nginx content directory
COPY . /usr/share/nginx/html

# Expose the standard Nginx port
EXPOSE 80
