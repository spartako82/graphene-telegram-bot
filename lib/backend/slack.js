var async = require('async');
var Slack = require('slack-client');
var _ = require('underscore');
var _str = require('underscore.string');

exports.cmdWrapper = function(cmd){
  return function(bot,client,msg){
    var channel = bot.getChannelGroupOrDMByID(msg.channel);
    var args = msg.text.split(" ").slice(1);
    args = _.filter(args);
    cmd(client,args,msg.channel,function(err,res){
      if(err){
        channel.send(res || "Command error");
      }
      else{
        channel.send(res);
      }
    });
  };
};

exports.sendMessageWrapper = function(bot){
  return function(channelId,message,cb){
    var channel = bot.getChannelGroupOrDMByID(channelId);
    channel.send(message,function(){
      if(cb){
        cb();
      }
    });
  };
};

exports.exec = function(token,client,cmds){
  // Set cmd with telegram wrapper
  _.each(_.keys(cmds),function(c){
    cmds[c] = exports.cmdWrapper(cmds[c]);
  });

  var autoReconnect = true; // Automatically reconnect after an error response from Slack.
  var autoMark = true; // Automatically mark each message as read after it is processed.

  var bot = new Slack(token, autoReconnect, autoMark);

  var sendMessage = exports.sendMessageWrapper(bot);

  bot.on('message', function (msg) {
    var channel = bot.getChannelGroupOrDMByID(msg.channel);
    if(client){
      //console.log(msg)
      var cmd = msg.text.split(" ")[0];
      console.log(cmd);
      if(cmd in cmds){
        console.log("CMD",cmd);
        cmds[cmd](bot,client,msg);
      }
      else{
      }
    }
    else{
      sendMessage(msg.channel,"Error: no witness in sync available",function(){});
    }
  });

  bot.on('error', function (err) {
    console.log("ERROR",err);
  });

  bot.on('open',function(){
    console.log("OPEN");
  });

  bot.on('close',function(){
    console.log("CLOSE");
  });

  bot.login();

  return {
    setClient : function(_client){
      client = _client;
    },
    sendMessage : sendMessage,
  };
};
