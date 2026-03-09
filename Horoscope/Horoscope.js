import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function action(data, callback) {

	try {

		const tblActions = {
			getSign: () => getSign(data, data.client, callback)
		};

		info("Horoscope:", data.action.command, L.get("plugin.from"), data.client);

		const command = tblActions[data.action.command];

		if (command) await command();
		else callback();

	} catch (err) {

		error("Horoscope:", err.message);

		if (data.client) Avatar.Speech.end(data.client);

		callback();
	}
}


async function getSign(data, client, callback) {

	const sentence = data?.action?.rawSentence?.toLowerCase() || "";

	const SIGNS = {
		"bélier": "belier",
		"belier": "belier",
		"taureau": "taureau",
		"gémeaux": "gemeaux",
		"gemeaux": "gemeaux",
		"cancer": "cancer",
		"lion": "lion",
		"vierge": "vierge",
		"balance": "balance",
		"scorpion": "scorpion",
		"sagittaire": "sagittaire",
		"capricorne": "capricorne",
		"verseau": "verseau",
		"poissons": "poissons",
		"poisson": "poissons"
	};

	let signe = null;

	for (const key in SIGNS) {
		if (sentence.includes(key)) {
			signe = key;
			break;
		}
	}

	if (!signe) {

		return Avatar.speak(
			"Je connais les douze signes du zodiaque. Vous pouvez me demander par exemple : quel est l'horoscope du bélier, ou l'horoscope du lion pour demain.",
			client,
			() => {
				Avatar.Speech.end(client);
				callback();
			}
		);
	}

	const demain = sentence.includes("demain");
	const jour = demain ? "demain" : "aujourdhui";

	try {

		const signeURL = SIGNS[signe];

		const url = `https://www.horoscope.fr/horoscopes/${jour}/${signeURL}`;

		const response = await fetch(url);

		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const html = await response.text();
		const $ = cheerio.load(html);

		let texte =
			$("#wellbeing p").first().text().trim() ||
			$("article p").first().text().trim();

		if (!texte) throw new Error("Horoscope introuvable");

		// nettoyage texte pour TTS
		texte = texte.replace(/\s+/g, " ");

		const intro = demain
			? `Voici l'horoscope pour demain ${signe}.`
			: `Voici l'horoscope du jour ${signe}.`;

		Avatar.speak(`${intro} ${texte}`, client, () => {
			Avatar.Speech.end(client);
			callback();
		});

	} catch (err) {

		error("Horoscope:", err.message);

		Avatar.speak(
			"Je n'arrive pas à récupérer l'horoscope pour le moment.",
			client,
			() => {
				Avatar.Speech.end(client);
				callback();
			}
		);
	}
}
