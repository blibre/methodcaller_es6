const sha1 = require('sha1');
const md5 = require('md5');
const request = require('request');

const mc_url = process.env.METHOD_CALLER_URL;
const sign = process.env.METHOD_CALLER_SIGN;

if (!mc_url) {
  throw "Es necesario definir la url para el method caller en la variable de entorno METHOD_CALLER_URL";
}

if (!sign) {
  throw "Es necesario definir el hash de identificacion para el method caller en la variable de entorno METHOD_CALLER_SIGN";
}

let call = (method, args) => {

  return new Promise( async (resolve, reject) => {

    if ( !method.includes("_") ) {
      throw "Formato de funcion inválido";
    }

    let data = {
      method: method.replace('_', ':'),
      user: 0,
      params: {},
    };

    data.signature = data.method;
    data.signature += data.user;
    data.signature += sha1( md5(sign) );

    data.signature = sha1(data.signature);

    if (args.length > 2) {
      throw "Se admiten solo 2 argumentos para la función";
    }

    if (args.length >= 1) {
      data.params = args[0];
    } else {
      data.params = ['dummy'];
    }

    let params = {
      request: JSON.stringify(data),
    };

    request.post({url: mc_url, form: params, json: true}, (e, response, body) => {

      if (typeof body !== "object") {
        reject(new Error("Bad Response: " + body));
      }

      if (!body || body.success <= 0) {
        reject(new Error((body && body.message) || 'Unkown Error'));
      }

      resolve( (body && body.response) || {} );
    });

  });
}

let handler = {
  get(target, prop_key, receiver) {
    return (...args) => call(prop_key, args);
  }
};

module.exports = new Proxy({}, handler);
