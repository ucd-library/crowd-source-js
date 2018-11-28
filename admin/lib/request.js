const request = require('request');
const config = require('../config');

module.exports = function(uri, options={}) {
  if( config.verbose ) {
    console.log('HTTP Request: ', uri);
    console.log('HTTP Options: ', options);
  }

  return new Promise((resolve, reject) => {
    request(uri, options, (error, response) => {
      if( config.verbose ) {
        console.log('HTTP Response Status: ', response.statusCode);
      }
      
      if( error ) reject(error);
      else resolve(response);
    });
  });
}