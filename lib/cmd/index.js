var feed = require('./feed');
var slots = require('./slots');
var locations = require('./locations');
var price = require('./price');
var missed = require('./missed');
var monitor = require('./monitor');
var status = require('./status');
var eta = require('./eta');
var help = require('./help');

exports.feed = feed.index;
exports.slots = slots;
exports.locations = locations;
exports.price = price.index;
exports.missed = missed.index;
exports.monitor = monitor;
exports.status = status.index;
exports.eta = eta.index;
exports.help = help.index;
