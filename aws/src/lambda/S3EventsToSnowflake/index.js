
const jwt = require('jwt-simple');
const http = require('http');
const https= require('https');
const url = require('url');
const AWS = require('aws-sdk');

function generateToken(cert, iss, sub) {
  const lic = {
    iss, sub,
    iat: Math.floor(Date.now()/1000),
    exp: Math.floor(Date.now()/1000) + 3600,
  };
  const token = jwt.encode(lic, cert, 'RS256');
  return { token }
}

function processResponse(res){
  res.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    let rawData = '';
    res.on('error', reject);
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        resolve(JSON.parse(rawData));
      } catch (e) {
        reject(e);
      }
    });
  })
}

function post(token, ssl, host, port, path, body) {
  const headers = {};
  if(token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const postData = JSON.stringify(body);
  headers['Content-Length'] = postData.length;
  headers['Content-Type'] = 'application/json';
  return new Promise((resolve, reject) => {
    const req = ((ssl ? https : http)).request({
      host: host,
      port: port,
      method: 'POST',
      path,
      headers,
      rejectUnauthorized: false,
      agent: false
    }, (resp) => {
      if(resp.statusCode >= 200 && resp.statusCode < 300) {
        resolve(processResponse(resp));
      } else {
        const error = new Error(`Received status code=${resp.statusCode}, method=POST, path=${path}`);
        error.statusCode = resp.statusCode;
        resp.on('data', d => console.log(d.toString()))
        reject(error);
      }
    })
    .on('error', (error) => {
      reject(error);
    });
    req.end(postData);
  });
}

const account = process.env.ACCOUNT.trim();
const user = process.env.USER.trim();
const fqPipe = process.env.FQ_PIPE.trim();
const fingerprint = process.env.KEY_FINGERPRINT.trim();
const fqUser = `${account.toUpperCase()}.${user.toUpperCase()}`;


exports.handler = (event, context, callback) => {
  if (!Array.isArray(event.Records) || event.Records.length === 0) {
    console.log('Missing or empty event.Records, exiting ...');
    callback();
    return;
  }
  
  const files = event.Records.filter(r => r.eventName.startsWith('ObjectCreated:'))
    .map(r => ({path: decodeURIComponent(r.s3.object.key.replace(/\+/g, ' '))}));

  if(files.length) {
    const s3 = new AWS.S3();
    const pkUrl = new url.URL(process.env.PRIVATE_KEY.trim());
    // get private key first 
    s3.getObject({ Bucket: pkUrl.host, Key: pkUrl.pathname.substr(1) }).promise()
      .then(resp => resp.Body)
      .then(privKey => generateToken(privKey.toString(), `${fqUser}.${fingerprint}`, fqUser))
      .then(token => {
        return post(token.token, true, `${account}.snowflakecomputing.com`, 443, `/v1/data/pipes/${fqPipe}/insertFiles`, {files})
          .then(resp => {
            console.log(`Successfully posted count=${files.length}, first=${files[0]}`);
            console.log(resp);
            callback();
          })
      })
      .catch(err =>{
        console.log(err);
        callback();
      })
} else {
    console.log('no object create events ...');
    callback();
  }
};