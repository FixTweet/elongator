import fs from 'fs';

const credentials = JSON.parse(fs.readFileSync('credentials.complete.json', 'utf8')).accounts;

// Remove all values except username, authToken, and csrfToken
const strippedCredentials = credentials.map(cred => ({
  username: cred.username,
  authToken: cred.authToken,
  csrfToken: cred.csrfToken
}));

fs.writeFileSync('credentials.json', JSON.stringify({ accounts: strippedCredentials }, null, 2));

