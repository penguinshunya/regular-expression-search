import * as storage from "../storage";

const KEY = "7be745ed-4b58-4f16-8f6d-da8bab094666";

export async function save(text: string) {
  if (text === "") return;
  const texts = await storage.get<string[]>(KEY, []);

  if (texts[texts.length - 1] !== text) {
    texts.push(text);
    while (texts.length > 1000) {
      texts.shift();
    }
    await storage.set(KEY, texts);
  }
}

export async function get() {
  return storage.get<string[]>(KEY, []);
}
