var _ = require('underscore'),
_str = require('underscore.string'),
moment = require('moment'),
async = require('async');

var cmd = function(client,args,cb){
  var asset = "USD";
  if(args.length > 0){
    asset = args[0].toUpperCase();
  }
  client.get_asset(asset,function(err,_a){
    if(err){return cb(err);}
    var prec = Math.pow(10,5-_a.precision);
    client.get_bitasset_data(asset,function(err,a){
      if(err){return cb(err);}
      var feeds = a.feeds;
      var now = new Date();
      var feeds = async.map(feeds, function(accs,_cb){
        client.get_account(accs[0],function(err,a){
          if(err){return _cb(err)};
          var date = new Date(accs[1][0]);
          var delta = moment(now).diff(moment(date),"minutes");
          var core_exchange_rate = accs[1][1].core_exchange_rate;
          var value = prec*core_exchange_rate.base.amount/core_exchange_rate.quote.amount;
          var res = _str.sprintf("%.8f",value);
          var resInv = _str.sprintf("%.2f",1/value);
          _cb(false,{account:a.name, date:date, delta:delta, res:res, resInv:resInv});
        });
      },function(err, feeds){
        if(err){return cb(err)};
        feeds = _.sortBy(feeds,function(f){
          return -f.date;
        });
        var res = "FEED "+asset+":\n";
        res = _.reduce(feeds,function(s,f){
          return s+_str.sprintf("%s min: %-4d %s\n",f.res,f.delta,f.account);
        },res);
        cb(false,res);
      });
    });
  });
};

exports.index = function(bot,client,msg){
  var args = msg.text.split(" ").slice(1);
  cmd(client,args,function(err,res){
    if(err){
      bot.sendMessage(msg.chat.id,"Asset not found");
    }
    else{
      bot.sendMessage(msg.chat.id,res);
    }
  });
};
