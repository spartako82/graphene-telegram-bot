var async = require('async');
var _ = require('underscore');
var _str = require('underscore.string');
var conf = require('../conf/conf.json');
var lib = require('../lib');

console.log(conf);

var cmds = {
  "/feed" : lib.cmd.feed,
  "/slots" : lib.cmd.slots.show,
  "/setslot" : lib.cmd.slots.set,
  "/rmslot" : lib.cmd.slots.rm,
  "/price" : lib.cmd.price,
  "/missed" : lib.cmd.missed,
  "/monitor" : lib.cmd.monitor.add,
  "/listmonitor" : lib.cmd.monitor.list,
  "/stopmonitor" : lib.cmd.monitor.rm,
  "/status" : lib.cmd.status,
  "/help" : lib.cmd.help,
};

var urls = [conf.url];
if(conf.backupUrls){
  urls = urls.concat(conf.backupUrls);
}

var client = null;
var exec = lib.backend.telegram.exec;

lib.wallet.getClient(urls,client,function(err,_client,url){
  console.log("URL",url);
  client = _client;

  var back = exec(conf.token,client,cmds);

  lib.wallet.checkClientAndUpdate(client,urls,back.sendMessage,function(err,_client){
    client = _client;
    back.setClient(client);
  });

  // Monitor procedure
  async.whilst(
    function(){ return true},
    function(cb){
      lib.cmd.monitor.notify(client,back.sendMessage,function(){
        setTimeout(cb,1000);
      });
    },function(){});
});
