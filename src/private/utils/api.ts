/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

import { Peer } from '../../types/index';

export function convertPeer(peer: any): Peer {
  switch (peer.type) {
    case 'group':
      return { type: 'group', id: peer.id };
    default:
      return { type: 'user', id: peer.id };
  }
}
