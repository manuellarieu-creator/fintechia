const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend/assets/locales');
const langs = ['en', 'es', 'de', 'da', 'hu', 'hr'];
const missingFile = path.join(__dirname, 'missing_strings.json');
const missingStrings = JSON.parse(fs.readFileSync(missingFile, 'utf8'));

// Adding them to fr.json first
const frFile = path.join(localesDir, 'fr.json');
const frDict = JSON.parse(fs.readFileSync(frFile, 'utf8'));
for (const str of missingStrings) {
    frDict[str] = str;
}
fs.writeFileSync(frFile, JSON.stringify(frDict, null, 2));

async function translateText(text, targetLang) {
    // Simple rate limiting
    await new Promise(r => setTimeout(r, 100)); 
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        // data[0] contains an array of translated segments
        return data[0].map(segment => segment[0]).join('');
    } catch(e) {
        console.error(`Failed to translate "${text}" to ${targetLang}:`, e.message);
        return text; // fallback to french
    }
}

async function main() {
    for (const lang of langs) {
        console.log(`Processing language: ${lang}`);
        const file = path.join(localesDir, `${lang}.json`);
        let dict = {};
        if (fs.existsSync(file)) {
            dict = JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        
        // Translate missing
        let translatedCount = 0;
        for (const str of missingStrings) {
            if (!dict[str]) {
                const trans = await translateText(str, lang);
                dict[str] = trans;
                translatedCount++;
                if (translatedCount % 50 === 0) {
                    console.log(`...translated ${translatedCount}/${missingStrings.length} for ${lang}`);
                }
            }
        }
        
        fs.writeFileSync(file, JSON.stringify(dict, null, 2));
        console.log(`Finished ${lang}. Added ${translatedCount} translations.`);
    }
    console.log('All done!');
}

main();
