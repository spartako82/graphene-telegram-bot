var _ = require('underscore'),
_str = require('underscore.string');

var cmd = function(client,args,chatId,cb){
  var help = "\
Commands:\n\n\
/help\n\
/price [ASSET]\n\
/missed WITNESS\n\
/monitor WITNESS\n\
/stopmonitor WITNESS\n\
/listmonitor\n\
/status\n\
/feed [ASSET]\n\
/slots\n\
/setslot WITNESS min\n\
/rmslot WITNESS\
"
cb(false,help);
};

exports.index = cmd;
