import { Injectable } from '@angular/core';
import { ChatSession } from '../model/chat-session.model';

const DB_NAME = 'ask-buddy';
const STORE_NAME = 'chats';
const DB_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class ChatStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  getAllChats(): Promise<ChatSession[]> {
    return this.withStore('readonly', (store) => {
      const request = store.getAll();
      return this.requestToPromise<ChatSession[]>(request).then((chats) => chats.sort((a, b) => b.updatedAt - a.updatedAt));
    });
  }

  getChat(id: string): Promise<ChatSession | undefined> {
    return this.withStore('readonly', (store) => {
      const request = store.get(id);
      return this.requestToPromise<ChatSession | undefined>(request);
    });
  }

  saveChat(chat: ChatSession): Promise<void> {
    return this.withStore('readwrite', (store) => {
      const request = store.put(chat);
      return this.requestToPromise(request).then(() => undefined);
    });
  }

  deleteChat(id: string): Promise<void> {
    return this.withStore('readwrite', (store) => {
      const request = store.delete(id);
      return this.requestToPromise(request).then(() => undefined);
    });
  }

  private async withStore<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => Promise<T>): Promise<T> {
    const db = await this.openDb();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);

      operation(store).then(resolve).catch(reject);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private openDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
