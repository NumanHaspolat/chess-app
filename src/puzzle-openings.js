// Lichess puzzle açılış listesi (lichess.org/training/openings). Anahtar = açılış ailesi,
// değer = boşlukla ayrılmış alt-varyant son ekleri. API açısı: "Aile" veya "Aile_Varyant".
// Sıra Lichess'teki popülerlik sırasıdır.
const RAW = {
  Sicilian_Defense:
    "Najdorf_Variation Dragon_Variation Accelerated_Dragon Taimanov_Variation Scheveningen_Variation Alapin_Variation Closed Open Smith-Morra_Gambit Kan_Variation Classical_Variation Sozin_Attack Richter-Rauzer_Variation Nyezhmetdinov-Rossolimo_Attack Grand_Prix_Attack Old_Sicilian Moscow_Variation Four_Knights_Variation Kalashnikov_Variation Lasker-Pelikan_Variation Delayed_Alapin_Variation Bowdler_Attack McDonnell_Attack Modern_Variations French_Variation Hyperaccelerated_Dragon Staunton-Cochrane_Variation Nimzowitsch_Variation Kramnik_Variation Wing_Gambit Marshall_Counterattack Venice_Attack Keres_Variation Prins_Variation Smith-Morra_Gambit_Accepted Smith-Morra_Gambit_Declined",
  French_Defense:
    "Advance_Variation Exchange_Variation Knight_Variation Tarrasch_Variation Normal_Variation Rubinstein_Variation Winawer_Variation Classical_Variation La_Bourdonnais_Variation Queens_Knight Two_Knights_Variation Steiner_Variation Kings_Indian_Attack Steinitz_Variation Horwitz_Attack Schlechter_Variation Paulsen_Variation Wing_Gambit Chigorin_Variation Mediterranean_Defense St_George_Defense Henneberger_Variation",
  Queens_Pawn_Game:
    "Accelerated_London_System London_System Chigorin_Variation Zukertort_Variation Colle_System Symmetrical_Variation Modern_Defense Levitsky_Attack Krause_Variation Torre_Attack Stonewall_Attack Anti-Torre Mason_Attack Veresov_Attack Anglo-Slav_Opening Barry_Attack",
  Italian_Game:
    "Two_Knights_Defense Classical_Variation Giuoco_Pianissimo Anti-Fried_Liver_Defense Giuoco_Piano Evans_Gambit Scotch_Gambit Blackburne-Kostic_Gambit Rousseau_Gambit Hungarian_Defense Paris_Defense Evans_Gambit_Declined Rosentreter_Gambit Deutz_Gambit Jerome_Gambit Scotch_Invitation_Declined",
  "Caro-Kann_Defense":
    "Advance_Variation Exchange_Variation Two_Knights_Attack Classical_Variation Panov_Attack Hillbilly_Attack Maroczy_Variation Accelerated_Panov_Attack Tartakower_Variation Main_Line Karpov_Variation Breyer_Variation Campomanes_Attack Endgame_Offer Forgacs_Variation Goldman_Variation Euwe_Attack Bronstein-Larsen_Variation Modern_Variation Gurgenidze_System",
  Scandinavian_Defense:
    "Mieses-Kotroc_Variation Modern_Variation Main_Line Valencian_Variation Gubinsky-Melts_Defense Icelandic-Palme_Gambit Panov_Transfer Blackburne_Gambit Marshall_Variation Portuguese_Gambit Bronstein_Variation Lasker_Variation Classical_Variation Kiel_Variation Anderssen_Counterattack Schiller-Pytel_Variation Richter_Variation",
  Queens_Gambit_Declined:
    "Marshall_Defense Albin_Countergambit Exchange_Variation Chigorin_Defense Modern_Variation Queens_Knight_Variation Ragozin_Defense Baltic_Defense Three_Knights_Variation Normal_Defense Harrwitz_Attack Semi-Tarrasch_Defense Austrian_Defense Tarrasch_Defense Traditional_Variation Vienna_Variation Orthodox_Defense Janowski_Variation Neo-Orthodox_Variation Barmen_Variation Charousek_Variation Cambridge_Springs_Defense Tartakower_Defense Austrian_Attack Capablanca_Variation Lasker_Defense Alapin_Variation Anti-Tartakower_Variation",
  English_Opening:
    "Kings_English_Variation Symmetrical_Variation Anglo-Indian_Defense Agincourt_Defense Anglo-Scandinavian_Defense Caro-Kann_Defensive_System Great_Snake_Variation The_Whale Mikenas-Carls_Variation Carls-Bremen_System Anglo-Dutch_Defense Four_Knights_System Anglo-Grunfeld_Defense Anglo-Lithuanian_Variation Jaenisch_Gambit Neo-Catalan",
  Ruy_Lopez:
    "Morphy_Defense Berlin_Defense Steinitz_Defense Classical_Variation Exchange_Variation Schliemann_Defense Bird_Variation Cozio_Defense Closed Open Marshall_Attack Nurnberg_Variation Fianchetto_Defense Spanish_Countergambit Open_Berlin_Defense Vinogradov_Variation",
  Scotch_Game:
    "Scotch_Gambit Classical_Variation Schmidt_Variation Goring_Gambit Lolli_Variation Haxo_Gambit Benima_Defense Mieses_Variation Potter_Variation Modern_Defense Malaniuk_Variation Blumenfeld_Attack Steinitz_Variation Ghulam-Kassim_Variation Relfsson_Gambit Vitzthum_Attack Paulsen_Attack",
  Indian_Defense:
    "Budapest_Defense Normal_Variation London_System Anti-Nimzo-Indian Knights_Variation Wade-Tartakower_Defense Spielmann-Indian Accelerated_London_System West_Indian_Defense Reversed_Chigorin_Defense Seirawan_Attack Przepiorka_Variation Tartakower_Attack Pawn_Push_Variation Czech-Indian Colle_System Anti-Grunfeld Pseudo-Benko",
  Philidor_Defense:
    "Exchange_Variation Lion_Variation Hanham_Variation Morphy_Gambit Nimzowitsch_Variation Lopez_Countergambit Bird_Gambit Philidor_Countergambit Steinitz_Variation Larsen_Variation Albin-Blackburne_Gambit",
  Kings_Gambit_Accepted:
    "MacLeod_Defense Fischer_Defense Kings_Knights_Gambit Bishops_Gambit Cunningham_Defense Modern_Defense Schallopp_Defense Abbazia_Defense Kieseritzky_Gambit Becker_Defense Muzio_Gambit Blachly_Gambit Salvio_Gambit Allgaier_Gambit Hanstein_Gambit Double_Muzio_Gambit Traditional_Variation Lolli_Gambit Ghulam-Kassim_Gambit",
  Four_Knights_Game:
    "Italian_Variation Spanish_Variation Scotch_Variation_Accepted Scotch_Variation Halloween_Gambit Gunsberg_Variation",
  Zukertort_Opening:
    "Tennison_Gambit Sicilian_Invitation Black_Mustang_Defense Queens_Gambit_Invitation Kingside_Fianchetto Slav_Invitation Pirc_Invitation Queenside_Fianchetto_Variation Dutch_Variation Old_Indian_Attack Lemberger_Gambit Nimzo-Larsen_Variation Ross_Gambit Reversed_Mexican_Defense Quiet_System Wade_Defense Reversed_Grunfeld The_Walrus Arctic_Defense Polish_Defense",
  Modern_Defense:
    "Standard_Defense Two_Knights_Variation Standard_Line Three_Pawns_Attack Mongredien_Defense Averbakh_System Pseudo-Austrian_Attack Gellers_System Norwegian_Defense Bishop_Attack Kotov_Variation Beefeater_Variation Modern_Pterodactyl",
  Pirc_Defense:
    "Classical_Variation Austrian_Attack Byrne_Variation Kholmov_System Roscher_Gambit Bayonet_Attack",
  Vienna_Game:
    "Vienna_Gambit Stanley_Variation Max_Lange_Defense Anderssen_Defense Falkbeer_Variation Frankenstein-Dracula_Variation Omaha_Gambit Paulsen_Variation Mieses_Variation Mengarini_Variation",
  Bishops_Opening:
    "Berlin_Defense Vienna_Hybrid Boi_Variation Ponziani_Gambit Urusov_Gambit Philidor_Counterattack Boden-Kieseritzky_Gambit Calabrese_Countergambit Lewis_Gambit Khan_Gambit Philidor_Variation Stein_Gambit Warsaw_Gambit",
  Slav_Defense:
    "Exchange_Variation Three_Knights_Variation Modern_Line Quiet_Variation Slav_Gambit Geller_Gambit Czech_Variation Schlechter_Variation Diemer_Gambit Bonet_Gambit Chebanenko_Variation Alekhine_Variation Two_Knights_Attack Winawer_Countergambit Alapin_Variation Breyer_Variation",
  Kings_Pawn_Game:
    "Busch-Gass_Gambit Leonardis_Variation McConnell_Defense Wayward_Queen_Attack Napoleon_Attack Maroczy_Defense Damiano_Defense MacLeod_Attack Tayler_Opening Gunderam_Gambit Beyer_Gambit Alapin_Opening Dresden_Opening Clam_Variation Tortoise_Opening",
  Queens_Gambit_Accepted:
    "Old_Variation Central_Variation Saduleto_Variation Normal_Variation Rosenthal_Variation Showalter_Variation Classical_Defense Gunsberg_Defense Accelerated_Mannheim_Variation Janowski-Larsen_Variation Alekhine_Defense Slav_Gambit",
  Benoni_Defense:
    "Old_Benoni Benoni_Gambit_Accepted French_Benoni Modern_Variation Benoni-Indian_Defense Hromadka_System Kings_Pawn_Line Classical_Variation Czech_Benoni_Defense Semi-Benoni Weenink_Variation Four_Pawns_Attack",
  Nimzowitsch_Defense:
    "Scandinavian_Variation Kennedy_Variation Declined_Variation Franco-Nimzowitsch_Variation Williams_Variation Mikenas_Variation Colorado_Countergambit Pseudo-Spanish_Variation",
  "Nimzo-Larsen_Attack":
    "Modern_Variation Classical_Variation Indian_Variation English_Variation Symmetrical_Variation Dutch_Variation Spike_Variation",
  Kings_Indian_Defense:
    "Normal_Variation Orthodox_Variation Fianchetto_Variation Samisch_Variation Four_Pawns_Attack Smyslov_Variation Zinnowitz_Variation Makogonov_Variation Semi-Classical_Variation Accelerated_Averbakh_Variation Semi-Averbakh_System Larsen_Variation Averbakh_Variation Petrosian_Variation Kramer_Variation Exchange_Variation Steiner_Attack",
  Alekhine_Defense:
    "Scandinavian_Variation Modern_Variation Normal_Variation Four_Pawns_Attack Exchange_Variation Two_Pawns_Attack Maroczy_Variation Samisch_Attack Balogh_Variation OSullivan_Gambit Mokele_Mbembe Krejcik_Variation Brooklyn_Variation Hunt_Variation",
  Horwitz_Defense: "",
  Kings_Gambit_Declined:
    "Queens_Knight_Defense Falkbeer_Countergambit Classical_Variation Falkbeer_Countergambit_Accepted Petrovs_Defense Miles_Defense Mafia_Defense Keenes_Defense Panteldakis_Countergambit Norwalde_Variation",
  Englund_Gambit:
    "Hartlaub-Charlick_Gambit Main_Line Soller_Gambit Felbecker_Gambit Stockholm_Variation",
  Owen_Defense: "Smith_Gambit",
  Bird_Opening:
    "Dutch_Variation Froms_Gambit Williams_Gambit Lasker_Variation Schlechter_Gambit Wagner-Zwitersch_Gambit Sturm_Gambit",
  Dutch_Defense:
    "Queens_Knight_Variation Raphael_Variation Rubinstein_Variation Classical_Variation Hopton_Attack Normal_Variation Staunton_Gambit Staunton_Gambit_Accepted Leningrad_Variation Krejcik_Gambit Fianchetto_Attack Blackmars_Second_Gambit Stonewall_Variation",
  Petrovs_Defense:
    "Stafford_Gambit Italian_Variation Three_Knights_Game Modern_Attack Damiano_Variation Classical_Attack Nimzowitsch_Attack Cochrane_Gambit Cozio_Attack",
  "Nimzo-Indian_Defense":
    "Classical_Variation Three_Knights_Variation Leningrad_Variation Normal_Variation Samisch_Variation Kmoch_Variation Spielmann_Variation St_Petersburg_Variation Romanishin_Variation Rubinstein_System Reshevsky_Variation",
  "Semi-Slav_Defense":
    "Accelerated_Move_Order Main_Line Marshall_Gambit Noteboom_Variation Normal_Variation Chigorin_Defense Botvinnik_Variation Stoltz_Variation Anti-Moscow_Gambit Meran_Variation Quiet_Variation",
  Center_Game:
    "Normal_Variation Kieseritzky_Variation Paulsen_Attack_Variation Berger_Variation Halasz-McDonnell_Gambit von_der_Lasa_Gambit Lanc-Arnold_Gambit Hall_Variation",
  Hungarian_Opening:
    "Indian_Defense Slav_Formation Sicilian_Invitation Catalan_Formation Symmetrical_Variation Reversed_Modern_Defense Dutch_Defense",
  Elephant_Gambit: "Paulsen_Countergambit Maroczy_Gambit",
  Ponziani_Opening:
    "Jaenisch_Counterattack Neumann_Gambit Ponziani_Countergambit Spanish_Variation Vukovic_Gambit",
  Three_Knights_Opening: "Winawer_Defense Steinitz_Defense",
  "Blackmar-Diemer_Gambit":
    "Blackmar_Gambit von_Popiel_Gambit Zeller_Defense Netherlands_Variation Lemberger_Countergambit Fritz_Attack Reversed_Albin_Countergambit",
  Polish_Opening:
    "Czech_Defense Bugayev_Attack Kings_Indian_Variation Outflank_Variation Schiffler-Sokolsky_Variation Birmingham_Gambit Baltic_Defense",
  "Rapport-Jobava_System": "",
  Rat_Defense:
    "Small_Center_Defense Harmonist English_Rat Antal_Defense Balogh_Defense Accelerated_Gurgenidze",
  English_Defense: "",
  Trompowsky_Attack:
    "Classical_Defense Raptor_Variation Edge_Variation Borg_Variation",
  Grunfeld_Defense:
    "Exchange_Variation Three_Knights_Variation Stockholm_Variation Brinckmann_Attack Russian_Variation",
  Kings_Indian_Attack:
    "Symmetrical_Defense French_Variation Sicilian_Variation Keres_Variation Wahls_Defense Yugoslav_Variation Double_Fianchetto",
  Kings_Gambit: "",
  Danish_Gambit_Accepted:
    "Copenhagen_Defense Classical_Defense Schlechter_Defense Chigorin_Defense",
  Grob_Opening: "Grob_Gambit Spike Grob_Gambit_Declined Spike_Attack",
  Danish_Gambit: "",
  Van_Geet_Opening:
    "Reversed_Nimzowitsch Dunst-Perrenet_Gambit Napoleon_Attack Grunfeld_Defense Berlin_Gambit Sicilian_Two_Knights",
  Kings_Knight_Opening: "Normal_Variation Konstantinopolsky",
  Old_Indian_Defense:
    "Czech_Variation Ukrainian_Variation Two_Knights_Variation Janowski_Variation",
  Tarrasch_Defense:
    "Symmetrical_Variation Two_Knights_Variation Schara_Gambit Classical_Variation Prague_Variation",
  Reti_Opening:
    "Reti_Accepted Advance_Variation Anglo-Slav_Variation Reversed_Blumenfeld_Gambit",
  Catalan_Opening: "Closed Open_Defense Closed_Variation",
  Queens_Indian_Defense:
    "Kasparov_Variation Classical_Variation Fianchetto_Variation Kasparov-Petrosian_Variation Spassky_System Capablanca_Variation Petrosian_Variation",
  London_System: "",
  Latvian_Gambit:
    "Mlotkowski_Variation Mason_Countergambit Mayet_Attack Fraser_Defense Greco_Variation",
  Torre_Attack: "Classical_Defense Fianchetto_Defense",
  Benko_Gambit: "Zaitsev_System",
  Benko_Gambit_Accepted:
    "Fully_Accepted_Variation Modern_Variation Pawn_Return_Variation",
  "Bogo-Indian_Defense":
    "Exchange_Variation Grunfeld_Variation Nimzowitsch_Variation Retreat_Variation Wade-Smyslov_Variation",
  Pterodactyl_Defense: "Eastern Western Queen_Pterodactyl Sicilian",
  Lion_Defense: "Anti-Philidor Lions_Jaw",
  Queens_Gambit: "",
  Kings_Pawn_Opening: "",
  "Richter-Veresov_Attack": "",
  Rubinstein_Opening: "",
};

const FIXES = [
  [/\bKings\b/g, "King's"],
  [/\bQueens\b/g, "Queen's"],
  [/\bBishops\b/g, "Bishop's"],
  [/\bPetrovs\b/g, "Petrov's"],
  [/\bGellers\b/g, "Geller's"],
  [/\bKeenes\b/g, "Keene's"],
  [/\bFroms\b/g, "From's"],
  [/\bLions\b/g, "Lion's"],
  [/\bBlackmars\b/g, "Blackmar's"],
  [/\bOSullivan\b/g, "O'Sullivan"],
  [/\bGrunfeld\b/g, "Grünfeld"],
  [/\bSamisch\b/g, "Sämisch"],
  [/\bReti\b/g, "Réti"],
  [/\bNurnberg\b/g, "Nürnberg"],
  [/\bLowenthal\b/g, "Löwenthal"],
];

export function puzzleLabel(key) {
  let s = key.replace(/_/g, " ");
  for (const [re, to] of FIXES) s = s.replace(re, to);
  return s;
}

// [{ key, label, variations: [{ key (son ek), label }] }]
export const PUZZLE_OPENINGS = Object.entries(RAW).map(([key, rest]) => ({
  key,
  label: puzzleLabel(key),
  variations: rest
    ? rest.split(/\s+/).map((s) => ({ key: s, label: puzzleLabel(s) }))
    : [],
}));
