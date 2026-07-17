const fs = require('fs');

function addFavicon(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('favicon.svg')) {
    let faviconTag = filePath.includes('index.html') ? '<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">' : '<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">';
    let newContent = content.replace(/<\/head>/i, '  ' + faviconTag + '\n</head>');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Added Favicon: ' + filePath);
    }
  }
}

function walk(dir) {
  let list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('.gemini')) {
      walk(file);
    } else if (file.endsWith('.html')) {
      addFavicon(file);
    }
  });
}

walk('.');
