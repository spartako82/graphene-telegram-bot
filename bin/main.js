var async = require('async');
var TelegramBot = require('node-telegram-bot-api');
var graphene = require('node-graphene');
var _ = require('underscore');
var _str = require('underscore.string');
var fs = require('fs');
//var conf = require('./conf.json')
var conf = require('../conf/conf.json');
var lib = require('../lib')

console.log(conf);
var token = conf.token;

var checkClient = function(client,cb){
  if(client){
    try{
      client.info(function(err,s){
        if(err){
          cb(err,false);
        }
        else{
          var isRecent = false;
          isRecent = parseInt(s.head_block_age) < 60 && s.head_block_age.match("second");
          var inSync = isRecent && parseFloat(s.participation) >= 50;
          if(inSync){
            cb(false,true);
          }
          else{
            cb(new Error("Client not in sync"),false);
          }
        }
      });
    }
    catch(e){
      cb(e,false);
    }
  }
  else{
    cb(new Error("no client"),false);
  }
};

var getClientAndCheck = function(url,cb){
  graphene.wallet.createWalletClient(url,function(err,client){
    if(err){
      cb(err,null);
    }
    else{
      checkClient(client,function(err,check){
        if(check){
          cb(false,client,url);
        }
        else{
          cb(err,null);
          client.close();
        }
      });
    }
  });
};

var searchClient = function(urls,cb){
  var client = null;
  var idxUrl = 0;
  async.whilst(
    function(){ return (idxUrl<urls.length) && !client},
    function(_cb){
      var url = urls[idxUrl];
      getClientAndCheck(url,function(err,_client,url){
        if(_client){
          client = _client;
        }
        else{
          idxUrl++;
        }
        _cb();
      });
    },
    function(){
      if(client){
        cb(false,client,urls[idxUrl]);
      }
      else{
        cb(new Error("Client not found"),null);
      }
    });
};

var getClient = function(urls,currClient,cb){
  if(urls.length === 0){
    return cb(new Error("No urls"),null);
  }

  if(currClient){
    checkClient(currClient,function(err,check){
      if(check){
        console.log("Check",check);
        cb(false,currClient,true);
      }
      else{
        searchClient(urls,cb);
      }
    });
  }
  else{
    searchClient(urls,cb);
  }
};

var getParams = function(msg){
  var params = msg.text.split(" ");
  params = _.filter(params);
  return params.slice(1);
};

var getWitnessParam = function(msg){
  var params = getParams(msg);
  var witness = "";
  if(params.length > 0){
    if(params[0]){
      witness = params[0].toLowerCase();
    }
  }
  return witness;
};

var cmds = {
  "/feed" : lib.cmd.feed,
  "/price" : function(bot,client,msg){
    var asset = "USD";
    var params = getParams(msg);
    if(params.length > 0){
      if(params[0]){
        asset = params[0].toUpperCase();
      }
    }
    client.get_asset(asset,function(err,a){
      if(err){
        //console.log("Asset not found");
        bot.sendMessage(msg.chat.id,"Asset not found");
      }
      else{
        var prec = Math.pow(10,5-a.precision);
        var value = prec*a.options.core_exchange_rate.base.amount/a.options.core_exchange_rate.quote.amount;
        var res = _str.sprintf("%.8f",value);
        var resInv = _str.sprintf("%.2f",1/value);
        //console.log(res);
        bot.sendMessage(msg.chat.id,asset+"/BTS: "+res+"\nBTS/"+asset+": "+resInv);
      }
    })
  },
  "/missed" : function(bot,client,msg){
    var witness = getWitnessParam(msg);
    if(witness){
      client.get_witness(witness,function(err,w){
        if(err){
          //console.log("witness not found");
          bot.sendMessage(msg.chat.id,"witness not found");
        }
        else{
          console.log(w.total_missed);
          bot.sendMessage(msg.chat.id,"missed blocks "+witness+": "+w.total_missed);
        }
      })
    }
    else{
      //console.log("specify a witness");
      bot.sendMessage(msg.chat.id,"witness not found");
    }
  },
  "/monitor" : function(bot,client,msg){
    var witness = getWitnessParam(msg);
    //console.log(witness);
    if(witness){
      client.get_witness(witness,function(err,w){
        if(err){
          //console.log("witness not found");
          bot.sendMessage(msg.chat.id,"witness not found");
        }
        else{
          activeMonitor(witness,msg.chat.id);
          bot.sendMessage(msg.chat.id,"Start monitoring "+witness);
        }
      })
    }else{
      //console.console.log();("specify a witness");
      bot.sendMessage(msg.chat.id,"witness not found");
    }
  },
  "/listmonitor" : function(bot,client,msg){
    //console.log("/listmonitor");
    var monitors = _.filter(_.values(hMonitor),function(m){
      return (m.active === true) && (m.chatId === msg.chat.id);
    });
    if(monitors.length > 0){
      var res = "Monitor List:\n";
      res = _.reduce(monitors,function(s,w){
        return s+w.witness+"\n";
      },res);
      bot.sendMessage(msg.chat.id,res);
    }
    else{
      bot.sendMessage(msg.chat.id,"No witness is monitored");
    }
  },
  "/stopmonitor" : function(bot,client,msg){
    var witness = getWitnessParam(msg);
    if(witness){
      client.get_witness(witness,function(err,w){
        if(err){
          //console.log("witness not found");
          bot.sendMessage(msg.chat.id,"witness not found");
        }
        else{
          deactiveMonitor(witness,msg.chat.id);
          bot.sendMessage(msg.chat.id,"Stop monitor "+witness);
        }
      });
    }else{
      //console.console.log();("specify a witness");
      bot.sendMessage(msg.chat.id,"witness not found");
    }
  },
  "/status" : function(bot,client,msg){
    client.info(function(err,s){
      if(err){
        bot.sendMessage(msg.chat.id,"status error");
      }
      else{
        var status = _str.sprintf("Blocks: %d, Participation: %.2f%%, LastBlock: %s",
                                  s.head_block_num,parseFloat(s.participation),s.head_block_age);
        bot.sendMessage(msg.chat.id,status);
      }
    });
  },
  "/help" : function(bot,client,msg){
    bot.sendMessage(msg.chat.id,
                    "Commands:\n\n/help\n/price [ASSET]\n/missed WITNESS\n/monitor WITNESS\n/stopmonitor WITNESS\n/listmonitor\n/status\n/feed [ASSET]\n");
  },
};

var executeCmd = function(bot,client,msg){
  var cmd = msg.text.split(" ")[0];
  if(cmd in cmds){
    cmds[cmd](bot,client,msg);
  }
  else{
    //bot.sendMessage(msg.chat.id,cmd+": command not found");
  }
};

// var end = false;
// process.on( "SIGINT", function() {
//   console.log('CLOSING [SIGINT]');
//   end = true;
// } );

var hMonitor = {}; // "witness-chatId" : {lastMissed: 10,firstTime: true, active: true,witness:"spartako", chatId:"123"}
var activeMonitor = function(witness,chatId){
  var id = witness+chatId.toString();
  if(id in hMonitor){
    hMonitor[id].firstTime = true;
    hMonitor[id].active = true;
    hMonitor[id].chatId = chatId;
  }
  else{
    hMonitor[id] = {lastMissed:0, firstTime: true,active:true, witness:witness, chatId: chatId};
  }
  fs.writeFile("monitor.json",JSON.stringify(hMonitor),function(){});
};

var deactiveMonitor = function(witness,chatId){
  var id = witness+chatId.toString();
  if(id in hMonitor){
    hMonitor[id].active = false;
    fs.writeFile("monitor.json",JSON.stringify(hMonitor),function(){});
  }
};

var monitor = function(bot,client,cb){
  try{
    var monitors = _.filter(_.values(hMonitor),function(m){
      return m.active === true;
    });
    console.log(_.map(monitors,function(m){return m.witness+"-"+m.chatId}));
    async.eachSeries(monitors,function(m,_cb){
      if(m.firstTime){
        client.get_witness(m.witness,function(err,w){
          if(err){
            //bot.sendMessage(m.chatId,"Error found, monitor not active");
            //m.active = false;
          }
          else{
            m.lastMissed = w.total_missed;
            m.firstTime = false;
          }
          _cb();
        });
      }
      else{
        client.get_witness(m.witness,function(err,w){
          if(err){
            //bot.sendMessage(m.chatId,"Error found, monitor not active");
            //m.active = false;
          }
          else{
            if(w.total_missed != m.lastMissed){
              bot.sendMessage(m.chatId,"witness "+m.witness+" missed a new block (total missed "+w.total_missed+")");
            }
            m.lastMissed = w.total_missed;
          }
          _cb();
        });
      }
    },cb);
  }
  catch(e){
    cb(e);
  }
};

var checkClientAndUpdate = function(bot,client,cbUpdate){
  var isOk = true;
  async.whilst(
    function(){ return true},
    function(_cb){
      getClient(urls,client,function(err,_client,url){
        if(err){
          if(isOk){
            bot.sendMessage(conf.adminChatId,"No client founds!");
            isOk = false;
          }
        }
        else{
          if(isOk){
            cbUpdate(false,_client);
            console.log("URL",url);
          }
          else{
            cbUpdate(false,_client);
            console.log("URL",url);
            bot.sendMessage(conf.adminChatId,"Client found again");
            isOk = true;
          }
          client = _client;
        }
        setTimeout(_cb,1000);
      });
    },
    function(){
    });
};

// Load hMonitor file
if(fs.existsSync("monitor.json")){
  var monFile = JSON.parse(fs.readFileSync("monitor.json"));
  hMonitor = monFile;
}

var urls = [conf.url];
if(conf.backupUrls){
  urls = urls.concat(conf.backupUrls);
}

var client = null;

getClient(urls,client,function(err,_client,url){
  console.log("URL",url);
  client = _client;
  var bot = new TelegramBot(token, {polling: true});
  bot.on('text', function (msg) {
    if(client){
      console.log(msg)
      executeCmd(bot,client,msg);
      //bot.sendMessage(msg.chat.id,msg.text);
    }
    else{
      bot.sendMessage(msg.chat.id,"Error: no witness in sync available");
    }
  });
  // // Monitor procedure
  // monitor(bot,client);
  // check client procedure
  checkClientAndUpdate(bot,client,function(err,_client){
    client = _client;
  });

  // Monitor procedure
  async.whilst(
    function(){ return true},
    function(cb){
      monitor(bot,client,function(){
        setTimeout(cb,1000);
      });
    },function(){});
});
