const fs = require('fs');

function commentOutMigration(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the (async () => { ... })(); block with a commented version
    // We will find the start `(async () => {` and the corresponding end `})();`
    const startIndex = content.indexOf('(async () => {');
    if (startIndex !== -1) {
        // Find the matching end
        const matchStr = '})();';
        let endIndex = content.indexOf(matchStr, startIndex);
        if (endIndex !== -1) {
            endIndex += matchStr.length;
            const block = content.substring(startIndex, endIndex);
            const commentedBlock = block.split('\\n').map(line => '// ' + line).join('\\n');
            content = content.substring(0, startIndex) + commentedBlock + content.substring(endIndex);
            fs.writeFileSync(filePath, content);
            console.log('Patched migration in ' + filePath);
        }
    }
}

commentOutMigration('c:/Users/ariol/.gemini/fintechia/backend/routes/auth.js');
commentOutMigration('c:/Users/ariol/.gemini/fintechia/backend/routes/admin.js');
