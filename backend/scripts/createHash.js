const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "Admin@123";
  const hash = await bcrypt.hash(password, 12);

  console.log("\nYour password is:");
  console.log(password);

  console.log("\nYour bcrypt hash is:");
  console.log(hash);
}

generateHash();