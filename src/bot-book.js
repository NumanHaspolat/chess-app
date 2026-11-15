// Stockfish'in seçilebilir açılış kitabı. color = Stockfish'in oynadığı taraf.
// Her varyant, oyuncunun hamleleri uyduğu sürece izlenir; sonra Stockfish kendi düşünür.
// Tüm hamleler yasal oyun olarak doğrulandı. Not: Openings sayfasındaki (JSON) aynı isimli
// açılışların varyantları main.js içinde bu kitaba otomatik eklenir (örn. Scotch Game).

const L = (s) =>
  s
    .replace(/\d+\.(\.\.)?/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const V = (name, moves) => ({ name, moves: L(moves) });

export const BOT_BOOK = [
  {
    id: "italian",
    name: "Italian Game",
    color: "white",
    note: "",
    variations: [
      V(
        "Giuoco Pianissimo",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7",
      ),
      V(
        "Evans Gambit",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d6 8. cxd4 Bb6 9. Nc3 Na5 10. Bg5 f6",
      ),
      V(
        "Two Knights Defense",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 9. Nf3 e4 10. Ne5 Bd6",
      ),
      V(
        "Hungarian Defense",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Be7 4. d4 exd4 5. c3 dxc3 6. Nxc3 Nf6 7. e5 Ng4 8. Bf4 d6",
      ),
      V(
        "Giuoco Piano · Møller Attack",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Bxc3 9. d5 Bf6 10. Re1 Ne7 11. Rxe4 d6 12. Bg5 Bxg5 13. Nxg5 h6 14. Qe2 hxg5 15. Re1 Be6 16. dxe6 f6",
      ),
      V(
        "Giuoco Piano · Greco 7.Bd2",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 c6 13. Ne4 Nb6",
      ),
      V(
        "Pianissimo · Nbd2 setup",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. Nbd2 a6 7. Bb3 Ba7 8. h3 O-O 9. O-O Re8 10. Re1 h6 11. Nf1 Be6 12. Bxe6 Rxe6 13. Ng3 Qd7",
      ),
      V(
        "Fried Liver Attack",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Nb4 9. Qe4 c6 10. a3 Na6 11. d4 Nac7",
      ),
      V(
        "Max Lange Attack",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Bc5 6. e5 d5 7. exf6 dxc4 8. Re1+ Be6 9. Ng5 Qd5 10. Nc3 Qf5 11. Nce4 O-O-O 12. Nxe6 fxe6",
      ),
      V(
        "Evans Gambit · 7...d6 8.Qb3",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6 7. Qb3 Qd7 8. dxe5 Bb6 9. Bg5 Nge7 10. Nbd2 O-O 11. O-O h6",
      ),
    ],
  },
  {
    id: "ruy-lopez",
    name: "Ruy Lopez",
    color: "white",
    note: "",
    variations: [
      V(
        "Closed · Breyer",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7",
      ),
      V(
        "Berlin Defense",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8",
      ),
      V(
        "Exchange Variation",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 5. O-O f6 6. d4 exd4 7. Nxd4 c5 8. Nb3 Qxd1 9. Rxd1 Bg4",
      ),
      V(
        "Open Variation",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7 10. Nbd2 O-O",
      ),
      V(
        "Steinitz Defense",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 d6 4. d4 Bd7 5. Nc3 Nf6 6. O-O Be7 7. Re1 exd4 8. Nxd4 O-O",
      ),
      V(
        "Marshall Attack",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d3 Bd6 13. Re1 Qh4 14. g3 Qh3 15. Re4 Bf5",
      ),
      V(
        "Anti-Marshall 8.h3",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. h3 Bb7 9. d3 d6 10. a3 Na5 11. Ba2 c5 12. Nbd2 Nc6 13. Nf1 Qd7",
      ),
      V(
        "Chigorin",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7",
      ),
      V(
        "Zaitsev",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. a4 h6 13. Bc2 exd4 14. cxd4 Nb4 15. Bb1 c5 16. d5 Nd7 17. Ra3 f5",
      ),
      V(
        "Smyslov",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 h6 10. d4 Re8 11. Nbd2 Bf8 12. Nf1 Bd7 13. Ng3 Na5 14. Bc2 c5",
      ),
      V(
        "Archangel",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O b5 6. Bb3 Bc5 7. a4 Rb8 8. c3 d6 9. d4 Bb6 10. axb5 axb5 11. h3 O-O",
      ),
      V(
        "Schliemann",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 f5 4. Nc3 fxe4 5. Nxe4 d5 6. Nxe5 dxe4 7. Nxc6 Qg5 8. Qe2 Nf6",
      ),
    ],
  },
  {
    id: "scotch",
    name: "Scotch Game",
    color: "white",
    note: "",
    variations: [
      V(
        "Classical",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4 O-O 8. O-O Bb6",
      ),
      V(
        "Mieses",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nxc6 bxc6 6. e5 Qe7 7. Qe2 Nd5 8. c4 Ba6",
      ),
      V(
        "Scotch Gambit",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Bc4 Bc5 5. c3 Nf6 6. e5 d5 7. Bb5 Ne4 8. cxd4 Bb6 9. Nc3 O-O",
      ),
      V(
        "Schmidt",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 cxd5 9. O-O O-O 10. Bg5 c6",
      ),
      V(
        "Classical · 5.Nb3",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Nb3 Bb6 6. Nc3 d6 7. Qe2 Nf6 8. Bg5 Be6 9. O-O-O Qd7",
      ),
      V(
        "Göring Gambit",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. c3 dxc3 5. Nxc3 Bb4 6. Bc4 d6 7. O-O Bxc3 8. bxc3 Nf6 9. Ba3 Be6 10. Bxe6 fxe6 11. Qb3 Qd7",
      ),
      V(
        "Scotch Four Knights",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 cxd5 9. O-O O-O 10. Bg5 c6 11. Qf3 Be7 12. Rae1 Be6",
      ),
      V(
        "Classical · 5.Be3 Qg6",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4 Ne5",
      ),
    ],
  },
  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    color: "white",
    note: "",
    variations: [
      V(
        "Declined · Orthodox",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. Bd3 Bb7",
      ),
      V(
        "Accepted",
        "1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5 8. Bb3 Nc6",
      ),
      V(
        "Slav Defense",
        "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O Nbd7",
      ),
      V(
        "Semi-Slav · Meran",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 a6 9. e4 c5",
      ),
      V(
        "Declined · Exchange · Carlsbad",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 c6 6. e3 Be7 7. Bd3 Nbd7 8. Qc2 O-O 9. Nf3 Re8 10. O-O Nf8 11. Rab1 a5 12. a3 Ne4 13. Bxe7 Qxe7 14. b4 axb4 15. axb4 Bf5",
      ),
      V(
        "Declined · Tartakower",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8",
      ),
      V(
        "Vienna / Ragozin",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Bb4 5. Bg5 dxc4 6. e4 c5 7. Bxc4 cxd4 8. Nxd4 Bxc3+ 9. bxc3 Qa5 10. Bxf6 gxf6 11. O-O Nc6 12. Nxc6 bxc6",
      ),
      V(
        "Slav · Chebanenko 4...a6",
        "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 a6 5. e3 b5 6. c5 Bf5 7. Nh4 e6 8. Nxf5 exf5 9. Bd3 Be7 10. O-O O-O",
      ),
      V(
        "Semi-Slav · Botvinnik",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5 Nbd7 11. exf6 Bb7 12. g3 c5 13. d5 Qb6 14. Bg2 O-O-O 15. O-O b4 16. Ne4 Qb5",
      ),
      V(
        "Albin Countergambit",
        "1. d4 d5 2. c4 e5 3. dxe5 d4 4. Nf3 Nc6 5. g3 Be6 6. Nbd2 Qd7 7. Bg2 O-O-O 8. O-O Nge7 9. Nb3 Ng6",
      ),
      V(
        "vs Budapest Gambit",
        "1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4 Nc6 5. Nf3 Bb4+ 6. Nbd2 Qe7 7. a3 Ngxe5 8. axb4 Nxf3+ 9. Nxf3 Qxb4+ 10. Qd2 Qxb2",
      ),
    ],
  },
  {
    id: "london",
    name: "London System",
    color: "white",
    note: "",
    variations: [
      V(
        "vs ...d5 · Classical",
        "1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. Nf3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3 b6",
      ),
      V(
        "vs King's Indian",
        "1. d4 Nf6 2. Bf4 g6 3. Nf3 Bg7 4. e3 O-O 5. Be2 d6 6. h3 Nbd7 7. O-O c5",
      ),
      V(
        "vs ...c5",
        "1. d4 Nf6 2. Bf4 c5 3. e3 Nc6 4. c3 d5 5. Nd2 e6 6. Ngf3 Bd6 7. Bg3 O-O 8. Bd3 b6",
      ),
      V(
        "vs ...Bf5",
        "1. d4 d5 2. Nf3 Nf6 3. Bf4 c5 4. e3 Nc6 5. Nbd2 cxd4 6. exd4 Bf5 7. c3 e6 8. Qb3 Qb6",
      ),
      V(
        "vs ...Bf5 · Nh4",
        "1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2 Bf5 6. Ngf3 e6 7. Nh4 Be4 8. f3 Bg6 9. Nxg6 hxg6 10. Bd3 Bd6 11. Bg3 O-O",
      ),
      V(
        "Jobava / 2.Nc3",
        "1. d4 d5 2. Nc3 Nf6 3. Bf4 e6 4. e3 Bd6 5. Bg3 O-O 6. Bd3 c5 7. Nf3 Nc6 8. O-O b6 9. Ne5 Bb7",
      ),
      V(
        "vs ...c5 · Qb6",
        "1. d4 d5 2. Bf4 c5 3. e3 Nc6 4. c3 Qb6 5. Qb3 c4 6. Qxb6 axb6 7. Nd2 Nf6 8. Ngf3 Bf5 9. Be2 e6 10. O-O Bd6",
      ),
      V(
        "vs ...g6",
        "1. d4 Nf6 2. Bf4 g6 3. Nf3 Bg7 4. e3 d6 5. h3 O-O 6. Be2 Nbd7 7. O-O c5 8. c3 b6 9. Nbd2 Bb7 10. Qb3 Qc7",
      ),
    ],
  },
  {
    id: "english",
    name: "English Opening",
    color: "white",
    note: "",
    variations: [
      V(
        "Symmetrical",
        "1. c4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. Nf3 e6 6. O-O Nge7 7. d4 cxd4 8. Nxd4 O-O",
      ),
      V(
        "Reversed Sicilian",
        "1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 d5 5. cxd5 Nxd5 6. Bg2 Nb6 7. O-O Be7 8. a3 O-O",
      ),
      V(
        "Anglo-Indian",
        "1. c4 Nf6 2. Nc3 e6 3. Nf3 d5 4. d4 Be7 5. Bg5 h6 6. Bh4 O-O 7. e3 b6 8. Be2 Bb7",
      ),
      V(
        "Four Knights / Botvinnik",
        "1. c4 e5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. e4 d6 6. Nge2 Be6 7. d3 Qd7 8. O-O Nge7",
      ),
      V(
        "Symmetrical · Hedgehog",
        "1. c4 c5 2. Nf3 Nf6 3. Nc3 e6 4. g3 b6 5. Bg2 Bb7 6. O-O Be7 7. d4 cxd4 8. Qxd4 d6 9. Rd1 a6 10. b3 Nbd7 11. Bb2 Qc7",
      ),
      V(
        "Four Knights · 4.e3 Bb4",
        "1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. e3 Bb4 5. Qc2 Bxc3 6. Qxc3 Qe7 7. Be2 d6 8. O-O O-O 9. b3 a5 10. Bb2 Bf5",
      ),
      V(
        "Four Knights · 4.g3 Bb4",
        "1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. g3 Bb4 5. Bg2 O-O 6. O-O e4 7. Ng5 Bxc3 8. dxc3 h6 9. Nh3 d6 10. f3 exf3 11. Bxf3 Ne5 12. Bg2 Bg4",
      ),
      V(
        "Anglo-Indian · 3.e4",
        "1. c4 Nf6 2. Nc3 e6 3. e4 d5 4. e5 d4 5. exf6 dxc3 6. bxc3 Qxf6 7. d4 c5 8. Nf3 Nc6 9. Be3 b6",
      ),
      V(
        "vs ...g6 · Fianchetto",
        "1. c4 g6 2. Nc3 Bg7 3. g3 c5 4. Bg2 Nc6 5. Nf3 e6 6. O-O Nge7 7. d3 O-O 8. a3 d5 9. cxd5 exd5 10. Bg5 f6",
      ),
    ],
  },
  {
    id: "vienna",
    name: "Vienna Game",
    color: "white",
    note: "",
    variations: [
      V(
        "Vienna Gambit",
        "1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Nf3 Be7 6. d4 O-O 7. Bd3 f5 8. exf6 Bxf6",
      ),
      V(
        "Frankenstein-Dracula",
        "1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4 4. Qh5 Nd6 5. Bb3 Be7 6. Nf3 Nc6 7. Nxe5 O-O",
      ),
      V(
        "Fianchetto",
        "1. e4 e5 2. Nc3 Nc6 3. g3 Nf6 4. Bg2 Bc5 5. Nge2 d6 6. O-O O-O",
      ),
      V(
        "Vienna · Hamppe-Allgaier style",
        "1. e4 e5 2. Nc3 Nc6 3. f4 exf4 4. Nf3 g5 5. h4 g4 6. Ng5 h6 7. Nxf7 Kxf7 8. d4 d6 9. Bc4+ Ke8 10. O-O Be7",
      ),
      V(
        "Vienna · 3.Bc4 Nxe4 4.Qh5",
        "1. e4 e5 2. Nc3 Nf6 3. Bc4 Nxe4 4. Qh5 Nd6 5. Bb3 Nc6 6. Nb5 g6 7. Qf3 f5 8. Qd5 Qe7 9. Nxc7+ Kd8 10. Nxa8 b6",
      ),
      V(
        "Vienna · 3.f4 d5 4.fxe5 Nxe4",
        "1. e4 e5 2. Nc3 Nf6 3. f4 d5 4. fxe5 Nxe4 5. Nf3 Be7 6. d4 O-O 7. Bd3 f5 8. exf6 Bxf6 9. O-O Nxc3 10. bxc3 Nc6",
      ),
    ],
  },
  {
    id: "kings-gambit",
    name: "King's Gambit",
    color: "white",
    note: "",
    variations: [
      V(
        "Accepted · Kieseritzky",
        "1. e4 e5 2. f4 exf4 3. Nf3 g5 4. h4 g4 5. Ne5 Nf6 6. Bc4 d5 7. exd5 Bd6 8. d4 Nh5 9. O-O Qe7",
      ),
      V(
        "Bishop's Gambit",
        "1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 Bc5 5. Nf3 Qh6 6. d4 Bb6 7. Nc3 Nc6",
      ),
      V(
        "Falkbeer Countergambit",
        "1. e4 e5 2. f4 d5 3. exd5 e4 4. d3 Nf6 5. dxe4 Nxe4 6. Nf3 Bc5 7. Qe2 Qe7",
      ),
      V(
        "Declined",
        "1. e4 e5 2. f4 Bc5 3. Nf3 d6 4. c3 Nf6 5. b4 Bb6 6. Bc4 O-O",
      ),
      V(
        "Accepted · Cunningham",
        "1. e4 e5 2. f4 exf4 3. Nf3 Be7 4. Bc4 Nf6 5. e5 Ng4 6. O-O Nxe5 7. Nxe5 d6 8. Nf3 O-O 9. d4 Bg4",
      ),
      V(
        "Accepted · Modern 3...d5",
        "1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Nf6 5. Bb5+ c6 6. dxc6 Nxc6 7. d4 Bd6 8. O-O O-O 9. Nc3 Bg4 10. h3 Bh5",
      ),
      V(
        "Accepted · Fischer 3...d6",
        "1. e4 e5 2. f4 exf4 3. Nf3 d6 4. d4 g5 5. h4 g4 6. Ng1 Nf6 7. Nc3 Nc6 8. Bd3 Be7",
      ),
      V(
        "Falkbeer · 4.Nc3",
        "1. e4 e5 2. f4 d5 3. exd5 e4 4. Nc3 Nf6 5. Qe2 Qe7",
      ),
    ],
  },
  {
    id: "reti",
    name: "Réti Opening",
    color: "white",
    note: "",
    variations: [
      V(
        "Main Line",
        "1. Nf3 d5 2. c4 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. Bb2 Nc6 8. e3 b6",
      ),
      V(
        "Advance Variation",
        "1. Nf3 d5 2. c4 d4 3. e3 Nc6 4. exd4 Nxd4 5. Nxd4 Qxd4 6. Nc3 e5 7. d3",
      ),
      V(
        "King's Indian Attack",
        "1. Nf3 Nf6 2. g3 g6 3. Bg2 Bg7 4. O-O O-O 5. d3 d6 6. e4 e5 7. Nc3 Nc6",
      ),
      V(
        "vs ...c5",
        "1. Nf3 c5 2. c4 Nc6 3. Nc3 e5 4. g3 g6 5. Bg2 Bg7 6. O-O Nge7 7. d3 O-O",
      ),
      V(
        "Slav Setup · 3.b3",
        "1. Nf3 d5 2. c4 c6 3. b3 Nf6 4. g3 Bf5 5. Bg2 e6 6. Bb2 Nbd7 7. O-O Bd6 8. d3 O-O 9. Nbd2 Qe7",
      ),
      V(
        "vs ...c5 · KIA",
        "1. Nf3 d5 2. g3 c5 3. Bg2 Nc6 4. O-O e5 5. d3 Nf6 6. Nbd2 Be7 7. e4 O-O 8. c3 d4 9. Nc4 Qc7",
      ),
      V(
        "vs ...Nf6 · Queen's Indian setup",
        "1. Nf3 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. O-O O-O 6. b3 b6 7. Bb2 Bb7 8. e3 Nbd7 9. Nc3 c5 10. cxd5 exd5",
      ),
    ],
  },
  {
    id: "catalan",
    name: "Catalan Opening",
    color: "white",
    note: "",
    variations: [
      V(
        "Open Catalan",
        "1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Nf3 Be7 6. O-O O-O 7. Qc2 a6 8. a4 Bd7",
      ),
      V(
        "Closed Catalan",
        "1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O c6 7. Qc2 Nbd7 8. Nbd2 b6 9. e4 Bb7",
      ),
      V(
        "vs ...Bb4+",
        "1. d4 Nf6 2. c4 e6 3. g3 Bb4+ 4. Bd2 Be7 5. Bg2 d5 6. Nf3 O-O 7. O-O c6 8. Qc2 b6",
      ),
      V(
        "Open Catalan · 5...c5",
        "1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 dxc4 5. Nf3 c5 6. O-O Nc6 7. Qa4 Bd7 8. Qxc4 Rc8 9. dxc5 Bxc5 10. Qd3 O-O",
      ),
      V(
        "Closed Catalan · 6...dxc4",
        "1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O dxc4 7. Qc2 a6 8. a4 Bd7 9. Qxc4 Bc6 10. Bg5 Bd5",
      ),
    ],
  },
  {
    id: "sicilian",
    name: "Sicilian Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Najdorf · English Attack",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. f3 Be7 9. Qd2 O-O 10. O-O-O Nbd7",
      ),
      V(
        "Najdorf · 6.Bg5",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7 9. O-O-O Nbd7",
      ),
      V(
        "Dragon · Yugoslav",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. O-O-O Rc8",
      ),
      V(
        "Sveshnikov",
        "1. e4 c5 2. Nf3 Nc6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e5 6. Ndb5 d6 7. Bg5 a6 8. Na3 b5 9. Nd5 Be7 10. Bxf6 Bxf6",
      ),
      V(
        "Scheveningen",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be2 Be7 7. O-O O-O 8. f4 Nc6 9. Be3 a6 10. Kh1 Qc7",
      ),
      V(
        "Taimanov",
        "1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Qc7 6. Be3 a6 7. Qd2 Nf6 8. O-O-O Bb4 9. f3 Ne5 10. Nb3 b5",
      ),
      V(
        "Alapin",
        "1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. d4 cxd4 5. Nf3 Nc6 6. cxd4 d6 7. Bc4 Nb6 8. Bb5 dxe5 9. Nxe5 Bd7",
      ),
      V(
        "Najdorf · Opocensky 6.Be2",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be2 e5 7. Nb3 Be7 8. O-O O-O 9. Be3 Be6 10. f4 exf4 11. Bxf4 Nc6 12. Kh1 Qc7",
      ),
      V(
        "Najdorf · Poisoned Pawn",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bg5 e6 7. f4 Qb6 8. Qd2 Qxb2 9. Rb1 Qa3 10. Bxf6 gxf6 11. Be2 h5 12. O-O Nc6 13. Nxc6 bxc6",
      ),
      V(
        "Najdorf · 6.Bc4",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Bc4 e6 7. Bb3 b5 8. O-O Be7 9. Qf3 Qc7 10. Qg3 O-O 11. Bh6 Ne8",
      ),
      V(
        "Najdorf · 6.Be3 Ng4",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 Ng4 7. Bg5 h6 8. Bh4 g5 9. Bg3 Bg7 10. h3",
      ),
      V(
        "Dragon · Classical",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be2 Bg7 7. O-O Nc6 8. Nb3 Be6 9. f4 O-O 10. Kh1 Na5 11. f5 Bc4 12. Bxc4 Nxc4",
      ),
      V(
        "Dragon · Yugoslav 9.Bc4 Rc8",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. Bc4 Bd7 10. O-O-O Rc8 11. Bb3 Ne5 12. h4 h5 13. Bg5 Rc5 14. Kb1 Re8 15. Bh6 Bh8",
      ),
      V(
        "Richter-Rauzer",
        "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6 6. Bg5 e6 7. Qd2 a6 8. O-O-O Bd7 9. f4 b5 10. Bxf6 gxf6 11. Nxc6 Bxc6",
      ),
      V(
        "Kan",
        "1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Bd3 Nf6 6. O-O Qc7 7. Qe2 d6 8. c4 g6 9. Nc3 Bg7 10. Be3 Nbd7",
      ),
      V(
        "Four Knights Sicilian",
        "1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 Nc6 5. Nc3 Nf6 6. Ndb5 Bb4 7. a3 Bxc3+ 8. Nxc3 d5 9. exd5 exd5 10. Bd3 d4 11. Ne2 Bg4 12. f3 Be6",
      ),
      V(
        "Rossolimo",
        "1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. Bxc6 dxc6 5. d3 Bg7 6. h3 Nf6 7. Nc3 Qc7 8. Be3 b6 9. Qd2 e5 10. O-O-O Bb7",
      ),
      V(
        "Moscow 3.Bb5+",
        "1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. c4 Nc6 6. Nc3 Nf6 7. O-O g6 8. d4 cxd4 9. Nxd4 Bg7 10. Nde2 O-O",
      ),
      V(
        "vs Smith-Morra",
        "1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 d6 6. Bc4 e6 7. O-O Nf6 8. Qe2 Be7 9. Rd1 e5 10. Bg5 Bg4",
      ),
      V(
        "vs Closed Sicilian",
        "1. e4 c5 2. Nc3 Nc6 3. g3 g6 4. Bg2 Bg7 5. d3 d6 6. Be3 e6 7. Qd2 Nd4 8. Nce2 Ne7 9. c3 Nxe2 10. Nxe2 O-O",
      ),
    ],
  },
  {
    id: "french",
    name: "French Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Winawer",
        "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Qxg7 Rg8 9. Qxh7 cxd4",
      ),
      V(
        "Classical",
        "1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7 5. e5 Nfd7 6. Bxe7 Qxe7 7. f4 O-O 8. Nf3 c5 9. Qd2 Nc6 10. O-O-O a6",
      ),
      V(
        "Advance",
        "1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 c4 7. Nbd2 Na5 8. Be2 Bd7 9. O-O Ne7",
      ),
      V(
        "Tarrasch",
        "1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6 7. Ne2 cxd4 8. cxd4 f6 9. exf6 Nxf6 10. O-O Bd6",
      ),
      V(
        "Exchange",
        "1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3 Nf6 5. Bd3 Bd6 6. O-O O-O 7. Bg5 Bg4 8. Nbd2 Nbd7",
      ),
      V(
        "Winawer · Poisoned Pawn",
        "1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Qg4 Qc7 8. Qxg7 Rg8 9. Qxh7 cxd4 10. Ne2 Nbc6 11. f4 Bd7 12. Qd3 dxc3 13. Qxc3 O-O-O",
      ),
      V(
        "Advance · 6.Be2 Nge7",
        "1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Bd7 6. Be2 Nge7 7. O-O Nf5 8. Na3 cxd4 9. cxd4 Nb4",
      ),
      V(
        "Tarrasch · Open 3...c5",
        "1. e4 e6 2. d4 d5 3. Nd2 c5 4. exd5 exd5 5. Ngf3 Nc6 6. Bb5 Bd6 7. dxc5 Bxc5 8. O-O Nge7 9. Nb3 Bd6 10. Nbd4 O-O",
      ),
      V(
        "Classical · Steinitz",
        "1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. e5 Nfd7 5. f4 c5 6. Nf3 Nc6 7. Be3 cxd4 8. Nxd4 Bc5 9. Qd2 O-O 10. O-O-O a6",
      ),
      V(
        "Burn Variation",
        "1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 dxe4 5. Nxe4 Nbd7 6. Nf3 Be7 7. Nxf6+ Nxf6 8. Bd3 c5 9. Ne5 cxd4",
      ),
      V(
        "Exchange · 4.Nf3 Bd6",
        "1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3 Bd6 5. c4 dxc4 6. Bxc4 Nf6 7. Nc3 O-O 8. O-O Bg4 9. Bg5 Nc6",
      ),
      V(
        "vs King's Indian Attack",
        "1. e4 e6 2. d3 d5 3. Nd2 Nf6 4. Ngf3 c5 5. g3 Nc6 6. Bg2 Be7 7. O-O O-O 8. Re1 b5 9. e5 Nd7 10. Nf1 b4",
      ),
    ],
  },
  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Classical",
        "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6",
      ),
      V(
        "Advance",
        "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. Be3 cxd4 7. Nxd4 Ne7",
      ),
      V(
        "Exchange",
        "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Bd3 Nc6 5. c3 Nf6 6. Bf4 Bg4 7. Qb3 Qd7 8. Nd2 e6",
      ),
      V(
        "Panov Attack",
        "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 e6 6. Nf3 Be7 7. cxd5 Nxd5 8. Bd3 Nc6 9. O-O O-O",
      ),
      V(
        "Two Knights",
        "1. e4 c6 2. Nf3 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Ne5 Bh7 8. Bc4 e6",
      ),
      V(
        "Advance · Short 5.Be2",
        "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 Nd7 6. O-O Ne7 7. Nbd2 h6 8. Nb3 Qc7",
      ),
      V(
        "Classical · 7.Bc4 / Ne5",
        "1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. Nf3 Nd7 7. h4 h6 8. Ne5 Bh7 9. Bc4 e6 10. Qe2 Ngf6",
      ),
      V(
        "Panov · 5.Nc3 g6",
        "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 g6 6. Qb3 Bg7 7. cxd5 O-O 8. Be2 Nxd5",
      ),
      V(
        "Gurgenidze",
        "1. e4 c6 2. d4 d5 3. Nc3 g6 4. h3 Bg7 5. Nf3 Nf6 6. Bd3 dxe4 7. Nxe4 Nxe4 8. Bxe4 Nd7 9. O-O Nf6 10. Bd3 O-O",
      ),
      V(
        "vs 3.Nd2",
        "1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nd7 5. Ng5 Ngf6 6. Bd3 e6 7. N1f3 Bd6 8. Qe2 h6 9. Ne4 Nxe4 10. Qxe4 Qc7",
      ),
    ],
  },
  {
    id: "qgd-slav",
    name: "Queen's Gambit Declined / Slav",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Orthodox QGD",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5",
      ),
      V(
        "Slav Defense",
        "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. Nc3 dxc4 5. a4 Bf5 6. e3 e6 7. Bxc4 Bb4 8. O-O Nbd7",
      ),
      V(
        "Semi-Slav · Meran",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c6 5. e3 Nbd7 6. Bd3 dxc4 7. Bxc4 b5 8. Bd3 Bb7 9. O-O a6",
      ),
      V(
        "Queen's Gambit Accepted",
        "1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3 e6 5. Bxc4 c5 6. O-O a6 7. Qe2 b5",
      ),
      V(
        "Tarrasch Defense",
        "1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 Nf6 7. Bg2 Be7 8. O-O O-O 9. Bg5 cxd4 10. Nxd4 h6",
      ),
      V(
        "QGD · Lasker",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3 exd5 11. Qb3 Rd8 12. Bd3 Nc6 13. O-O Na5 14. Qc2 c5",
      ),
      V(
        "QGD · Exchange Carlsbad",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Be7 6. e3 c6 7. Bd3 Nbd7 8. Qc2 O-O 9. Nge2 Re8 10. O-O Nf8 11. f3 Ng6",
      ),
      V(
        "Ragozin",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 Bb4 5. Bg5 h6 6. Bh4 dxc4 7. e4 g5 8. Bg3 b5 9. Be2 Bb7 10. O-O Nbd7",
      ),
      V(
        "Slav · Exchange",
        "1. d4 d5 2. c4 c6 3. cxd5 cxd5 4. Nc3 Nf6 5. Bf4 Nc6 6. e3 Bf5 7. Nf3 e6 8. Qb3 Bb4 9. Bb5 O-O",
      ),
      V(
        "Slav · 4.e3 Bf5",
        "1. d4 d5 2. c4 c6 3. Nf3 Nf6 4. e3 Bf5 5. Nc3 e6 6. Nh4 Bg6 7. Nxg6 hxg6 8. Bd3 Bb4 9. O-O Nbd7",
      ),
      V(
        "Semi-Slav · Botvinnik",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c6 5. Bg5 dxc4 6. e4 b5 7. e5 h6 8. Bh4 g5 9. Nxg5 hxg5 10. Bxg5 Nbd7 11. exf6 Bb7 12. g3 c5 13. d5 Qb6 14. Bg2 O-O-O 15. O-O b4 16. Ne4 Qb5",
      ),
      V(
        "Semi-Slav · Moscow",
        "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Nf3 c6 5. Bg5 h6 6. Bh4 dxc4 7. e4 g5 8. Bg3 b5 9. Be2 Bb7 10. O-O Nbd7 11. Nd2 Bg7",
      ),
      V(
        "QGA · Classical",
        "1. d4 d5 2. c4 dxc4 3. e3 Nf6 4. Bxc4 e6 5. Nf3 c5 6. O-O a6 7. a4 Nc6 8. Qe2 cxd4 9. Rd1 Be7 10. exd4 O-O 11. Nc3 Nb4",
      ),
      V(
        "Tarrasch · Swedish",
        "1. d4 d5 2. c4 e6 3. Nc3 c5 4. cxd5 exd5 5. Nf3 Nc6 6. g3 c4 7. Bg2 Bb4 8. O-O Nge7 9. Ne5 Bxc3 10. bxc3 O-O 11. Nxc6 Nxc6",
      ),
    ],
  },
  {
    id: "kings-indian",
    name: "King's Indian Defense",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Classical",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Be3 f5",
      ),
      V(
        "Sämisch",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f3 O-O 6. Be3 Nc6 7. Qd2 a6 8. Nge2 Rb8 9. Nc1 e5 10. d5 Nd4",
      ),
      V(
        "Fianchetto",
        "1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 O-O 5. Nc3 d6 6. Nf3 Nbd7 7. O-O e5 8. e4 c6 9. h3 Qb6",
      ),
      V(
        "Four Pawns Attack",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. f4 O-O 6. Nf3 c5 7. dxc5 Qa5 8. Bd3 Qxc5 9. Qe2 Nc6",
      ),
      V(
        "Makogonov 5.h3",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. h3 O-O 6. Be3 e5 7. d5 Nh5 8. Qd2 Qe8 9. g4 Nf4 10. Bxf4 exf4 11. Qxf4 Nd7 12. Nge2 Ne5",
      ),
      V(
        "Averbakh",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Be2 O-O 6. Bg5 c5 7. d5 e6 8. Qd2 exd5 9. exd5 Re8 10. Nf3 Bg4 11. O-O Nbd7",
      ),
      V(
        "Classical · Bayonet 9.b4",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. b4 Nh5 10. Re1 f5 11. Ng5 Nf6",
      ),
      V(
        "Petrosian 7.d5",
        "1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. d5 a5 8. Bg5 h6 9. Bh4 Na6 10. Nd2 Qe8 11. O-O Nd7 12. a3 Bf6 13. Bxf6 Nxf6",
      ),
    ],
  },
  {
    id: "nimzo-indian",
    name: "Nimzo-Indian Defense",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Rubinstein",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7",
      ),
      V(
        "Classical",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. a3 Bxc3+ 6. Qxc3 b6 7. Bg5 Bb7 8. e3 d6 9. f3 Nbd7 10. Ne2 c5",
      ),
      V(
        "Sämisch",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. a3 Bxc3+ 5. bxc3 c5 6. e3 Nc6 7. Bd3 O-O 8. Ne2 b6 9. e4 Ne8",
      ),
      V(
        "Hübner",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 c5 5. Bd3 Nc6 6. Nf3 Bxc3+ 7. bxc3 d6 8. e4 e5 9. d5 Ne7 10. Nh4 h6 11. f4 Ng6 12. Nxg6 fxg6",
      ),
      V(
        "Leningrad 4.Bg5",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Bg5 c5 5. d5 d6 6. e3 exd5 7. cxd5 h6 8. Bh4 g5 9. Bg3 Nh5 10. Bd3 Nxg3 11. hxg3 Nd7",
      ),
      V(
        "4.f3",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. f3 d5 5. a3 Bxc3+ 6. bxc3 c5 7. cxd5 Nxd5 8. dxc5 f5 9. e4 fxe4 10. fxe4 Nf6 11. Bd3 Qa5 12. Bd2 Qxc5",
      ),
      V(
        "4.Nf3 c5 5.g3",
        "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Nf3 c5 5. g3 cxd4 6. Nxd4 O-O 7. Bg2 d5 8. cxd5 Nxd5 9. Bd2 Nxc3 10. Bxc3 Bxc3+ 11. bxc3 Qc7",
      ),
    ],
  },
  {
    id: "grunfeld",
    name: "Grünfeld Defense",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Exchange",
        "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Nf3 c5 8. Rb1 O-O 9. Be2 cxd4 10. cxd4 Qa5+",
      ),
      V(
        "Exchange · 7.Bc4",
        "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Bg4",
      ),
      V(
        "Russian System",
        "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4 8. Be3 Nfd7 9. Qb3 Nb6 10. Rd1 Nc6",
      ),
      V(
        "Fianchetto 3.g3",
        "1. d4 Nf6 2. c4 g6 3. g3 d5 4. Bg2 Bg7 5. cxd5 Nxd5 6. e4 Nb6 7. Ne2 c5 8. d5 O-O 9. Nbc3 e6 10. O-O exd5",
      ),
      V(
        "4.Bf4",
        "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bf4 Bg7 5. e3 O-O 6. Rc1 c5 7. dxc5 dxc4 8. Bxc4 Qxd1+ 9. Rxd1 Nc6",
      ),
      V(
        "4.Bg5 Ne4",
        "1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Bg5 Ne4 5. Bh4 Nxc3 6. bxc3 dxc4 7. e3 Be6 8. Nf3 Bg7 9. Bxc4 Bxc4",
      ),
    ],
  },
  {
    id: "scandinavian",
    name: "Scandinavian Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Main Line · Qa5",
        "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6",
      ),
      V(
        "Modern · 2...Nf6",
        "1. e4 d5 2. exd5 Nf6 3. d4 Nxd5 4. Nf3 g6 5. Be2 Bg7 6. O-O O-O 7. c4 Nb6 8. Nc3 Nc6",
      ),
      V(
        "Qd6 Variation",
        "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qd6 4. d4 Nf6 5. Nf3 a6",
      ),
      V(
        "Portuguese 3.Bb5+",
        "1. e4 d5 2. exd5 Nf6 3. Bb5+ Bd7 4. Bc4 Bg4 5. f3 Bf5 6. Nc3 Nbd7 7. d4 Nb6 8. Bb3 Nbxd5",
      ),
      V(
        "Modern · 3.Nf3 Bg4",
        "1. e4 d5 2. exd5 Nf6 3. Nf3 Nxd5 4. d4 Bg4 5. Be2 e6 6. O-O Nc6 7. c4 Nb6 8. Be3 Be7",
      ),
      V(
        "Main Line · 3...Qa5 6.Bc4",
        "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 c6 5. Nf3 Nf6 6. Bc4 Bf5 7. Bd2 e6 8. Qe2 Bb4",
      ),
    ],
  },
  {
    id: "pirc",
    name: "Pirc Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Classical",
        "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O c6 7. a4 Nbd7 8. Re1 e5 9. Bf1 Re8",
      ),
      V(
        "Austrian Attack",
        "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f4 Bg7 5. Nf3 O-O 6. Bd3 Na6 7. O-O c5 8. d5 Nc7 9. a4 b6",
      ),
      V(
        "150 Attack",
        "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Bd3 Nbd7 8. Nge2 e5",
      ),
      V(
        "Sämisch-style 4.f3",
        "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. f3 Bg7 5. Be3 O-O 6. Qd2 c6 7. Bh6 Nbd7 8. Bxg7 Kxg7 9. O-O-O b5",
      ),
      V(
        "4.Bg5 c6",
        "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Bg5 Bg7 5. Qd2 c6 6. Nf3 b5 7. Bd3 Nbd7 8. O-O O-O 9. Rfe1 b4",
      ),
      V(
        "Classical · 6.h3",
        "1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Bg4 7. Be3 Nc6 8. Qd2 e5 9. d5 Bxf3",
      ),
    ],
  },
  {
    id: "petroff",
    name: "Petroff Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Main Line",
        "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4 Nb4 9. Be2 O-O 10. Nc3 Bf5",
      ),
      V(
        "3.d4",
        "1. e4 e5 2. Nf3 Nf6 3. d4 Nxe4 4. Bd3 d5 5. Nxe5 Nd7 6. Nxd7 Bxd7 7. O-O Bd6 8. c4 c6 9. Nc3 Nxc3 10. bxc3 O-O",
      ),
      V(
        "Three Knights",
        "1. e4 e5 2. Nf3 Nf6 3. Nc3 Nc6 4. Bb5 Nd4 5. Nxd4 exd4 6. e5 dxc3 7. exf6 Qxf6 8. dxc3 Qe5+",
      ),
      V(
        "5.d3 Main",
        "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d3 Nf6 6. d4 d5 7. Bd3 Be7 8. O-O Nc6 9. Re1 Bg4 10. c3 Qd7",
      ),
      V(
        "5.Nc3 Nxc3",
        "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. Nc3 Nxc3 6. dxc3 Be7 7. Be3 O-O 8. Qd2 Nd7 9. O-O-O Nf6 10. h3 b6",
      ),
      V(
        "Classical · 7.Nc3 Bf5",
        "1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Bd6 7. O-O O-O 8. c4 c6 9. Nc3 Nxc3 10. bxc3 dxc4",
      ),
    ],
  },
  {
    id: "bishops",
    name: "Bishop's Opening",
    color: "white",
    note: "",
    variations: [
      V(
        "Berlin Defense",
        "1. e4 e5 2. Bc4 Nf6 3. d3 c6 4. Nf3 d5 5. Bb3 Bd6 6. Nc3 O-O 7. O-O Nbd7 8. Re1 a6",
      ),
    ],
  },
  {
    id: "ponziani",
    name: "Ponziani Opening",
    color: "white",
    note: "",
    variations: [
      V(
        "Main Line · 3...d5",
        "1. e4 e5 2. Nf3 Nc6 3. c3 d5 4. Qa4 Nf6 5. Nxe5 Bd6 6. Nxc6 bxc6 7. d3 O-O 8. Be2 Qe7",
      ),
      V(
        "3...Nf6",
        "1. e4 e5 2. Nf3 Nc6 3. c3 Nf6 4. d4 Nxe4 5. d5 Ne7 6. Nxe5 Ng6 7. Qd4 Nxe5 8. Qxe5",
      ),
    ],
  },
  {
    id: "four-knights",
    name: "Four Knights Game",
    color: "white",
    note: "",
    variations: [
      V(
        "Spanish · Metger",
        "1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Bb4 5. O-O O-O 6. d3 Bxc3 7. bxc3 d6 8. Bg5 Qe7 9. Re1 Nd8 10. d4 Ne6",
      ),
      V(
        "Scotch Four Knights",
        "1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nxd4 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 cxd5 9. O-O O-O 10. Bg5 c6 11. Qf3 Be7",
      ),
      V(
        "Symmetrical 4.Bb5 Bb4",
        "1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bb5 Nd4 5. Ba4 Bc5 6. Nxe5 O-O 7. Nd3 Bb6 8. e5 Ne8",
      ),
    ],
  },
  {
    id: "danish",
    name: "Danish Gambit",
    color: "white",
    note: "",
    variations: [
      V(
        "Accepted",
        "1. e4 e5 2. d4 exd4 3. c3 dxc3 4. Bc4 cxb2 5. Bxb2 d5 6. Bxd5 Nf6 7. Bxf7+ Kxf7 8. Qxd8 Bb4+ 9. Qd2 Bxd2+ 10. Nxd2",
      ),
      V(
        "Declined",
        "1. e4 e5 2. d4 exd4 3. c3 d5 4. exd5 Qxd5 5. cxd4 Nc6 6. Nf3 Bg4 7. Be2 Nf6 8. Nc3 Bb4",
      ),
    ],
  },
  {
    id: "center-game",
    name: "Center Game",
    color: "white",
    note: "",
    variations: [
      V(
        "Main Line",
        "1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3 Nf6 5. Nc3 Bb4 6. Bd2 O-O 7. O-O-O Re8 8. Qg3 d5",
      ),
      V(
        "Berger Variation",
        "1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qe3 g6 5. Nc3 Bg7 6. Bd2 Nge7 7. O-O-O O-O 8. f4 d6",
      ),
    ],
  },
  {
    id: "trompowsky",
    name: "Trompowsky Attack",
    color: "white",
    note: "",
    variations: [
      V(
        "2...Ne4",
        "1. d4 Nf6 2. Bg5 Ne4 3. Bf4 d5 4. e3 c5 5. Bd3 Qb6 6. Nd2 Nxd2 7. Kxd2 cxd4 8. exd4 Nc6 9. c3 e6",
      ),
      V(
        "2...d5",
        "1. d4 Nf6 2. Bg5 d5 3. Bxf6 exf6 4. e3 Be6 5. Nd2 c6 6. c3 Bd6 7. Bd3 Nd7 8. Qf3 Qc7",
      ),
      V(
        "2...c5",
        "1. d4 Nf6 2. Bg5 c5 3. Bxf6 gxf6 4. d5 Qb6 5. Qc1 f5 6. Nc3 d6 7. e3 Bg7 8. Bd3 Nd7",
      ),
    ],
  },
  {
    id: "colle",
    name: "Colle System",
    color: "white",
    note: "",
    variations: [
      V(
        "Main Line",
        "1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 c5 5. b3 Nc6 6. O-O Bd6 7. Bb2 O-O 8. Nbd2 b6 9. dxc5 Bxc5 10. Qe2 Bb7",
      ),
      V(
        "Colle-Zukertort vs ...c5",
        "1. d4 d5 2. Nf3 Nf6 3. e3 c5 4. c3 e6 5. Bd3 Nc6 6. Nbd2 Bd6 7. O-O O-O 8. dxc5 Bxc5 9. e4 dxe4",
      ),
    ],
  },
  {
    id: "birds",
    name: "Bird Opening",
    color: "white",
    note: "",
    variations: [
      V(
        "vs ...d5",
        "1. f4 d5 2. Nf3 Nf6 3. e3 g6 4. Be2 Bg7 5. O-O O-O 6. d3 c5 7. Qe1 Nc6 8. Nc3 d4 9. Ne4 Nxe4",
      ),
      V(
        "From's Gambit",
        "1. f4 e5 2. fxe5 d6 3. exd6 Bxd6 4. Nf3 g5 5. d4 g4 6. Ne5 Bxe5 7. dxe5 Qxd1+ 8. Kxd1 Nc6",
      ),
    ],
  },
  {
    id: "smith-morra",
    name: "Smith-Morra Gambit",
    color: "white",
    note: "vs 1...c5",
    variations: [
      V(
        "Main Line",
        "1. e4 c5 2. d4 cxd4 3. c3 dxc3 4. Nxc3 Nc6 5. Nf3 d6 6. Bc4 e6 7. O-O Nf6 8. Qe2 Be7 9. Rd1 e5 10. Bg5 O-O",
      ),
      V(
        "Siberian · 3...Nf6",
        "1. e4 c5 2. d4 cxd4 3. c3 Nf6 4. e5 Nd5 5. Nf3 Nc6 6. cxd4 d6 7. Bc4 Nb6 8. Bb5 dxe5 9. Nxe5 Bd7",
      ),
    ],
  },
  {
    id: "alapin",
    name: "Alapin Sicilian",
    color: "white",
    note: "vs 1...c5",
    variations: [
      V(
        "2...Nf6 3.e5",
        "1. e4 c5 2. c3 Nf6 3. e5 Nd5 4. d4 cxd4 5. Nf3 Nc6 6. cxd4 d6 7. Bc4 Nb6 8. Bb5 dxe5 9. Nxe5 Bd7 10. Nxd7 Qxd7 11. Bxc6 Qxc6",
      ),
      V(
        "2...d5",
        "1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 Bg4 6. Be2 e6 7. O-O Nc6 8. Be3 cxd4 9. cxd4 Bd6",
      ),
    ],
  },
  {
    id: "grand-prix",
    name: "Grand Prix Attack",
    color: "white",
    note: "vs 1...c5",
    variations: [
      V(
        "Main Line",
        "1. e4 c5 2. Nc3 Nc6 3. f4 g6 4. Nf3 Bg7 5. Bc4 e6 6. f5 Nge7 7. fxe6 fxe6 8. d3 d5 9. exd5 exd5 10. Bb3 d4 11. Ne2",
      ),
      V(
        "vs ...d6",
        "1. e4 c5 2. Nc3 d6 3. f4 Nc6 4. Nf3 g6 5. Bb5 Bd7 6. O-O Bg7 7. d3 Nf6 8. Qe1 O-O",
      ),
    ],
  },
  {
    id: "caro-white",
    name: "Caro-Kann Advance (as White)",
    color: "white",
    note: "vs 1...c6",
    variations: [
      V(
        "Short · 3...Bf5",
        "1. e4 c6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 c5 6. Be3 cxd4 7. Nxd4 Ne7 8. Nd2 Nbc6 9. Nxc6 Nxc6",
      ),
      V(
        "Panov-Botvinnik",
        "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. c4 Nf6 5. Nc3 e6 6. Nf3 Be7 7. cxd5 Nxd5 8. Bd3 Nc6 9. O-O O-O 10. Re1 Nf6",
      ),
    ],
  },
  {
    id: "french-white",
    name: "French Defense (as White)",
    color: "white",
    note: "vs 1...e6",
    variations: [
      V(
        "Advance",
        "1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 c4 7. Nbd2 Na5 8. Be2 Bd7 9. O-O Ne7",
      ),
      V(
        "Tarrasch",
        "1. e4 e6 2. d4 d5 3. Nd2 Nf6 4. e5 Nfd7 5. Bd3 c5 6. c3 Nc6 7. Ne2 cxd4 8. cxd4 f6 9. exf6 Nxf6 10. O-O Bd6",
      ),
      V(
        "Exchange",
        "1. e4 e6 2. d4 d5 3. exd5 exd5 4. Nf3 Nf6 5. Bd3 Bd6 6. O-O O-O 7. Bg5 Bg4 8. Nbd2 Nbd7",
      ),
    ],
  },
  {
    id: "scandi-white",
    name: "Scandinavian (as White)",
    color: "white",
    note: "vs 1...d5",
    variations: [
      V(
        "Main Line",
        "1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6 8. Qe2 Bb4",
      ),
      V(
        "Modern",
        "1. e4 d5 2. exd5 Nf6 3. d4 Nxd5 4. Nf3 g6 5. Be2 Bg7 6. O-O O-O 7. c4 Nb6 8. Nc3 Nc6",
      ),
    ],
  },
  {
    id: "dutch",
    name: "Dutch Defense",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Leningrad",
        "1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Qe8 8. d5 Na6 9. Rb1 c5",
      ),
      V(
        "Stonewall",
        "1. d4 f5 2. g3 Nf6 3. Bg2 e6 4. Nf3 d5 5. O-O Bd6 6. c4 c6 7. Nc3 O-O 8. Qc2 Qe8 9. Bf4 Bxf4 10. gxf4 Nbd7",
      ),
      V(
        "Classical",
        "1. d4 f5 2. c4 Nf6 3. g3 e6 4. Bg2 Be7 5. Nf3 O-O 6. O-O d6 7. Nc3 Qe8 8. Re1 Qh5 9. e4 fxe4 10. Nxe4 Nxe4 11. Rxe4 Nc6",
      ),
      V(
        "vs 2.Bg5",
        "1. d4 f5 2. Bg5 Nf6 3. Bxf6 exf6 4. e3 d5 5. Nf3 c6 6. Bd3 Bd6 7. c4 O-O 8. Nc3 Na6",
      ),
    ],
  },
  {
    id: "benoni",
    name: "Benoni / Benko",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Modern Benoni",
        "1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2 Na6 11. f3 Nc7 12. a4 b6 13. Nc4 Ba6",
      ),
      V(
        "Taimanov Attack",
        "1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. Bb5+ Nfd7 9. a4 O-O 10. Nf3 Na6 11. O-O Nb6",
      ),
      V(
        "Benko Gambit",
        "1. d4 Nf6 2. c4 c5 3. d5 b5 4. cxb5 a6 5. bxa6 Bxa6 6. Nc3 g6 7. Nf3 d6 8. g3 Bg7 9. Bg2 O-O 10. O-O Nbd7",
      ),
    ],
  },
  {
    id: "queens-indian",
    name: "Queen's Indian Defense",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "Fianchetto",
        "1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3 9. Qxc3 c5 10. Rd1 Nc6",
      ),
      V(
        "4.g3 Ba6",
        "1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Ba6 5. b3 Bb4+ 6. Bd2 Be7 7. Bg2 c6 8. Bc3 d5 9. Ne5 Nfd7 10. Nxd7 Nxd7",
      ),
      V(
        "Petrosian 4.a3",
        "1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. a3 Bb7 5. Nc3 d5 6. cxd5 Nxd5 7. e3 Be7 8. Bb5+ c6 9. Bd3 Nxc3 10. bxc3 c5",
      ),
      V(
        "4.e3 Bb7",
        "1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. e3 Bb7 5. Bd3 d5 6. O-O Bd6 7. b3 O-O 8. Bb2 Nbd7 9. Nbd2 Qe7",
      ),
    ],
  },
  {
    id: "bogo-indian",
    name: "Bogo-Indian Defense",
    color: "black",
    note: "vs 1.d4",
    variations: [
      V(
        "4.Bd2 Qe7",
        "1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Qe7 5. g3 Nc6 6. Nc3 Bxc3 7. Bxc3 Ne4 8. Rc1 O-O 9. Bg2 Nxc3 10. Rxc3 d6 11. O-O e5 12. d5 Nb8",
      ),
      V(
        "4.Nbd2",
        "1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Nbd2 O-O 5. a3 Bxd2+ 6. Bxd2 d6 7. g3 Nbd7 8. Bg2 b6 9. O-O Bb7",
      ),
    ],
  },
  {
    id: "modern",
    name: "Modern Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "3...c6 Systems",
        "1. e4 g6 2. d4 Bg7 3. Nc3 c6 4. Nf3 d6 5. Be3 Nf6 6. Qd2 b5 7. Bd3 Nbd7 8. O-O O-O",
      ),
      V(
        "Austrian 3...d6",
        "1. e4 g6 2. d4 Bg7 3. Nc3 d6 4. f4 Nf6 5. Nf3 O-O 6. Bd3 Na6 7. O-O c5 8. d5 Nc7 9. a4 b6",
      ),
    ],
  },
  {
    id: "alekhine",
    name: "Alekhine Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Classical 4.Nf3",
        "1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. Be2 e6 6. O-O Be7 7. h3 Bh5 8. c4 Nb6 9. Nc3 O-O 10. Be3 d5 11. c5 Nc8 12. b4 b6",
      ),
      V(
        "Four Pawns Attack",
        "1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. c4 Nb6 5. f4 dxe5 6. fxe5 Nc6 7. Be3 Bf5 8. Nc3 e6 9. Nf3 Be7 10. Be2 O-O 11. O-O f6 12. exf6 Bxf6 13. Qd2 Qe7",
      ),
      V(
        "Modern 4.Nf3 g6",
        "1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 g6 5. Bc4 Nb6 6. Bb3 Bg7 7. Nbd2 O-O 8. h3 a5 9. a4 dxe5 10. dxe5 Na6 11. O-O Nc5 12. Qe2 Nxb3 13. Nxb3",
      ),
    ],
  },
  {
    id: "philidor",
    name: "Philidor Defense",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Hanham",
        "1. e4 d6 2. d4 Nf6 3. Nc3 Nbd7 4. Nf3 e5 5. Bc4 Be7 6. O-O O-O 7. Re1 c6 8. a4 b6",
      ),
      V(
        "Exchange 4.dxe5",
        "1. e4 d6 2. d4 Nf6 3. Nc3 e5 4. dxe5 dxe5 5. Qxd8+ Kxd8 6. Bc4 Be6 7. Bxe6 fxe6 8. Bg5 Nbd7 9. O-O-O+ Kc8",
      ),
      V(
        "Main 3...e5",
        "1. e4 d6 2. d4 Nf6 3. Nc3 e5 4. Nf3 Nbd7 5. Bc4 Be7 6. O-O O-O 7. Qe2 c6 8. a4 exd4 9. Nxd4 Re8",
      ),
    ],
  },
  {
    id: "ruy-black",
    name: "Ruy Lopez (as Black)",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Berlin",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3 h5 11. Bf4 Be7 12. Rad1 Be6",
      ),
      V(
        "Marshall",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 O-O 8. c3 d5 9. exd5 Nxd5 10. Nxe5 Nxe5 11. Rxe5 c6 12. d3 Bd6 13. Re1 Qh4 14. g3 Qh3",
      ),
      V(
        "Open",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7 10. Nbd2 O-O 11. Bc2 Nxf2",
      ),
      V(
        "Closed · Zaitsev",
        "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Bb7 10. d4 Re8 11. Nbd2 Bf8 12. a4 h6",
      ),
    ],
  },
  {
    id: "italian-black",
    name: "Italian Game (as Black)",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Giuoco Piano",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O a6 7. a4 O-O 8. Re1 Ba7 9. h3 h6",
      ),
      V(
        "Two Knights · 4.Ng5 d5",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Na5 6. Bb5+ c6 7. dxc6 bxc6 8. Be2 h6 9. Nf3 e4 10. Ne5 Bd6",
      ),
      V(
        "Evans Gambit Accepted",
        "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 d6 7. Qb3 Qd7 8. dxe5 Bb6 9. Bg5 Nge7",
      ),
    ],
  },
  {
    id: "scotch-black",
    name: "Scotch Game (as Black)",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Classical 4...Bc5",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4 Ne5",
      ),
      V(
        "Four Knights 4...Nf6",
        "1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 cxd5 9. O-O O-O 10. Bg5 c6 11. Qf3 Be7 12. Rae1 Be6",
      ),
    ],
  },
  {
    id: "sicilian-white-sf",
    name: "Sicilian (as Black) vs 2.Nf3 d6 3.Bb5+",
    color: "black",
    note: "vs 1.e4",
    variations: [
      V(
        "Moscow",
        "1. e4 c5 2. Nf3 d6 3. Bb5+ Bd7 4. Bxd7+ Qxd7 5. c4 Nc6 6. Nc3 Nf6 7. O-O g6 8. d4 cxd4 9. Nxd4 Bg7",
      ),
    ],
  },
];
