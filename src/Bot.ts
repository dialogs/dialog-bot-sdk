/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

import {
  Peer,
  User,
  Group,
  Message,
  OutAttach,
  FileReference,
  FileDescription,
  InteractiveEvent,
  MessageAttachment,
  MessageMediaInteractiveActionGroup
} from './types/index';

import { EventEmitter } from 'events';
import createClient from './client';
import ResolveMessageQueue from './private/ResolveMessageQueue';

export type BotOptions = {
  quiet?: boolean,
  endpoints: string[],
  phone?: string,
  code?: string,
  username?: string,
  password?: string
};

/**
 * Main bot object.
 */
class Bot {
  private ready: Promise<any>;
  private emitter: EventEmitter;
  private messageQueue: ResolveMessageQueue;

  constructor(options: BotOptions) {
    this.emitter = new EventEmitter();
    this.ready = this.setup(options);
  }

  private async setup(options) {
    const messenger = await createClient({
      quiet: options.quiet,
      endpoints: options.endpoints
    });

    await new Promise((resolve, reject) => {
      const onSuccess = () => resolve(messenger);
      const onError = (tag: string, message: string) => reject(new Error(`${tag}: ${message}`));

      if (typeof options.phone === 'string' && typeof options.code === 'string') {
        messenger.requestSms(
          options.phone,
          () => messenger.sendCode(options.code, onSuccess, onError)
        );
      } else if (typeof options.username === 'string' && typeof options.password === 'string') {
        messenger.startUserNameAuth(
          options.username,
          () => messenger.sendPassword(options.password, onSuccess, onError),
          onError
        );
      } else {
        throw new Error('Auth credentials not defined');
      }
    });

    this.messageQueue = new ResolveMessageQueue(messenger);

    messenger.onUpdate((update) => {
      this.emitter.emit(update.type, update.payload);
    });

    return messenger;
  }

  private onAsync(eventName: string, callback: (...args: any[]) => Promise<void>): void {
    this.emitter.on(eventName, (...args) => {
      callback(...args).catch((error) => this.emitter.emit('error', error));
    });
  }

  /**
   * Subscribes to any bot error.
   */
  onError(callback: (error: any) => void) {
    this.emitter.on('error', callback);
  }

  /**
   * Subscribes to incoming messages.
   */
  onMessage(callback: (peer: Peer, message: Message) => Promise<void>) {
    this.onAsync('MESSAGE_ADD', async ({ peer, mid, sender }) => {
      const messenger = await this.ready;
      if (sender === messenger.getUid()) {
        return;
      }

      const message = await this.messageQueue.resolve(peer, mid);
      await callback(peer, message);
    });
  }

  /**
   * Subscribes for interactive events.
   */
  onInteractiveEvent(callback: (event: InteractiveEvent) => Promise<void>) {
    this.onAsync('INTERACTIVE_EVENT', async (event) => {
      const messenger = await this.ready;
      const ref = await messenger.getMessageRef(event.mid);

      await callback(Object.assign(event, ref));
    });
  }

  /**
   * @returns self uid
   */
  async getUid(): Promise<number> {
    const messenger = await this.ready;
    return messenger.getUid();
  }

  /**
   * Finds locally stored user by id.
   *
   * @param uid user id
   */
  async getUser(uid: number): Promise<User | null> {
    const messenger = await this.ready;
    return messenger.getUser(uid);
  }

  /**
   * Finds locally stored group by id.
   *
   * @param gid group id
   */
  async getGroup(gid: number): Promise<Group | null> {
    const messenger = await this.ready;
    return messenger.getUser(gid);
  }

  /**
   * Optimistically sends text message.
   *
   * @param peer   target peer
   * @param text   message text
   * @param attach message attachment (reply/forward)
   *
   * @returns Message rid.
   */
  async sendTextMessage(peer: Peer, text: string, attach: OutAttach): Promise<string> {
    const messenger = await this.ready;
    return messenger.sendMessage(peer, text, attach);
  }

  /**
   * Edits text message.
   *
   * @param peer target peer
   * @param rid  message rid
   * @param text new message text
   */
  async editTextMessage(peer: Peer, rid: string, text: string): Promise<void> {
    const messenger = await this.ready;
    await messenger.editMessage(peer, rid, text);
  }

  /**
   * Optimistically sends interactive message.
   *
   * @param peer    target peer
   * @param text    message text
   * @param actions interactive actions
   * @param attach  message attachment (reply/forward)
   *
   * @returns Message rid.
   */
  async sendInteractiveMessage(
    peer: Peer,
    text: string,
    actions: MessageMediaInteractiveActionGroup[],
    attach?: OutAttach
  ): Promise<string> {
    const messenger = await this.ready;
    return messenger.sendInteractiveMessage(peer, text, actions, attach);
  }

  /**
   * Edits interactive message.
   *
   * @param peer target peer
   * @param rid  message rid
   * @param text new message text
   * @param actions new interactive actions
   */
  async editInteractiveMessage(
    peer: Peer,
    rid: string,
    text: string,
    actions: MessageMediaInteractiveActionGroup[]
  ): Promise<void> {
    const messenger = await this.ready;
    messenger.sendInteractiveMessage(peer, rid, text, actions);
  }

  /**
   * Reads all messages in given chat.
   *
   * @param peer target peer
   */
  async readChat(peer: Peer): Promise<void> {
    const messenger = await this.ready;
    messenger.onConversationOpen(peer);
    messenger.onConversationClosed(peer);
  }

  /**
   * Optimistically sends file message.
   *
   * @param peer target peer
   * @param fileName path to file in filesystem
   *
   * @returns Message rid.
   */
  async sendFileMessage(peer: Peer, fileName: string, attach?: MessageAttachment | null): Promise<string> {
    const messenger = await this.ready;
    const file = await (File as any).create(fileName);
    return messenger.sendFile(peer, file, attach);
  }

  /**
   * Loads file urls by references.
   */
  async loadFileUrls(files: FileReference[]): Promise<FileDescription[]> {
    const messenger = await this.ready;
    return messenger.loadFileUrls(files);
  }

  /**
   * Loads file url.
   */
  async loadFileUrl(file: FileReference): Promise<string | null> {
    const urls = await this.loadFileUrls([file]);
    if (urls.length) {
      return urls[0].url;
    }

    return null;
  }
}

export default Bot;
