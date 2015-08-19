var fs = require('fs');
var hyperquest = require('hyperquest');

var fileName = function (url) {
  return url.split('/').pop() || 'index.html';
};

var fileSize = function (name, callback) {
  fs.stat(name, function (err, stats) {
    if (!stats)
      return callback(0);

    return callback(stats.size);
  });
};

var badStatus = function (statusCode) {
  return Number(statusCode) >= 400;
};

var fileAppend = function (name, data) {
  fs.appendFile(name, data, function (err) {
    if (err) throw 'Cannot write ' + name;
  });
};

var handleData = function (currentSize, remainingSize, name) {
  var totalSize = currentSize + remainingSize;
  var accumulator = currentSize;
  return function (data) {
    accumulator += data.length;
    console.log(parseInt(accumulator / totalSize * 100) + '%');
    fileAppend(name, data);
  };
};

var handleResponse = function (size, name) {
  return function (res) {
    if (badStatus(res.statusCode)) throw res.statusMessage;
    var remainingSize = Number(res.headers['content-length']);
    res.on('data', handleData(size, remainingSize, name));
  };
};

var request = function (url, name) {
  return function (size) {
    var req = hyperquest(url);
    req.setHeader('Range', 'bytes=' + size + '-');
    req.on('response', handleResponse(size, name));
  };
};

var get = function (url) {
  var name = fileName(url);
  fileSize(name, request(url, name));
};
