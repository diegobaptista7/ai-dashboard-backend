const fs = require('fs');
const content = fs.readFileSync('vercel_debug.txt', 'utf8');
const urls = content.match(/https:\/\/[^\s]+\.vercel\.app/g);
if (urls) {
    console.log([...new Set(urls)].join('\n'));
} else {
    console.log('No URLs found');
}
