/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

require('dotenv').config();
const { Bot } = require('../lib');

const bot = new Bot({
  // quiet: true,
  endpoints: [process.env.ENDPOINT],
  username: process.env.USERNAME,
  password: process.env.PASSWORD
});


function createActions(value) {
  return [{
    title: String(value),
    actions: [{
      id: '+1',
      widget: {
        type: 'button',
        value: '+1',
        label: '+1'
      }
    }, {
      id: '-1',
      widget: {
        type: 'button',
        value: '-1',
        label: '-1'
      }
    }]
  }];
}

const state = new Map();

bot.onMessage(async (peer, message) => {
  // get self uid
  const uid = await bot.getUid();

  if (message.content.type === 'text') {
    const actions = createActions(0);
    const reply = { type: 'reply', peer, rids: [message.rid] };
    const rid = await bot.sendInteractiveMessage(peer, '', actions, reply);
    state.set(rid, 0);
  }
});

bot.onInteractiveEvent(async (event) => {
  let value = state.get(event.ref.rid) || 0;
  switch (event.id) {
    case '+1':
      value += 1;
      break;
    case '-1':
      value -= 1;
      break;
  }

  state.set(event.ref.rid, value);
  await bot.editInteractiveMessage(event.ref.peer, event.ref.rid, '', createActions(value));
});

// handle errors
bot.onError((error) => {
  console.error(error);
  process.exit(1);
});
