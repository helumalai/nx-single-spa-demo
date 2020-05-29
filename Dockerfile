### Setup ###
FROM node:12-alpine

## install the envsubst command
RUN apk add gettext

## Main file to start
COPY server.js .

# Copy node dependencies
COPY node_modules /node_modules

ARG APPLICATION
## From host as builder, copy over the artifacts in dist folder
COPY ./dist/apps/$APPLICATION /dist/apps/emcp

RUN chmod 777 /dist/apps/emcp

# When the container starts, replace the env.js with values from environment variables
CMD ["/bin/sh",  "-c",  "envsubst < /dist/apps/emcp/assets/env.template.js > /dist/apps/emcp/assets/env.js && exec node server.js"]