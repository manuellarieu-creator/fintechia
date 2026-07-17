const fs = require('fs');

function replaceFavicon(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/<link rel=\"icon\"[^\>]+>/gi, '<link rel=\"icon\" type=\"image/svg+xml\" href=\"../assets/favicon.svg\">');
  
  if (filePath.includes('index.html')) {
    newContent = newContent.replace(/<link rel=\"icon\"[^\>]+>/gi, '<link rel=\"icon\" type=\"image/svg+xml\" href=\"./assets/favicon.svg\">');
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated Favicon: ' + filePath);
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
      replaceFavicon(file);
    }
  });
}

walk('.');
