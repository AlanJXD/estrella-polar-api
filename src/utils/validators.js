const { Decimal } = require('@prisma/client/runtime/library');

/**
 * Valida que un monto sea válido (>= 0 y con máximo 2 decimales)
 * @param {Number|String|Decimal} monto - Monto a validar
 * @returns {Boolean}
 */
const validarMonto = (monto) => {
  const valor = Number(monto);

  if (isNaN(valor) || valor < 0) {
    return false;
  }

  // Validar máximo 2 decimales
  const decimales = (valor.toString().split('.')[1] || '').length;
  return decimales <= 2;
};

/**
 * Valida que la suma de porcentajes sea 100
 * @param {Number} p1 - Porcentaje 1
 * @param {Number} p2 - Porcentaje 2
 * @param {Number} p3 - Porcentaje 3
 * @returns {Boolean}
 */
const validarPorcentajes = (p1, p2, p3) => {
  const suma = Number(p1) + Number(p2) + Number(p3);
  // Permitir margen de error de 0.01 por redondeos
  return Math.abs(suma - 100) < 0.01;
};

/**
 * Valida que el saldo sea suficiente para un retiro
 * @param {Number|String|Decimal} saldo - Saldo actual
 * @param {Number|String|Decimal} monto - Monto a retirar
 * @returns {Boolean}
 */
const validarSaldoSuficiente = (saldo, monto) => {
  return Number(saldo) >= Number(monto);
};

/**
 * Redondea un número a 2 decimales
 * @param {Number} numero - Número a redondear
 * @returns {Number}
 */
const redondearDosDecimales = (numero) => {
  return Math.round(Number(numero) * 100) / 100;
};

/**
 * Calcula la distribución de montos según porcentajes
 * @param {Number} montoTotal - Monto total a distribuir
 * @param {Number} porcentaje1 - Porcentaje 1
 * @param {Number} porcentaje2 - Porcentaje 2
 * @param {Number} porcentaje3 - Porcentaje 3
 * @returns {Object} { monto1, monto2, monto3 }
 */
const calcularDistribucion = (montoTotal, porcentaje1, porcentaje2, porcentaje3) => {
  const total = Number(montoTotal);

  const monto1 = redondearDosDecimales((total * Number(porcentaje1)) / 100);
  const monto2 = redondearDosDecimales((total * Number(porcentaje2)) / 100);
  const monto3 = redondearDosDecimales((total * Number(porcentaje3)) / 100);

  // Ajustar el último monto para evitar diferencias por redondeo
  const diferencia = redondearDosDecimales(total - (monto1 + monto2 + monto3));

  return {
    monto1,
    monto2,
    monto3: redondearDosDecimales(monto3 + diferencia),
  };
};

/**
 * Valida que una hora final sea mayor a una hora inicial
 * @param {String} horaInicial - Hora en formato HH:mm
 * @param {String} horaFinal - Hora en formato HH:mm
 * @returns {Boolean}
 */
const validarHoras = (horaInicial, horaFinal) => {
  return horaFinal > horaInicial;
};

module.exports = {
  validarMonto,
  validarPorcentajes,
  validarSaldoSuficiente,
  redondearDosDecimales,
  calcularDistribucion,
  validarHoras,
};
