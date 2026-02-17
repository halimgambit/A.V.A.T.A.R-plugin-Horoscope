import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function action(data, callback) {

	try {

		const tblActions = {
			getSign: () => getSign(data, data.client, callback)
		};

		info("Horoscope:", data.action.command, L.get("plugin.from"), data.client);

		if (tblActions[data.action.command]) {
			await tblActions[data.action.command]();
		}

	} catch (err) {
		if (data.client) Avatar.Speech.end(data.client);
		if (err.message) error(err.message);
		callback();
	}
}


async function getSign(data, client, callback) {

	const zodiaques = /(bélier|taureau|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons?)/gi;

	const match = data.action.rawSentence.match(zodiaques);
	let signe = match ? match[0].toLowerCase() : null;

	if (signe === "poisson") {
        signe = "poissons";
    }

	if (!signe) {
		Avatar.speak("Je n'ai pas compris le signe que tu recherches.", client, () => {
			Avatar.Speech.end(client);
			callback();
		});
		return;
	}

	try {

		const response = await fetch(`https://www.horoscope.fr/horoscopes/aujourdhui/${signe.replace("é", "e")}`);

		if (!response.ok) {
			throw new Error(`Erreur HTTP ${response.status}`);
		}

		const html = await response.text();
		const $ = cheerio.load(html);

		const texte = $("#wellbeing p").first().text().trim();

		if (!texte) throw new Error("Horoscope introuvable");

		Avatar.speak(`Voici l'horoscope du ${signe}. ${texte}`, client, () => {
			Avatar.Speech.end(client);
			callback();
		});

	} catch (err) {

		Avatar.speak("Impossible de récupérer l'horoscope.", client, () => {
			Avatar.Speech.end(client);
			callback();
		});
	}
}
