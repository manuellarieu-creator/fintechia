# TODO: Bugs persistants

- **Contrat - Bug UI Mode de signature**: Le basculement entre la "Signature électronique" et "Imprimer le contrat" sur l'étape 4 ne cache pas correctement la section Code PIN pour certains utilisateurs (le cache navigateur ou un conflit DOM empêche le `onchange` ou le `style.display='none'` de s'appliquer visuellement malgré le renommage du fichier JS). À investiguer plus en profondeur en analysant la console du navigateur client.
