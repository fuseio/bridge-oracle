FROM node:8

# https://superuser.com/questions/1423486/issue-with-fetching-http-deb-debian-org-debian-dists-jessie-updates-inrelease
RUN printf "deb http://archive.debian.org/debian/ jessie main\ndeb-src http://archive.debian.org/debian/ jessie main\ndeb http://security.debian.org jessie/updates main\ndeb-src http://security.debian.org jessie/updates main" > /etc/apt/sources.list

RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install -y libc6-dev
RUN apt-get install -y libc6-dev-i386
RUN apt-get install -y wget
RUN apt-get clean

WORKDIR /bridge
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
CMD echo "To start a bridge process run:" \
  "VALIDATOR_ADDRESS=<validator address> VALIDATOR_ADDRESS_PRIVATE_KEY=<validator address private key> docker-compose up -d --build"
