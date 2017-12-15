/*
 * Copyright 2017 dialog LLC <info@dlg.im>
 */

import patchScope from './private/patch-scope';
import Logger from './private/runtime/Logger';
import AsyncStorage from './private/runtime/AsyncStorage/index';

export type ClientOptions = {
  quiet?: boolean,
  phoneBook?: any,
  endpoints: string[]
};

function createClient({ endpoints, phoneBook, quiet }: ClientOptions): Promise<any> {
  patchScope();
  const createCore = require('@dlghq/dialog-java-core');

  return new Promise((resolve, reject) => {
    try {
      createCore({
        endpoints,
        phoneBook,
        logger: new Logger(quiet),
        asyncStorage: new AsyncStorage((window as any).localStorage),
        customAppName: 'Dialog Test',
        apiAppName: 'Dialog Test App',
        apiAppId: 4,
        apiAppKey: '278f13e07eee8398b189bced0db2cf66703d1746e2b541d85f5b42b1641aae0e'
      }, (core) => {
        resolve(core);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export default createClient;
