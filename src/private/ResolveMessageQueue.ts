/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

import { Peer, Message, MessageContent } from '../types/index';

/**
 * @private
 */
function isContentOk(content: MessageContent) {
  switch (content.type) {
    case 'photo':
    case 'voice':
    case 'video':
    case 'document':
      return Boolean(content.fileUrl);
    default:
      return true;
  }
}

/**
 * @private
 */
function checkMessage(message: Message) {
  if (message && isContentOk(message.content)) {
    return message.attachment ? message.attachment.messages.every(checkMessage) : true;
  }

  return false;
}

/**
 * @private
 */
class ResolveMessageQueue {
  private queue: Array<(messenger: any) => void>;
  private messenger: any;

  constructor(messenger: any) {
    this.queue = [];
    this.messenger = messenger;
  }

  private dequeue() {
    setImmediate(() => {
      const fn = this.queue.shift();
      if (fn) {
        fn(this.messenger);
      }
    });
  }

  resolve(peer: Peer, mid: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      this.queue.push(messenger => {
        messenger.onConversationOpen(peer);
        let binding = messenger.bindMessages(peer, messages => {
          try {
            const full = messages.find(item => item.mid === mid);
            if (checkMessage(full)) {
              messenger.onConversationClosed(peer);
              if (binding) {
                binding.unbind();
                binding = null;
              }

              resolve(full);
            }
          } catch (error) {
            reject(error);
            if (binding) {
              binding.unbind();
              binding = null;
            }
          } finally {
            this.dequeue();
          }
        });

        binding.initAll();
      });

      this.dequeue();
    });
  }
}

export default ResolveMessageQueue;
