// A library of saved repertoires (one per PGN import), kept in localStorage.

import { Repertoire } from "./repertoire.js";

const KEY = "azurite.library.v1";
const LEGACY_KEY = "azurite.repertoire.v1"; // earlier single-repertoire version

export class Library {
  constructor(items = [], activeId = null) {
    this.items = items; // Repertoire[]
    this.activeId = items.some((r) => r.id === activeId) ? activeId : (items[0]?.id ?? null);
  }

  get active() {
    return this.items.find((r) => r.id === this.activeId) ?? null;
  }

  add(rep) {
    this.items.push(rep);
    this.activeId = rep.id;
    return rep;
  }

  setActive(id) {
    if (this.items.some((r) => r.id === id)) this.activeId = id;
  }

  remove(id) {
    const index = this.items.findIndex((r) => r.id === id);
    if (index === -1) return;
    this.items.splice(index, 1);
    if (this.activeId === id) {
      this.activeId = this.items[Math.min(index, this.items.length - 1)]?.id ?? null;
    }
  }

  // Returns false when the browser refuses to store it (quota, private mode)
  save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          version: 1,
          activeId: this.activeId,
          items: this.items.map((r) => r.toJSON()),
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const items = [];
        for (const item of data.items ?? []) {
          try {
            items.push(Repertoire.fromJSON(item));
          } catch {
            /* skip a corrupt entry, keep the others */
          }
        }
        return new Library(items, data.activeId);
      }

      // Migrate the old single repertoire, if there is one
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const library = new Library([Repertoire.fromJSON(JSON.parse(legacy))]);
        if (library.save()) localStorage.removeItem(LEGACY_KEY);
        return library;
      }
    } catch {
      /* fall through to an empty library */
    }
    return new Library();
  }
}
