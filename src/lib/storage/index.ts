export async function get<T>(key: string, initialValue: T): Promise<T> {
  return new Promise<T>(resolve => {
    const param: { [s: string]: T } = {};
    param[key] = initialValue;
    chrome.storage.local.get(param, response => {
      resolve(response[key]);
    });
  });
}

export async function set<T>(key: string, value: T): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}
