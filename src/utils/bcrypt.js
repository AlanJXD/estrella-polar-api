const bcrypt = require('bcryptjs');

/**
 * Hashea una contraseña
 * @param {String} password - Contraseña en texto plano
 * @returns {Promise<String>} Hash de la contraseña
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Compara una contraseña con su hash
 * @param {String} password - Contraseña en texto plano
 * @param {String} hash - Hash almacenado
 * @returns {Promise<Boolean>} True si coinciden
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
