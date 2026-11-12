// Tüm yerel verinin (ayarlar, puzzle, repertuvar, ilerleme...) yedeği.
// Site kendi origin'inde çalıştığı için localStorage'daki her anahtar bu uygulamaya aittir;
// yalnızca yeniden üretilebilen analiz önbelleği yedeğe dahil edilmez.

const SKIP_KEYS = new Set(["azurite-review-cache"]);
const FORMAT = "azurite-backup";

export function createBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SKIP_KEYS.has(key)) continue;
    const value = localStorage.getItem(key);
    if (typeof value === "string") data[key] = value;
  }
  return {
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup() {
  const backup = createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `azurite-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return Object.keys(backup.data).length;
}

// Dosyayı doğrular ve yazar. Başarılıysa yazılan anahtar sayısını döner, hata varsa fırlatır.
export async function restoreBackup(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error("File is too large.");
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("This is not a valid JSON file.");
  }
  if (!parsed || parsed.format !== FORMAT || typeof parsed.data !== "object") {
    throw new Error("This is not an Azurite backup file.");
  }

  const entries = Object.entries(parsed.data).filter(
    ([key, value]) =>
      typeof key === "string" &&
      typeof value === "string" &&
      !SKIP_KEYS.has(key),
  );
  if (!entries.length) throw new Error("The backup is empty.");

  // Yazmadan önce her değerin geçerli JSON olup olmadığına dair hafif kontrol (düz metin ayarlar serbest)
  for (const [key, value] of entries) {
    if (/^[\[{]/.test(value)) {
      try {
        JSON.parse(value);
      } catch {
        throw new Error(`Backup entry "${key}" is corrupted.`);
      }
    }
  }

  for (const [key, value] of entries) localStorage.setItem(key, value);
  return entries.length;
}
