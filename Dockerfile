# boilerplate
FROM kilianciuffolo/http-server:5.1.1
MAINTAINER kilian@lukibear.com

# app
WORKDIR /website
ADD package.json ./
RUN npm install && npm cache clean

ADD . ./
RUN BUILD_ENV=ci node_modules/.bin/gulp
CMD ["dist", "-p", "80"]

EXPOSE 80
