import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function init () {
    await Avatar.lang.addPluginPak('Horoscope');
}

export async function action(data, callback) {

    try {

        const Locale = await Avatar.lang.getPak('Horoscope', data.language);

        const tblActions = {
            getSign: () => getSign(data, data.client, Locale)
        };

        info("Horoscope:", data.action.command, Locale.get("plugin.from"), data.client);

        if (tblActions[data.action.command]) {
            await tblActions[data.action.command]();
        }

    } catch (err) {
        error("Erreur Horoscope:", err.message);
        Avatar.speak(Locale.get("speech.error"), data.client, () => Avatar.Speech.end(data.client)
        );
    }

    callback();
}


async function getSign(data, client, Locale) {

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
		return Avatar.speak(Locale.get("speech.unknownSign"), client, () => {
                Avatar.Speech.end(client);
            }
        );
    }

    const demain = sentence.includes("demain");
    const jour = demain ? "demain" : "aujourdhui";

    try {

        const signeURL = SIGNS[signe];

        const url = `https://www.horoscope.fr/horoscopes/${jour}/${signeURL}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        const $ = cheerio.load(html);

        let texte =
            $("#wellbeing p").first().text().trim() ||
            $("article p").first().text().trim();

        if (!texte) {
            throw new Error("Horoscope introuvable");
        }

        texte = texte.replace(/\s+/g, " ");

        const intro = demain
            ? Locale.get(["speech.tomorrow", signe])
            : Locale.get(["speech.today", signe]);

        Avatar.speak(`${intro} ${texte}`, client, () => {
                Avatar.Speech.end(client);
            }
        );

    } catch (err) {
        error("Horoscope:", err.message);
        Avatar.speak(Locale.get("speech.errorFetch"), client, () => {
                Avatar.Speech.end(client);
            }
        );
    }
}
