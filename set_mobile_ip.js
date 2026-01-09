const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const mobileApiPath = path.join(__dirname, 'mobile-expo', 'src', 'utils', 'api.js');

console.log('--- Mobile App API URL Updater ---');
console.log('Current API file:', mobileApiPath);

if (!fs.existsSync(mobileApiPath)) {
    console.error('Error: mobile-expo/src/utils/api.js not found!');
    process.exit(1);
}

const currentContent = fs.readFileSync(mobileApiPath, 'utf8');
const urlMatch = currentContent.match(/const API_BASE_URL = '(.*?)';/);
if (urlMatch) {
    console.log(`Current URL: ${urlMatch[1]}`);
}

rl.question('Enter the new Ngrok URL (e.g., https://xxxx.ngrok-free.app): ', (url) => {
    if (!url) {
        console.log('No URL entered. Exiting.');
        rl.close();
        return;
    }

    // Remove trailing slash if present
    const cleanUrl = url.replace(/\/$/, '');

    // Ensure protocol
    const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;

    const newContent = currentContent.replace(
        /const API_BASE_URL = '.*?';/,
        `const API_BASE_URL = '${finalUrl}';`
    );

    fs.writeFileSync(mobileApiPath, newContent);
    console.log(`\nSuccess! Updated API URL to: ${finalUrl}`);
    console.log('You can now run "npx expo start --tunnel" in the mobile-expo folder.');

    rl.close();
});
