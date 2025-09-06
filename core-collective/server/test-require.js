console.log("Starting require test...");
try {
  const ctrl = require("./controller/privateController");
  console.log("Require successful, exports:", Object.keys(ctrl));
  console.log("Controller object:", ctrl);
} catch (e) {
  console.error("Error during require:", e.message);
  console.error("Stack:", e.stack);
}
