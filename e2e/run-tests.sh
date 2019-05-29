docker-compose up -d --build

docker-compose run e2e npm run deploy

docker-compose run --name bridge-watcher-signature-request -d bridge npm run watcher:signature-request
docker-compose run --name bridge-watcher-collected-signatures -d bridge npm run watcher:collected-signatures
docker-compose run --name bridge-watcher-affirmation-request -d bridge npm run watcher:affirmation-request

docker-compose run --name bridge-erc-watcher-signature-request -d bridge-erc npm run watcher:signature-request
docker-compose run --name bridge-erc-watcher-collected-signatures -d bridge-erc npm run watcher:collected-signatures
docker-compose run --name bridge-erc-watcher-affirmation-request -d bridge-erc npm run watcher:affirmation-request

docker-compose run --name bridge-erc-native-watcher-signature-request -d bridge-erc-native npm run watcher:signature-request
docker-compose run --name bridge-erc-native-watcher-collected-signatures -d bridge-erc-native npm run watcher:collected-signatures
docker-compose run --name bridge-erc-native-watcher-affirmation-request -d bridge-erc-native npm run watcher:affirmation-request

docker-compose run --name bridge-erc-multiple-watcher-signature-request -d bridge-erc-multiple npm run watcher:signature-request
docker-compose run --name bridge-erc-multiple-watcher-collected-signatures -d bridge-erc-multiple npm run watcher:collected-signatures
docker-compose run --name bridge-erc-multiple-watcher-affirmation-request -d bridge-erc-multiple npm run watcher:affirmation-request
docker-compose run --name bridge-erc-multiple-watcher-bridge-deployed -d bridge-erc-multiple npm run watcher:bridge-deployed

docker-compose run --name bridge-sender-home -d bridge npm run sender:home
docker-compose run --name bridge-sender-foreign -d bridge npm run sender:foreign

docker-compose run e2e npm start
rc=$?
docker-compose down
exit $rc
