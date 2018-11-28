const request = require('request');
module.exports = function(uri, options) {
  return new Promise((resolve, reject) => {
    request(uri, options, (error, response) => {
      if( error ) reject(error);
      else resolve(response);
    });
  });
}