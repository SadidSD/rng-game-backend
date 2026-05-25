const bcrypt = require('bcrypt');

async function checkPassword() {
  const hash = '$2b$10$r.PfK3NxM9fPKKI/cznSx.G4MiClMe4bvqJB1KjktvJoXwesH8iSi';
  const match = await bcrypt.compare('password123', hash);
  console.log("Does password123 match? ", match);
}

checkPassword();
