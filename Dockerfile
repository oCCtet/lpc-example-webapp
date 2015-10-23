FROM node:0.10

ENV appdir /usr/src/app

RUN mkdir -p $appdir
WORKDIR $appdir

COPY ./web-app $appdir

EXPOSE 8079
VOLUME /usr/etc

CMD [ "npm", "start" ]
