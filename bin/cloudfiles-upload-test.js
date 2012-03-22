#!/usr/bin/env node

var cloudfiles = require('cloudfiles');
var fs = require('fs');
var path = require('path');
var crypto  = require('crypto');
var Buffer = require('buffer').Buffer;

var argv = require('optimist')
    .usage('Usage: $0 -f <file> -c')
    .alias('p', 'proxy')
    .alias('f', 'file')
    .alias('u', 'user')
    .alias('c', 'container')
    .alias('k', 'apikey')
    .default('c', 'node-crypto-proxy-test')
    .default('p', 'http://localhost:3000')
    .demand(['f', 'u', 'k', 'p'])
    .argv;

var filename = path.basename(argv.f)

var cf_client = cloudfiles.createClient({
  auth: {username: argv.u, apiKey: argv.k},
  proxy: argv.p
});

var handle_error = function(err) {
  console.log("error: " + err);
  return err;
};

var container_save_get = function(cf_client) {
  cf_client.createContainer(argv.c, function(err, container) {
    if (err) return handle_error(err);

    var gotFile = function(err, file) {
      console.log("file: " + file.local);
      var ct = fs.readFileSync(file.local).toString();
      console.log("cloudfiles clear: " + ct);
    };

    var addedFile = function(err, uploaded) {
      if (err) return handle_error(err);
      console.log(uploaded);
      cf_client.getFile(argv.c, filename, gotFile);
    };

    console.log(argv.f);
    cf_client.addFile(argv.c, { remote: filename, local: argv.f }, addedFile);
  });
}

cf_client.setAuth(function(err, res, config) {
  console.log(config);
  if (config.authorized == false) {
    console.log("Not authorized!")
    return;
  }

  container_save_get(cf_client);
});
