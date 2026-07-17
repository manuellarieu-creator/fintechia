const fs = require('fs');

async function translateText(texts, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${targetLang}&dt=t`;
  const dict = {};
  
  // Batch processing (Google translate free API accepts limited text per request)
  const batchSize = 20;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const query = batch.join('\n\n|\n\n'); // Use pipe to separate
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ q: query })
      });
      const data = await res.json();
      
      if (data && data[0]) {
        let translatedFull = data[0].map(x => x[0]).join('');
        let translatedBatch = translatedFull.split(/\s*\|\s*/);
        
        for (let j = 0; j < batch.length; j++) {
          if (translatedBatch[j]) {
            dict[batch[j]] = translatedBatch[j].trim();
          } else {
            dict[batch[j]] = batch[j];
          }
        }
      }
    } catch (e) {
      console.error(`Error translating to ${targetLang}:`, e.message);
      for (let j = 0; j < batch.length; j++) {
        dict[batch[j]] = batch[j];
      }
    }
    
    // sleep
    await new Promise(r => setTimeout(r, 1000));
    console.log(`Translated ${Math.min(i + batchSize, texts.length)} / ${texts.length} for ${targetLang}`);
  }
  
  return dict;
}

async function main() {
  const dictRaw = JSON.parse(fs.readFileSync('scratch_dict.json', 'utf8'));
  const texts = Object.keys(dictRaw);
  
  const langs = ['en', 'de', 'es', 'da', 'hu', 'hr'];
  
  if (!fs.existsSync('frontend/assets/locales')) {
    fs.mkdirSync('frontend/assets/locales', { recursive: true });
  }
  
  // Save original French dict
  fs.writeFileSync('frontend/assets/locales/fr.json', JSON.stringify(dictRaw, null, 2));
  
  for (let lang of langs) {
    if (fs.existsSync(`frontend/assets/locales/${lang}.json`)) {
      console.log(`Skipping ${lang}, already exists.`);
      continue;
    }
    console.log(`Translating to ${lang}...`);
    const translatedDict = await translateText(texts, lang);
    fs.writeFileSync(`frontend/assets/locales/${lang}.json`, JSON.stringify(translatedDict, null, 2));
  }
  
  console.log('All translations done.');
}

main();
