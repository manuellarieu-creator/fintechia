const fs = require('fs');

function removeMigration(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Some lines might have the // from the previous bad patch.
    // Let's just find the start of the block and the end.
    let startIndex = content.indexOf('// (async () => {');
    if (startIndex === -1) {
        startIndex = content.indexOf('(async () => {');
    }
    
    if (startIndex !== -1) {
        const matchStr = '})();';
        let endIndex = content.indexOf(matchStr, startIndex);
        if (endIndex !== -1) {
            endIndex += matchStr.length;
            // Remove the whole block
            content = content.substring(0, startIndex) + content.substring(endIndex);
            fs.writeFileSync(filePath, content);
            console.log('Removed migration block in ' + filePath);
        }
    }
}

removeMigration('c:/Users/ariol/.gemini/fintechia/backend/routes/auth.js');
removeMigration('c:/Users/ariol/.gemini/fintechia/backend/routes/admin.js');
