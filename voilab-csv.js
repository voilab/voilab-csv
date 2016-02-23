/*jslint node: true, unparam: true, nomen: true */
(function () {
    'use strict';

    /**
     * This method returns an express middleware.
     *
     * @prerequisite Another middleware must have fulfilled req.file property with uploaded CSV file.
     * @param {String} fieldname Parsed CSV flow will be stored in req object with [fieldname] key.
     * @param {Object} [csvOptions] CSV parsing options
     * @returns {Function}
     */
    var parse = function (fieldname, csvOptions) {
        var streamifier = require("streamifier"),
            csv = require("csv-streamify"),
            lodash = require('lodash'),
            newlinepoint = require('newlinepoint');

        return function (req, res, next) {
            var parser = csv(lodash.merge({delimiter: ';', objectMode: true, columns: true}, (csvOptions || {}))),
                readableStream,
                convert = newlinepoint('\n');

            if (!req.file) {
                return next();
            }

            readableStream = streamifier.createReadStream(req.file.buffer);
            req.body[fieldname] = [];

            parser.on('readable', function () {
                var line = parser.read();
                req.body[fieldname].push(line);
            }).on('end', function () {
                return next();
            });

            // Parse CSV as Object
            readableStream.pipe(convert).pipe(parser);
        };
    };

    module.exports = parse;
}());