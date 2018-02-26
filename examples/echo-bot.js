/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

const { Bot } = require('../lib');

const bot = new Bot({
  // quiet: true,
  endpoints: [process.env.ENDPOINT],
  username: process.env.USERNAME,
  password: process.env.PASSWORD
});

bot.onMessage(async (peer, message) => {
  // get self uid
  const uid = await bot.getUid();

  console.log(message);
  if (message.content.type === 'text') {
    const actions = [{
      title: 'Example',
      actions: [{
        id: 'test',
        widget: {
          type: 'button',
          value: 'test',
          label: 'Test'
        }
      }]
    }];
    const reply = { type: 'reply', peer, rids: [message.rid] };
    await bot.sendInteractiveMessage(peer, message.content.text, actions, reply);
  }
});

// handle errors
bot.onError((error) => {
  console.error(error);
  process.exit(1);
});
