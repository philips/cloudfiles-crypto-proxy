#!/usr/bin/env node
var _ = require('underscore');
var http = require('http');
var url = require('url');
var path = require('path');
var request = require('request');
var fs = require('fs');

var cryptostream = require('cryptostream');

var argv = require('optimist')
    .usage('Usage: $0 -c <config>')
    .alias('c', 'config')
    .alias('p', 'port')
    .default('c', 'config.json')
    .default('p', 3000)
    .argv;

var config_file = path.join(__dirname, '..', argv.c),
    config = JSON.parse(fs.readFileSync(config_file).toString());

var key = config.crypto.privateKey;

http.createServer(function (req, resp) {
  var req_url = url.parse(req.url);
  var rp = req_url.path.split('/');
  var version = rp[1], account = rp[2], container = rp[3], object = rp[4];

  console.log(req.method + ": " + req.url);

  /* cleanup headers for proxying */
  var headers = _.clone(req.headers);
  delete(headers['content-length']);
  headers['content-type'] = 'application/octet-stream';

  if (req.method === 'PUT' && object !== undefined) {
    console.log('headers: ' + headers['content-length']);

    var x = request(req.url, {headers: headers, method: 'PUT'});
    var e = new cryptostream.EncryptStream(key);

    req.addListener('data', function(chunk) {
      e.write(chunk, 'binary');
    });
    req.addListener('end', function() {
      e.end();
    });

    e.addListener('data', function(chunk) {
      x.write(chunk, 'binary');
    });
    e.addListener('end', function() {
      x.end();
    });

    x.addListener('response', function (xresp) {
      xresp.addListener('data', function(chunk) {
        resp.write(chunk, 'binary');
      });
      xresp.addListener('end', function() {
        resp.end();
      });
      resp.writeHead(xresp.statusCode, headers);
    });

  } else if (req.method === 'GET' && object !== undefined) {
    var x = request(req.url, {headers: headers, method: 'GET'});
    var d = new cryptostream.DecryptStream(key);

    req.addListener('data', function(chunk) {
      x.write(chunk);
    });
    req.addListener('end', function() {
      x.end();
    });

    x.addListener('response', function (xresp) {
      xresp.addListener('data', function(chunk) {
        d.write(chunk, 'binary');
      });
      xresp.addListener('end', function() {
        d.end();
      });
      var headers = _.clone(xresp.headers);
      delete(headers['content-length']);
      headers['content-type'] = 'application/octet-stream';
      resp.writeHead(xresp.statusCode, headers);
    });

    d.addListener('data', function(chunk) {
      resp.write(chunk);
    });
    d.addListener('end', function() {
      resp.end();
    });

  } else {
    req.pipe(request(req.url)).pipe(resp)
  }
}).listen(argv.p);
