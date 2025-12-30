const fs = require('fs');
try {
    const content = fs.readFileSync('.env', 'utf8');
    fs.writeFileSync('env-output.txt', content);
    console.log('Env copied to env-output.txt');
} catch (e) {
    console.error(e);
}
