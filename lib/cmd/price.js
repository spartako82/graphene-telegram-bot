var _ = require('underscore'),
_str = require('underscore.string');

var cmd = function(client,args,chatId,cb){
  var asset = "USD";
  if(args.length > 0){
    if(args[0]){
      asset = args[0].toUpperCase();
    }
  }
  client.get_asset(asset,function(err,a){
    if(err){
      cb(false,"Asset not found");
      return;
    }
    client.get_bitasset_data(asset,function(err,ba){
      if(err){
        cb(false,"Asset not found");
        return;
      }
      var prec = Math.pow(10,5-a.precision);
      var price = ba.current_feed.settlement_price;
      var value = prec*price.base.amount/price.quote.amount;
      var res = _str.sprintf("%.8f",value);
      var resInv = _str.sprintf("%.2f",1/value);
      cb(false,asset+"/BTS: "+res+"\nBTS/"+asset+": "+resInv);
    });
  });
};

exports.index = cmd;
