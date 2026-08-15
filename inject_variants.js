const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const langs = ['en', 'es', 'de', 'da', 'hu', 'hr'];

const generateVariant = (lang, text) => {
    const base = {
        "en": "The purpose of this Contract is to define the conditions under which the Lender provides the Borrower with a sum of money as a {TYPE}, subject to the latter repaying the principal, interest and, where applicable, the contractually applicable fees in accordance with the terms provided for in this Contract and its repayment schedule.",
        "es": "El objetivo de este Contrato es definir las condiciones bajo las cuales el Prestamista pone a disposición del Prestatario una suma de dinero como {TYPE}, con la obligación de este último de reembolsar el capital, los intereses y, en su caso, los gastos aplicables contractualmente según las modalidades previstas en este Contrato y su calendario de pagos.",
        "de": "Zweck dieses Vertrages ist es, die Bedingungen festzulegen, unter denen der Darlehensgeber dem Darlehensnehmer einen Geldbetrag als {TYPE} zur Verfügung stellt, vorbehaltlich der Rückzahlung des Kapitals, der Zinsen und gegebenenfalls der vertraglich geschuldeten Gebühren durch letzteren gemäß den in diesem Vertrag und seinem Tilgungsplan vorgesehenen Bedingungen.",
        "da": "Formålet med denne kontrakt er at fastsætte betingelserne for, at långiver stiller et pengebeløb til rådighed for låntager som et {TYPE}, med forbehold af sidstnævntes tilbagebetaling af hovedstolen, renterne og i givet fald de kontraktmæssigt gældende gebyrer i overensstemmelse med de vilkår, der er fastsat i denne kontrakt og dens tilbagebetalingsplan.",
        "hu": "Jelen szerződés célja azon feltételek meghatározása, amelyek mellett a Kölcsönadó a Kölcsönvevő rendelkezésére bocsát egy pénzösszeget {TYPE}ként, azzal a feltétellel, hogy utóbbi a tőkét, a kamatokat és adott esetben a szerződés szerint fizetendő díjakat a jelen Szerződésben és annak törlesztési tervében meghatározott feltételek szerint visszafizeti.",
        "hr": "Svrha ovog Ugovora je definirati uvjete pod kojima Zajmodavac stavlja Zajmoprimcu na raspolaganje novčani iznos kao {TYPE}, uz uvjet da potonji otplati glavnicu, kamate i, gdje je to primjenjivo, ugovorno primjenjive naknade u skladu s uvjetima predviđenim ovim Ugovorom i njegovim planom otplate."
    };
    return base[lang].replace('{TYPE}', text);
};

const frBase = "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de {TYPE}, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.";

const variants = {
    'consommation': {
        'fr': 'consommation', 'en': 'consumer loan', 'es': 'préstamo de consumo', 'de': 'Verbraucherkredit', 'da': 'forbrugslån', 'hu': 'fogyasztási hitel', 'hr': 'potrošački zajam'
    },
    'immobilier': {
        'fr': 'immobilier', 'en': 'real estate loan', 'es': 'préstamo inmobiliario', 'de': 'Immobilienkredit', 'da': 'boliglån', 'hu': 'jelzáloghitel', 'hr': 'stambeni zajam'
    },
    'grands projets': {
        'fr': 'grands projets', 'en': 'major projects financing', 'es': 'financiación de grandes proyectos', 'de': 'Großprojektfinanzierung', 'da': 'finansiering af store projekter', 'hu': 'nagyprojektek finanszírozása', 'hr': 'financiranje velikih projekata'
    }
};

langs.forEach(lang => {
    const file = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(file)) {
        const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
        let updated = false;
        
        for (const [typeKey, typeTranslations] of Object.entries(variants)) {
            const frText = frBase.replace('{TYPE}', typeTranslations['fr']);
            const localizedText = generateVariant(lang, typeTranslations[lang]);
            
            if (!dict[frText]) {
                dict[frText] = localizedText;
                updated = true;
            } else {
                dict[frText] = localizedText;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(file, JSON.stringify(dict, null, 2));
            console.log(`Updated variants in ${lang}.json`);
        }
    }
});
