FROM node:8

RUN mkdir /stuff
WORKDIR /stuff

COPY package.json .
COPY package-lock.json .

RUN git clone https://github.com/fuseio/bridge-contracts.git

RUN mkdir submodules && \
  mv bridge-contracts submodules && \
  cd submodules/bridge-contracts && \
  git fetch && \
  git checkout block-rewards-home-to-foreign-mint

RUN npm install --unsafe-perm

RUN cd submodules/bridge-contracts && \
  npm install && \
  ./node_modules/.bin/truffle compile && \
  cd deploy && \
  npm install

ADD . .

CMD ["npm", "start"]
