var async = require('async');
var TelegramBot = require('node-telegram-bot-api');
var _ = require('underscore');
var _str = require('underscore.string');

exports.cmdWrapper = function(cmd){
  return function(bot,client,msg){
    var args = msg.text.split(" ").slice(1);
    args = _.filter(args);
    cmd(client,args,msg.chat.id.toString(),function(err,res){
      if(err){
        bot.sendMessage(msg.chat.id,res || "Command error");
      }
      else{
        bot.sendMessage(msg.chat.id,res);
      }
    });
  };
};

exports.sendMessageWrapper = function(bot){
  return function(chatId,message,cb){
    bot.sendMessage(chatId,message).then(function(){
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

  var bot = new TelegramBot(token, {polling: true});
  var sendMessage = exports.sendMessageWrapper(bot);

  bot.on('text', function (msg) {
    if(client){
      console.log(msg)
      var cmd = msg.text.split(" ")[0];
      console.log("CMD",cmd);
      if(cmd in cmds){
	try{
            cmds[cmd](bot,client,msg);
	}
	catch(e){
	    console.log(e);
	}
      }
      else{
        //bot.sendMessage(msg.chat.id,cmd+": command not found");
      }
    }
    else{
      sendMessage(msg.chat.id,"Error: no witness in sync available",function(){});
    }
  });

  return {
    setClient : function(_client){
      client = _client;
    },
    sendMessage : sendMessage,
  };
};
