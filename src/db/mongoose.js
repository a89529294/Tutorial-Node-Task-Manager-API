const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_URL);
  } catch (err) {
    console.log(err);
  }
}

main();
