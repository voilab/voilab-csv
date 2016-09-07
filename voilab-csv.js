/*jslint node: true, unparam: true, nomen: true */
(function () {
    'use strict';

    var service = {

        /**
         * This method returns an express middleware.
         *
         * @param {String} srcFieldname Uploaded CSV file stands in this req property.
         * @param {String} destFieldname Parsed CSV flow will be stored in req.body object with [fieldname] key.
         * @param {Object} [csvOptions] CSV parsing options
         * @returns {Function}
         */
        parse: function (srcFieldname, destFieldname, csvOptions) {
            var streamifier = require("streamifier"),
                csv = require("csv-streamify"),
                lodash = require('lodash'),
                newlinepoint = require('voilab-newlinepoint');

            return function (req, res, next) {
                var parser = csv(lodash.merge({delimiter: ';', objectMode: true, columns: true}, (csvOptions || {}))),
                    readableStream,
                    convert = newlinepoint('\n');

                if (!req[srcFieldname]) {
                    return next();
                }

                readableStream = streamifier.createReadStream(req[srcFieldname].buffer);
                req.body[destFieldname] = [];

                parser.on('readable', function () {
                    var line = parser.read();
                    req.body[destFieldname].push(line);
                }).on('end', function () {
                    return next();
                });

                // Parse CSV as Object
                readableStream.pipe(convert).pipe(parser);
            };
        },

        parseFromFile: function (filepath, csvOptions, callback) {
            var fs = require('fs'),
                streamifier = require("streamifier"),
                csv = require("csv-streamify"),
                lodash = require('lodash'),
                newlinepoint = require('voilab-newlinepoint'),
                convert = newlinepoint('\n');

            fs.readFile(filepath, function (err, content) {
                var formatted = [],
                    parser = csv(lodash.merge({delimiter: ';', objectMode: true, columns: true}, (csvOptions || {}))),
                    readableStream = streamifier.createReadStream(content);

                parser.on('readable', function () {
                    var line = parser.read();
                    formatted.push(line);
                }).on('end', function () {
                    return callback(null, formatted);
                });

                // Parse CSV as Object
                readableStream.pipe(convert).pipe(parser);
            });
        }
    };

    module.exports = service;
}());