// Repertoire = a graph of positions connected by moves.
//
// Nodes are keyed by position (first 4 FEN fields: pieces, side to move,
// castling, en passant), NOT by move list. That way different move orders
// that reach the same position (transpositions) merge into a single node.

export function positionKey(fen) {
  return fen.split(" ").slice(0, 4).join(" ");
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class Repertoire {
  constructor({ color = "w", name = "Repertoire", id = newId() } = {}) {
    this.id = id;
    this.color = color; // the side the repertoire is played for: "w" | "b"
    this.name = name;
    this.nodes = new Map(); // key -> { key, fen, edges: Map(san -> edge) }
  }

  // edge = { san, uci, to (node key), comment }
  ensureNode(fen) {
    const key = positionKey(fen);
    let node = this.nodes.get(key);
    if (!node) {
      node = { key, fen, edges: new Map() };
      this.nodes.set(key, node);
    }
    return node;
  }

  getNode(fen) {
    return this.nodes.get(positionKey(fen)) ?? null;
  }

  // Adds the move if it is not there yet. Edge order = insertion order, so the
  // first move imported for a position stays the "main line".
  addMove(fenBefore, san, uci, fenAfter) {
    const from = this.ensureNode(fenBefore);
    const to = this.ensureNode(fenAfter);

    let edge = from.edges.get(san);
    let isNew = false;
    if (!edge) {
      edge = { san, uci, to: to.key, comment: "" };
      from.edges.set(san, edge);
      isNew = true;
    }
    return { edge, isNew };
  }

  stats() {
    let moves = 0;
    for (const node of this.nodes.values()) moves += node.edges.size;
    return { positions: this.nodes.size, moves };
  }

  toJSON() {
    return {
      version: 1,
      id: this.id,
      color: this.color,
      name: this.name,
      nodes: [...this.nodes.values()].map((node) => ({
        fen: node.fen,
        edges: [...node.edges.values()],
      })),
    };
  }

  static fromJSON(data) {
    if (!data || data.version !== 1)
      throw new Error("Unknown repertoire format");
    const rep = new Repertoire({
      color: data.color,
      name: data.name,
      id: data.id,
    });
    for (const n of data.nodes) {
      const node = rep.ensureNode(n.fen);
      for (const e of n.edges) {
        node.edges.set(e.san, {
          san: e.san,
          uci: e.uci,
          to: e.to,
          comment: e.comment ?? "",
        });
      }
    }
    return rep;
  }
}
