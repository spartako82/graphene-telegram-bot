var async = require('async');
var fs = require('fs');
var _ = require('underscore');
var _str = require('underscore.string');

// Load slot list
var hMonitor = {}; // "witness-chatId" : {lastMissed: 10,firstTime: true, active: true,witness:"spartako", chatId:"123"}
var dataDir = ""

exports.init = function(_dataDir){
  dataDir = _dataDir;
  // Load hMonitor file
  if(fs.existsSync(dataDir+"/monitor.json")){
    var monFile = JSON.parse(fs.readFileSync(dataDir+"/monitor.json"));
    hMonitor = monFile;
  }
};

var activeMonitor = function(witness,chatId){
  var id = witness+chatId.toString();
  if(id in hMonitor){
    hMonitor[id].firstTime = true;
    hMonitor[id].active = true;
    hMonitor[id].chatId = chatId.toString();
  }
  else{
    hMonitor[id] = {lastMissed:0, firstTime: true,active:true, witness:witness, chatId: chatId};
  }
  fs.writeFile(dataDir+"/monitor.json",JSON.stringify(hMonitor),function(){});
};

var deactiveMonitor = function(witness,chatId){
  var id = witness+chatId.toString();
  if(id in hMonitor){
    delete hMonitor[id];
    fs.writeFile(dataDir+"/monitor.json",JSON.stringify(hMonitor),function(){});
  }
};

// *sendMessage -> function(chatId,message,cb)
exports.notify = function(client,sendMessage,cb){
  try{
    var monitors = _.filter(_.values(hMonitor),function(m){
      return m.active === true;
    });
    console.log(_.map(monitors,function(m){return m.witness+"-"+m.chatId}));
    async.eachSeries(monitors,function(m,_cb){
      if(m.firstTime){
        client.get_witness(m.witness,function(err,w){
          if(err){
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
          }
          else{
            if(w.total_missed != m.lastMissed){
              sendMessage(m.chatId.toString(),"witness "+m.witness+" missed a new block (total missed "+w.total_missed+")",function(){});
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

exports.add = function(client,args,chatId,cb){
  var witness = "";
  if(args.length > 0){
    witness = args[0].toLowerCase();
  }
  //console.log(witness);
  if(witness){
    client.get_witness(witness,function(err,w){
      if(err){
        cb(false,"witness not found");
      }
      else{
        activeMonitor(witness,chatId);
        cb(false,"Start monitoring "+witness);
      }
    })
  }else{
    cb(false,"witness not found");
  }
};

exports.list = function(client,args,chatId,cb){
  var monitors = _.filter(_.values(hMonitor),function(m){
    return (m.active === true) && (m.chatId.toString() === chatId.toString());
  });
  if(monitors.length > 0){
    var res = "Monitor List:\n";
    res = _.reduce(monitors,function(s,w){
      return s+w.witness+"\n";
    },res);
    cb(false,res);
  }
  else{
    cb(false,"No witness is monitored");
  }
};

exports.rm = function(client,args,chatId,cb){
  var witness = "";
  if(args.length > 0){
    witness = args[0].toLowerCase();
  }
  if(witness){
    client.get_witness(witness,function(err,w){
      if(err){
        cb(false,"witness not found");
      }
      else{
        deactiveMonitor(witness,chatId);
        cb(false,"Stop monitor "+witness);
      }
    });
  }else{
    cb(false,"witness not found");
  }
};
