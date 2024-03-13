FROM ubuntu:jammy
ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /app


# deps
RUN apt update

ENV NODE_VERSION=21.6.1
RUN apt install -y curl
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

RUN apt install -y python3 python3-pip
RUN apt install -y texlive-xetex texlive-fonts-recommended texlive-plain-generic texlive-bibtex-extra
RUN curl -sLO https://github.com/jgm/pandoc/releases/download/3.1.12.2/pandoc-3.1.12.2-1-amd64.deb
RUN dpkg -i pandoc-3.1.12.2-1-amd64.deb
RUN pip install nbconvert IPython gdown
# unfuck dependecies
RUN rm -f /usr/bin/bibtex
RUN ln -s /usr/bin/bibtex.original /usr/bin/bibtex


# server
COPY package*.json ./

RUN npm install
RUN npm install -g forever

COPY . .

ENV KEY=/etc/letsencrypt/live/nbconvert-online.com/privkey.pem
ENV CERT=/etc/letsencrypt/live/nbconvert-online.com/fullchain.pem

EXPOSE 80 443


# run
RUN mkdir data
CMD [ "npm", "run", "start" ]
