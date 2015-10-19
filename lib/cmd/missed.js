var _ = require('underscore'),
_str = require('underscore.string'),
async = require('async');

var cmd = function(client,args,chatId,cb){
  var witness = "";
  if(args.length > 0){
    witness = args[0].toLowerCase();
  }
  if(witness){
    client.get_witness(witness,function(err,w){
      if(err){
        cb(false,"witness not found");
        return;
      }
      cb(false,witness+" missed blocks: "+w.total_missed);
    });
  }
  else{
    cb(false,"witness not found");
  }
};

exports.index = cmd;
