import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function init () {
    await Avatar.lang.addPluginPak('Horoscope');
}

export async function action(data, callback) {

    try {

        const Locale = await Avatar.lang.getPak('Horoscope', data.language);

        const tblActions = {
            getSign: () => getSign(data, data.client, Locale, callback)
        };

        info("Horoscope:", data.action.command, "from", data.client);

        if (tblActions[data.action.command]) {
                await tblActions[data.action.command]();
            } else {
                callback();
            }

    } catch (err) {
        error("Erreur Horoscope:", err.message);
        Avatar.speak(Locale.get(["speech.error"]), data.client, () => {
            callback();
        });
    }
}


const getSign = async (data, client, Locale, callback) => {

    let sentence = (data.action?.rawSentence || data.action?.sentence || "").toLowerCase();
    
    const SIGNS = Locale.pak.signs;

    let signe = null;

    for (const key in SIGNS) {
        if (sentence.includes(key)) {
            signe = key;
            break;
        }
    }

    if (!signe) {
        info(Locale.get(["speech.unknownSign"]));
		return Avatar.speak(Locale.get(["speech.unknownSign"]), client, () => {
           callback();
        });
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

        let texte = $("#wellbeing p").first().text().trim() || $("article p").first().text().trim();

        if (!texte) {
            throw new Error(Locale.get(["speech.newError"]));
        }

        texte = texte.replace(/\s+/g, " ");

        const intro = demain ? Locale.get(["speech.tomorrow", signe]) : Locale.get(["speech.today", signe]);

        info(`${intro} ${texte}`);

        Avatar.speak(`${intro} ${texte}`, client, () => {
            callback();
        });

    } catch (err) {
        error("Horoscope:", err.message);
        Avatar.speak(Locale.get(["speech.errorFetch"]), client, () => {
           callback();
        });
    }
}
