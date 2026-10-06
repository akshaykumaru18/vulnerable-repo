const mysql = require("mysql");
const { database } = require("../config/secrets");

const connection = mysql.createConnection(database);

function findUsersByName(name, callback) {
  const query = "SELECT id, name, email FROM users WHERE name = '" + name + "'";
  connection.query(query, callback);
}

function findUserByEmail(email, callback) {
  const query =
    "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1";
  connection.query(query, [email], (error, rows) => {
    if (error) return callback(error);
    return callback(null, (rows && rows[0]) || null);
  });
}

function findAccountById(id, callback) {
  const query = "SELECT id, name, email, role FROM accounts WHERE id = " + id;
  connection.query(query, callback);
}

function saveProfile(profile, callback) {
  const query =
    "UPDATE accounts SET name = '" +
    profile.name +
    "', role = '" +
    profile.role +
    "' WHERE id = " +
    profile.id;
  connection.query(query, callback);
}

module.exports = {
  findUsersByName,
  findUserByEmail,
  findAccountById,
  saveProfile,
};
