
const dns = require('dns');

console.log('Resolving api.manapool.io...');
dns.lookup('api.manapool.io', (err, address, family) => {
    if (err) {
        console.error('Lookup failed:', err.message);
    } else {
        console.log(`Success! Address: ${address}, Family: IPv${family}`);
    }
});

console.log('Resolving api.manapool.com...');
dns.lookup('api.manapool.com', (err, address, family) => {
    if (err) {
        console.error('Lookup failed api.manapool.com:', err.message);
    } else {
        console.log(`Success api.manapool.com! Address: ${address}`);
    }
});

console.log('Resolving manapool.io...');
dns.lookup('manapool.io', (err, address, family) => {
    if (err) {
        console.error('Lookup failed manapool.io:', err.message);
    } else {
        console.log(`Success manapool.io! Address: ${address}`);
    }
});
