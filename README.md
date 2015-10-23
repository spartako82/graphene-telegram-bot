# Bot for Graphene

Provide infos for graphene blockchain and monitor witnesses

# Install required libs:

npm install

# Prerequisite

Set up an empty wallet with ws connection enabled
```
./cli_wallet -w empty -s wss://bitshares.openledger.info:443/ws/ -r 127.0.0.1:8099
```
  url in this example is: ws://127.0.0.1:8099

# Configure

  * Select a conf_example for telegram or slack and copy in conf.json
  * Create a bot in telegram or in slack and get the bot token
  * For Telegram:
  https://core.telegram.org/bots
  * For Slack:
  https://api.slack.com/bot-users
  * change conf.json with the new token and the wallet url

# Run
```
  node bin/gphbot.js conf.json
```
