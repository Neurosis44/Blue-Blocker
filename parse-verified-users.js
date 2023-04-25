const fs = require('fs');
const rawVerifiedUsers = fs.readFileSync('./raw-verified-users.txt');

const list = rawVerifiedUsers.toString().split('\n').reduce((acc, user) => {
  acc[user.split(',')[0]] = user.split(',')[1]
  return acc;
}, {});

fs.writeFileSync('./legacy-verified-users.js', JSON.stringify(list, null, 2));