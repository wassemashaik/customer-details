const db = require("./db");

function checkCustomerExists(customerId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id FROM customers WHERE id = ?`;
    db.get(sql, [customerId], (err, customer) => {
      if (err) {
        return reject(err);
      }
      if (!customer) return resolve(false);
      resolve(true);
    });
  });
}

module.exports = { checkCustomerExists };
