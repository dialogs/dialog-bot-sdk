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
import { convertPeer } from './private/utils/api';

import { EventEmitter } from 'events';
import Jimp = require('jimp');
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

  /**
   * Subscribes to any update. This is undocumented functionality.
   */
  onAsync(eventName: string, callback: (...args: any[]) => Promise<void>): void {
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
    this.onAsync('UpdateMessage', async ({ peer, mid, senderUid }) => {
      const messenger = await this.ready;
      if (senderUid === messenger.getUid()) {
        return;
      }

      const convertedPeer = convertPeer(peer);
      const message = await this.messageQueue.resolve(convertedPeer, mid);
      await callback(convertedPeer, message);
    });
  }

  /**
   * Subscribes for interactive events.
   */
  onInteractiveEvent(callback: (event: InteractiveEvent) => Promise<void>) {
    this.onAsync('UpdateInteractiveMediaEvent', async ({ mid, id, value, uid }) => {
      const messenger = await this.ready;
      const ref = await messenger.getMessageRef(mid);

      await callback({ mid, id, value, uid, ref });
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
    messenger.editInteractiveMessage(peer, rid, text, actions);
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
   * @param attach message attachment (reply/forward)
   *
   * @returns Message rid.
   */
  async sendFileMessage(peer: Peer, fileName: string, attach?: OutAttach | null): Promise<string> {
    const messenger = await this.ready;
    const file = await (File as any).create(fileName);
    return messenger.sendFile(peer, file, attach);
  }

  /**
   * Optimistically sends image message.
   *
   * @param peer target peer
   * @param fileName path to file in filesystem
   * @param attach message attachment (reply/forward)
   *
   * @returns Message rid.
   */
  async sendImageMessage(peer: Peer, fileName: string, attach?: OutAttach | null): Promise<string> {
    const messenger = await this.ready;
    const file = await (File as any).create(fileName);
    const image = await Jimp.read(fileName)
    const { width, height } = image.bitmap;

    const preview = image
      .resize(Jimp.AUTO, 100)
      .quality(5);

    const base64 = await new Promise((resolve, reject) => {
      (preview as any).getBase64('image/jpeg', (error, base64) => {
        if (error) {
          reject(error);
        } else {
          resolve(base64);
        }
      });
    });

    const thumb = {
      base64,
      width: preview.bitmap.width,
      height: preview.bitmap.height
    };

    return messenger.sendPhotoWithPreview(peer, file, width, height, thumb, attach);
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
