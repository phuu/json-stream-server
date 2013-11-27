#!/usr/bin/env node

var argv = require('optimist').argv;
var through = require('through');
var split = require('split');
var http = require('http');
var express = require('express');

Object.values = function (o) {
  return Object.keys(o).map(function (k) {
    return o[k];
  });
};

var filterEmpty = function (f) { return !!f.length; };

var extractData = function (val) {
  return val.toString()
            .split('\n')
            .filter(filterEmpty)
};

var jsonParse = function (str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return '{}';
  }
};

var processLine = function (flanelOutput) {

  if (!flanelOutput.length) return;

  extractData(flanelOutput)
    .map(jsonParse)
    .forEach(function (data) {
      var msg = 'Updated';
      if (!files[data.name]) {
        msg = 'New';
      }
      files[data.name] = data;
      this.queue(msg + ' file: ' + data.name + '\n');
    }.bind(this));
};

/**
 * Data
 */
var files = {};

process.stdin
  .pipe(split())
  .pipe(through(processLine))
  .pipe(process.stdout);

/**
 * Server
 */

var app = express();

app.use(express.logger(':status :method :url (:response-time ms)'));
app.use(express.bodyParser());
app.use(app.router);

app.get('/', function (req, res) {
  res.jsonp(Object.values(files));
});

http
  .createServer(app)
  .listen(3456, function () {
    console.log('Server: http://localhost:%s', this.address().port);
  });