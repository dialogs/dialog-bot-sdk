/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

import { MessageMedia } from './message-media';

export { FileReference, FileDescription } from './files';

export {
  MessageMedia,
  MessageMediaImage,
  MessageMediaAudio,
  MessageMediaWebsite,
  MessageMediaInteractive,
  MessageMediaInteractiveButton,
  MessageMediaInteractiveSelectOption,
  MessageMediaInteractiveSelect,
  MessageMediaInteractiveWidget,
  MessageMediaInteractiveConfirm,
  MessageMediaInteractiveStyle,
  MessageMediaInteractiveAction,
  MessageMediaInteractiveActionGroup
} from './message-media';

export type AvatarPlaceholder =
  | 'empty'
  | 'lblue'
  | 'blue'
  | 'purple'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green';

export type PeerType = 'user' | 'group' | 'sip';

export type Peer = {
  id: number,
  type: PeerType,
  key?: string
};

export type PeerInfoType = 'user' | 'group' | 'channel' | 'sip';

export type PeerInfo = {
  peer: Peer,
  type: PeerInfoType,
  title: string,
  userName?: string,
  avatar?: string,
  bigAvatar?: string,
  placeholder: AvatarPlaceholder
};

export type RawData = {
  type: string,
  data: Uint8Array
};

export type MessageContentContact = {
  type: 'contact',
  name: string,
  photo64: string,
  phones: string[],
  emails: string[]
};

export type MessageContentLocation = {
  type: 'location',
  place?: string,
  street?: string,
  latitude: number,
  longitude: number
};

type Document = {
  preview?: string,
  fileUrl?: string,
  fileName?: string,
  fileSize?: string,
  fileExtension?: string,
  isUploading: boolean
};

export type MessageContentDocument = Document & {
  type: 'document'
};

export type MessageContentPhoto = {
  type: 'photo',
  width: number,
  height: number,
  preview?: string,
  fileUrl?: string,
  fileName?: string,
  fileSize?: string,
  fileExtension?: string,
  isUploading: boolean
};

export type MessageContentService = {
  type: 'service',
  text: string
};

export type MessageContentSticker = {
  type: 'sticker',
  emoji?: string,
  image?: string,
  width: number,
  height: number
};

export type MessageContentVoice = {
  type: 'voice',
  duration: number,
  fileUrl?: string,
  fileName?: string,
  fileSize?: string,
  fileExtension?: string,
  isUploading: boolean
};

export type MessageContentVideo = {
  type: 'video',
  width: number,
  height: number,
  preview?: string,
  duration: number,
  fileUrl?: string,
  fileName?: string,
  fileSize?: string,
  fileExtension?: string,
  isUploading: boolean
};

export type MessageContentText = {
  type: 'text',
  text: string,
  media: Array<MessageMedia | null>,
  extensions: RawData[]
};

export type MessageContentUnsupported = {
  type: 'unsupported'
};

export type MessageContent =
  | MessageContentText
  | MessageContentPhoto
  | MessageContentVoice
  | MessageContentVideo
  | MessageContentService
  | MessageContentContact
  | MessageContentSticker
  | MessageContentDocument
  | MessageContentLocation
  | MessageContentUnsupported;

export type MessageReaction = {
  code: string,
  count: number,
  uids: number[],
  isOwnSet: boolean
};

export type MessageState =
  | 'pending'
  | 'sent'
  | 'received'
  | 'read'
  | 'error'
  | 'unknown';

export type MessageAttachmentReply = {
  type: 'reply',
  messages: Message[]
};

export type MessageAttachmentForward = {
  type: 'forward',
  from?: PeerInfo,
  messages: Message[]
};

export type MessageAttachment =
  | MessageAttachmentReply
  | MessageAttachmentForward;

export type Message = {
  /** client message id */
  rid: string,
  /** server message id */
  mid: string,
  date: string,
  fullDate: Date,
  sender?: PeerInfo,
  content: MessageContent,
  reactions: MessageReaction[],
  attachment?: MessageAttachment,
  state: MessageState,
  sortKey: string,
  sortDate: number,
  isOut: boolean,
  isOnServer: boolean,
  isEdited?: boolean
};

export type Phone = {
  title: string,
  number: string
};

export type Email = {
  title: string,
  email: string
};

export type User = {
  id: number,
  name: string,
  nick?: string,
  about?: string,
  sex: string,
  timeZone?: string,
  phones: Phone[],
  emails: Email[],
  avatar?: string,
  bigAvatar?: string,
  placeholder: AvatarPlaceholder,
  isContact: boolean,
  isBot: boolean,
  isOnline: boolean,
  isBlocked: boolean
};

export type GroupMember = {
  peerInfo: PeerInfo,
  permissions: GroupMemberPermission[]
};

export type GroupMemberPermission =
  | 'kick'
  | 'invite'
  | 'update_info'
  | 'send_message'
  | 'edit_message'
  | 'delete_message'
  | 'edit_shortname'
  | 'set_permissions'
  | 'get_integration_token';

export type GroupType = 'group' | 'channel';

export type Group = {
  id: number,
  type: GroupType,
  name: string,
  about?: string,
  avatar?: string,
  bigAvatar?: string,
  placeholder: AvatarPlaceholder,
  adminId: number,
  members: GroupMember[],
  isMember: boolean,
  canSendMessage?: boolean,
  shortname?: string,
  topic?: string
};

export type MessageRef = {
  rid: string,
  peer: Peer
};

export type InteractiveEvent = {
  mid: string,
  uid: number,
  id: string,
  value: string,
  ref: MessageRef
};
