/**
 * Просить браузер не очищати сховище застосунку автоматично.
 * Браузер може відмовити — нічого в застосунку на цьому не базується, для надійності є резервна копія.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return;
    if (await navigator.storage.persisted()) return;
    await navigator.storage.persist();
  } catch {
    // ігноруємо
  }
}
