var _ = require('underscore'),
_str = require('underscore.string');

var cmd = function(prefix){
  return function(client,args,chatId,cb){
    var listCmd = [
      "help",
      "price [ASSET]",
      "missed WITNESS",
      "monitor WITNESS",
      "listmonitor WITNESS",
      "status",
      "feed [ASSET]",
      "slots",
      "setslot WITNESS MIN",
      "rmslot WITNESS",
      "locations",
      "setlocation WITNESS LOCATION HOSTING",
      "rmlocation WITNESS"
    ];
    var str = "Commands:\n\n";
    str = _.reduce(listCmd,function(s,c){
      return s+prefix+c+"\n";
    },str);
    cb(false,str);
  };
};

exports.index = cmd;
