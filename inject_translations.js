const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'frontend', 'assets', 'locales');
const langs = ['en', 'es', 'de', 'da', 'hu', 'hr'];

const newTranslations = {
  "en": {
    "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de prêt personnel, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.": "The purpose of this Contract is to define the conditions under which the Lender provides the Borrower with a sum of money as a personal loan, subject to the latter repaying the principal, interest and, where applicable, the contractually applicable fees in accordance with the terms provided for in this Contract and its repayment schedule.",
    "échéances masquées dans l'aperçu": "installments hidden in the preview",
    "Compte FINTECHIA de l'emprunteur": "Borrower's FINTECHIA account",
    "Sans garantie": "Without guarantee",
    "Durée du remboursement": "Repayment period",
    "mois": "months",
    "10 ans (Durée légale)": "10 years (Legal duration)"
  },
  "es": {
    "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de prêt personnel, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.": "El objetivo de este Contrato es definir las condiciones bajo las cuales el Prestamista pone a disposición del Prestatario una suma de dinero como préstamo personal, con la obligación de este último de reembolsar el capital, los intereses y, en su caso, los gastos aplicables contractualmente según las modalidades previstas en este Contrato y su calendario de pagos.",
    "échéances masquées dans l'aperçu": "cuotas ocultas en la vista previa",
    "Compte FINTECHIA de l'emprunteur": "Cuenta FINTECHIA del prestatario",
    "Sans garantie": "Sin garantía",
    "Durée du remboursement": "Plazo de reembolso",
    "mois": "meses",
    "10 ans (Durée légale)": "10 años (Duración legal)"
  },
  "de": {
    "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de prêt personnel, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.": "Zweck dieses Vertrages ist es, die Bedingungen festzulegen, unter denen der Darlehensgeber dem Darlehensnehmer einen Geldbetrag als Privatkredit zur Verfügung stellt, vorbehaltlich der Rückzahlung des Kapitals, der Zinsen und gegebenenfalls der vertraglich geschuldeten Gebühren durch letzteren gemäß den in diesem Vertrag und seinem Tilgungsplan vorgesehenen Bedingungen.",
    "échéances masquées dans l'aperçu": "Raten in der Vorschau ausgeblendet",
    "Compte FINTECHIA de l'emprunteur": "FINTECHIA-Konto des Kreditnehmers",
    "Sans garantie": "Ohne Garantie",
    "Durée du remboursement": "Rückzahlungsdauer",
    "mois": "Monate",
    "10 ans (Durée légale)": "10 Jahre (Gesetzliche Dauer)"
  },
  "da": {
    "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de prêt personnel, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.": "Formålet med denne kontrakt er at fastsætte betingelserne for, at långiver stiller et pengebeløb til rådighed for låntager som et personligt lån, med forbehold af sidstnævntes tilbagebetaling af hovedstolen, renterne og i givet fald de kontraktmæssigt gældende gebyrer i overensstemmelse med de vilkår, der er fastsat i denne kontrakt og dens tilbagebetalingsplan.",
    "échéances masquées dans l'aperçu": "afdrag skjult i forhåndsvisningen",
    "Compte FINTECHIA de l'emprunteur": "Låntagers FINTECHIA-konto",
    "Sans garantie": "Uden garanti",
    "Durée du remboursement": "Tilbagebetalingsperiode",
    "mois": "måneder",
    "10 ans (Durée légale)": "10 år (Lovmæssig varighed)"
  },
  "hu": {
    "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de prêt personnel, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.": "Jelen szerződés célja azon feltételek meghatározása, amelyek mellett a Kölcsönadó a Kölcsönvevő rendelkezésére bocsát egy pénzösszeget személyi kölcsönként, azzal a feltétellel, hogy utóbbi a tőkét, a kamatokat és adott esetben a szerződés szerint fizetendő díjakat a jelen Szerződésben és annak törlesztési tervében meghatározott feltételek szerint visszafizeti.",
    "échéances masquées dans l'aperçu": "az előnézetben elrejtett törlesztőrészletek",
    "Compte FINTECHIA de l'emprunteur": "A kölcsönvevő FINTECHIA számlája",
    "Sans garantie": "Garancia nélkül",
    "Durée du remboursement": "Visszafizetési időtartam",
    "mois": "hónap",
    "10 ans (Durée légale)": "10 év (Törvényes időtartam)"
  },
  "hr": {
    "Le présent Contrat a pour objet de définir les conditions dans lesquelles le Prêteur met à la disposition de l'Emprunteur une somme d'argent à titre de prêt personnel, à charge pour ce dernier de rembourser le capital, les intérêts et, le cas échéant, les frais contractuellement applicables selon les modalités prévues au présent Contrat et à son échéancier.": "Svrha ovog Ugovora je definirati uvjete pod kojima Zajmodavac stavlja Zajmoprimcu na raspolaganje novčani iznos kao osobni zajam, uz uvjet da potonji otplati glavnicu, kamate i, gdje je to primjenjivo, ugovorno primjenjive naknade u skladu s uvjetima predviđenim ovim Ugovorom i njegovim planom otplate.",
    "échéances masquées dans l'aperçu": "rate skrivene u pregledu",
    "Compte FINTECHIA de l'emprunteur": "Zajmoprimčev račun FINTECHIA",
    "Sans garantie": "Bez jamstva",
    "Durée du remboursement": "Razdoblje otplate",
    "mois": "mjeseci",
    "10 ans (Durée légale)": "10 godina (Zakonsko trajanje)"
  }
};

langs.forEach(lang => {
    const file = path.join(localesDir, `${lang}.json`);
    if (fs.existsSync(file)) {
        const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
        let updated = false;
        
        for (const [key, val] of Object.entries(newTranslations[lang])) {
            if (!dict[key]) {
                dict[key] = val;
                updated = true;
            } else {
                // Update translation just in case
                dict[key] = val;
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(file, JSON.stringify(dict, null, 2));
            console.log(`Updated ${lang}.json`);
        }
    }
});
