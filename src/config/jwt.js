const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT de acceso
 * @param {Object} payload - Datos a incluir en el token
 * @returns {String} Token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

/**
 * Genera un token JWT de refresco
 * @param {Object} payload - Datos a incluir en el token
 * @returns {String} Token JWT de refresco
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verifica un token JWT de acceso
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

/**
 * Verifica un token JWT de refresco
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Token de refresco inválido o expirado');
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
