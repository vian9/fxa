#!/bin/bash -ex

DIR=$(dirname "$0")

cd "$DIR/.."

mkdir -p config
cp ../version.json ./
cp ../version.json config

cd ../../
mkdir -p ~/.pm2/logs
mkdir -p artifacts/tests
yarn workspaces foreach \
    --verbose \
    --topological-dev \
    --include 123done \
    --include browserid-verifier \
    --include fxa-auth-db-mysql \
    --include fxa-auth-server \
    --include fxa-content-server \
    --include fxa-graphql-api \
    --include fxa-payments-server \
    --include fxa-profile-server \
    --include fxa-react \
    --include fxa-settings \
    --include fxa-shared \
    --include fxa-support-panel \
    run start > ~/.pm2/logs/startup.log

# ensure email-service is ready
_scripts/check-url.sh localhost:8001/__heartbeat__
# ensure payments-server is ready
_scripts/check-url.sh localhost:3031/__lbheartbeat__
# ensure content-server is ready
_scripts/check-url.sh localhost:3030/bundle/app.bundle.js
# ensure settings is ready
_scripts/check-url.sh localhost:3030/settings/static/js/bundle.js

npx pm2 ls

cd packages/fxa-content-server
mozinstall /firefox.tar.bz2
./firefox/firefox -v

time (node tests/intern.js --suites='shootout' --output='../../artifacts/tests/test-results.xml')
