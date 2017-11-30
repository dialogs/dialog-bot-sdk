/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

const { Bot } = require('../lib');

const bot = new Bot({
  quiet: true,
  endpoints: ['wss://ws1.dlg.im'],
  phone: '75555555555',
  code: '5555'
});

bot.onMessage(async (peer, message) => {
  // get self uid
  const uid = await bot.getUid();

  console.log(message);
  if (message.content.type === 'text') {
    await bot.sendTextMessage(peer, message.content.text);
  }
});

// handle errors
bot.onError((error) => {
  console.error(error);
  process.exit(1);
});
