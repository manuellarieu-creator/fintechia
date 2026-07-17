const fs = require('fs');

function injectScript(file, scriptTag) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('chat-widget.js')) {
    c = c.replace('</body>', `  ${scriptTag}\n</body>`);
    fs.writeFileSync(file, c, 'utf8');
    console.log('Injected ' + file);
  }
}

injectScript('./frontend/pages/index.html', '<script src="./assets/js/chat-widget.js"></script>');
injectScript('./frontend/pages/app.html', '<script src="../assets/js/chat-widget.js"></script>');
injectScript('./frontend/pages/admin-dashboard.html', '<script src="../assets/js/chat-widget.js"></script>');
injectScript('./frontend/pages/cgu.html', '<script src="../assets/js/chat-widget.js"></script>');
injectScript('./frontend/pages/confidentialite.html', '<script src="../assets/js/chat-widget.js"></script>');
