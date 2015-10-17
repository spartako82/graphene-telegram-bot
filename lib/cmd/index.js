var feed = require('./feed');
var slots = require('./slots');

exports.feed = feed.index;
exports.slots = slots.show;
exports.setslot = slots.set;
exports.rmslot = slots.rm;
