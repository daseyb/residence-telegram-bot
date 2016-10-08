# Residence Telegram Bot

This bot pulls listings from wg-gesucht.de, filters them and posts new entries to Telegram. Requires Node.js.

Be the first one to apply for your favourite apartment!

This code is in a very early stage, but already very useful.

## Usage

* `/start` starts the bot
* `/stop` stops the bot

## Deploy

You have to deploy this bot by yourself, since the filter options are the same for all users.

* Clone this repository on your server.
* Run `npm install`.
* Copy `config.json.sample` to `config.json`.
* Talk to [@BotFather](https://telegram.me/BotFather) to get a bot token.
* Add the token to `config.json`.
* Adjust the filter in the code, look out for `var filter = { ... }`
* Start with `node index.js` (you should do this inside a `screen`). That's it!

## To Do

* Implement command to set up filters (they are hardcoded at the moment).
* Keep state across restarts.
* Doesn't scale well...

## Contributing and License

This code is licensed under the AGPL license.

I welcome any contribution that makes this hacky code better, adds new features and/or more data sources.
