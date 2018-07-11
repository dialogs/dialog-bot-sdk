Dialog Bot SDK
==============

[Documentation](https://dialogs.github.io/dialog-bot-sdk)

Installation
------------

```bash
npm install @dlghq/dialog-bot-sdk
````

Usage
-----

```js
const { Bot } = require('@dlghq/dialog-bot-sdk');

const bot = new Bot(process.env.BOT_TOKEN);

bot.onMessage(async (peer, message) => {
  // get self uid
  const uid = await bot.getUid();

  // send text messages back to author
  if (message.content.type === 'text') {
    await bot.sendTextMessage(peer, message.content.text);
  }
});

// handle errors
bot.onError((error) => {
  console.error(error);
  process.exit(1);
});
```

Token
-----

How to get the token: search for `@dialog` bot at Global Dialog (https://app.dlg.im) installation or `@security` in your personal installation.
Write to the bot `/bot new nickname name` command it will answer with token, like this:
```
Yay! Bot created, bot token <token>, bot id: <id>
```
This is it.
