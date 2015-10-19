var _ = require('underscore'),
_str = require('underscore.string');

var cmd = function(client,args,chatId,cb){
  client.info(function(err,s){
    if(err){
      cb(false,"status error");
    }
    else{
      var status = _str.sprintf("Blocks: %d, Participation: %.2f%%, LastBlock: %s",
                                s.head_block_num,parseFloat(s.participation),s.head_block_age);
      cb(false,status);
    }
  });
};

exports.index = cmd;
