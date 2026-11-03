#!/usr/bin/env node
// Génère les voix des répliques avec le modèle Gemini TTS, une seule fois,
// et les enregistre en MP3 dans frontiere-mexique/voix/ (+ liste.json).
//
// Pourquoi pas en direct dans le navigateur ? La clé d'API serait visible par
// tous les visiteurs du site, et chaque partie relancerait 43 générations.
// Ici, on génère une fois, on écoute, on régénère ce qui ne va pas, on publie.
//
// Utilisation (Node 18 ou plus récent, ffmpeg conseillé) :
//   GEMINI_API_KEY=votre_cle node outils/generer-voix.mjs
//   GEMINI_API_KEY=votre_cle node outils/generer-voix.mjs --seulement depart,alerte
//   GEMINI_API_KEY=votre_cle node outils/generer-voix.mjs --forcer        (tout régénérer)
//   GEMINI_API_KEY=votre_cle node outils/generer-voix.mjs --modele gemini-2.5-pro-preview-tts
//
// Chaque réplique est jouée selon son « direction » (indication d'acteur) et
// le timbre de son personnage (voixGemini), définis dans frontiere-mexique/js/contenu.js.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dossierVoix = path.join(racine, "frontiere-mexique", "voix");
const args = process.argv.slice(2);
const option = (nom) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : null; };
const forcer = args.includes("--forcer");
const seulement = option("--seulement") ? option("--seulement").split(",").map((x) => x.trim()) : null;
const modele = option("--modele") || "gemini-2.5-flash-preview-tts";
const cle = process.env.GEMINI_API_KEY;

if (!cle) {
  // Pas de variable : la clé peut être ajoutée par le proxy (secret réseau, en-tête x-goog-api-key).
  console.warn("GEMINI_API_KEY absente : on suppose que la clé est fournie comme secret réseau (en-tête x-goog-api-key).");
}

// Charger contenu.js (écrit pour le navigateur) dans un faux « window ».
const bac = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(racine, "frontiere-mexique", "js", "contenu.js"), "utf8"), bac);
const { repliques, voixGemini } = bac.window.CONTENU;

const ffmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;
if (!ffmpeg) console.warn("ffmpeg introuvable : les fichiers seront en WAV (plus lourds).");
fs.mkdirSync(dossierVoix, { recursive: true });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function pcmVersWav(pcm, frequence) {
  const entete = Buffer.alloc(44);
  entete.write("RIFF", 0); entete.writeUInt32LE(36 + pcm.length, 4); entete.write("WAVE", 8);
  entete.write("fmt ", 12); entete.writeUInt32LE(16, 16); entete.writeUInt16LE(1, 20); entete.writeUInt16LE(1, 22);
  entete.writeUInt32LE(frequence, 24); entete.writeUInt32LE(frequence * 2, 28); entete.writeUInt16LE(2, 32); entete.writeUInt16LE(16, 34);
  entete.write("data", 36); entete.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([entete, pcm]);
}

async function generer(id, r) {
  const voix = voixGemini[r.qui] || "Aoede";
  const texte = (r.direction || "Say in Spanish: ") + "\"" + r.texte + "\"";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`;
  const entetes = { "Content-Type": "application/json" };
  if (cle) entetes["x-goog-api-key"] = cle; // la clé en en-tête, jamais dans l'adresse
  const corps = {
    contents: [{ parts: [{ text: texte }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voix } } },
    },
  };
  for (let essai = 1; essai <= 5; essai++) {
    const rep = await fetch(url, { method: "POST", headers: entetes, body: JSON.stringify(corps) });
    if (rep.status === 429 || rep.status >= 500) {
      const attente = 15000 * essai;
      console.log(`  ${id} : serveur occupé (${rep.status}), nouvel essai dans ${attente / 1000} s`);
      await pause(attente);
      continue;
    }
    const json = await rep.json();
    if (!rep.ok) throw new Error(`${rep.status} ${JSON.stringify(json.error || json).slice(0, 300)}`);
    const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!part) throw new Error("pas d'audio dans la réponse : " + JSON.stringify(json).slice(0, 300));
    const frequence = parseInt((part.inlineData.mimeType || "").match(/rate=(\d+)/)?.[1] || "24000", 10);
    return { pcm: Buffer.from(part.inlineData.data, "base64"), frequence, voix };
  }
  throw new Error("échec après 5 essais");
}

function enregistrer(id, pcm, frequence) {
  if (ffmpeg) {
    const sortie = path.join(dossierVoix, id + ".mp3");
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(frequence), "-ac", "1", "-i", "pipe:0",
      "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.15",
      "-codec:a", "libmp3lame", "-b:a", "64k", sortie], { input: pcm });
    if (r.status !== 0) throw new Error("ffmpeg : " + r.stderr.toString());
    return id + ".mp3";
  }
  fs.writeFileSync(path.join(dossierVoix, id + ".wav"), pcmVersWav(pcm, frequence));
  return id + ".wav";
}

const ids = Object.keys(repliques).filter((id) => !seulement || seulement.includes(id));
console.log(`${ids.length} réplique(s) à traiter avec ${modele}…`);
let faits = 0, erreurs = 0;
for (const id of ids) {
  const existe = ["mp3", "wav"].some((e) => fs.existsSync(path.join(dossierVoix, `${id}.${e}`)));
  if (existe && !forcer && !seulement) { console.log(`  ${id} : déjà là`); continue; }
  try {
    const { pcm, frequence, voix } = await generer(id, repliques[id]);
    const fichier = enregistrer(id, pcm, frequence);
    console.log(`  ${id} : ${fichier} (${voix}, ${(pcm.length / 2 / frequence).toFixed(1)} s)`);
    faits++;
  } catch (e) {
    console.error(`  ${id} : ERREUR ${e.message}`);
    erreurs++;
  }
  await pause(2500); // rester sous les limites de débit de l'API
}

// liste.json : tous les fichiers présents, dans l'ordre des répliques.
const liste = Object.keys(repliques).flatMap((id) =>
  ["mp3", "wav"].filter((e) => fs.existsSync(path.join(dossierVoix, `${id}.${e}`))).slice(0, 1).map((e) => (e === "mp3" ? id : `${id}.${e}`)));
fs.writeFileSync(path.join(dossierVoix, "liste.json"), JSON.stringify(liste, null, 1) + "\n");
console.log(`Terminé : ${faits} générée(s), ${erreurs} erreur(s). ${liste.length}/${Object.keys(repliques).length} répliques ont une voix.`);
