var _ = require('underscore'),
_str = require('underscore.string'),
moment = require('moment'),
async = require('async');

var cmd = function(client,args,chatId,cb){
  var asset = "USD";
  if(args.length > 0){
    asset = args[0].toUpperCase();
  }
  client.info(function(err,info){
    if(err){return cb(err,"client error");}
    async.map(info.active_witnesses, function(w,_cb){
      client.get_witness(w,function(err,w1){
        if(err){return _cb(err,"client error");}
        _cb(false,w1.witness_account);
      });
    },function(err,active_witnesses){
      info.active_witnesses = active_witnesses;
      if(err){return cb(err,"client error");}
      client.get_asset(asset,function(err,_a){
        if(err){return cb(err,"Asset not found");}
        var prec = Math.pow(10,5-_a.precision);
        client.get_bitasset_data(asset,function(err,a){
          if(err){return cb(err,"Asset not found");}
          var settlement_price = a.current_feed.settlement_price;
          var value = prec*settlement_price.base.amount/settlement_price.quote.amount;
          var resInvTot = _str.sprintf("%.2f",1/value);
          var feeds = a.feeds;
          var now = new Date();
          feeds = _.filter(feeds,function(accs){
            return _.find(info.active_witnesses,function(i){
              //console.log(accs[0],i);
              return accs[0] == i;
            });
          });
          feeds = async.map(feeds, function(accs,_cb){
            client.get_account(accs[0],function(err,a){
              if(err){return _cb(err,"account not found")};
              var date = new Date(accs[1][0]);
              var delta = moment(now).diff(moment(date),"minutes");
              var settlement_price = accs[1][1].settlement_price;
              var value = prec*settlement_price.base.amount/settlement_price.quote.amount;
              var res = _str.sprintf("%.8f",value);
              var resInv = _str.sprintf("%.2f",1/value);
              var mssr = accs[1][1].maximum_short_squeeze_ratio;
              _cb(false,{account:a.name, date:date, delta:delta, res:res, resInv:resInv, mssr:mssr});
            });
          },function(err, feeds){
            if(err){return cb(err,feeds)};
            feeds = _.sortBy(feeds,function(f){
              return -f.date;
            });
            var res = _str.sprintf("FEED %s: %s mssr: %d\n",asset,resInvTot,a.current_feed.maximum_short_squeeze_ratio);
            res = _.reduce(feeds,function(s,f){
              return s+_str.sprintf("%s min: %-4d mssr: %d %s\n",f.resInv,f.delta,f.mssr,f.account);
            },res);
            cb(false,res);
          });
        });
      });
    });
  });
};

exports.index = cmd;
