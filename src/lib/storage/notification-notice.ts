import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

const STORAGE_KEY = STORAGE_KEYS.notificationNotice;

export function readNoticeShown(): boolean {
  return readStorage(STORAGE_KEY) !== undefined;
}

export function writeNoticeShown(): void {
  writeStorage(STORAGE_KEY, "shown");
}

export function forgetNoticeShown(): void {
  removeStorage(STORAGE_KEY);
}
