var async = require('async');
var graphene = require('node-graphene');
var _ = require('underscore');
var _str = require('underscore.string');

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
exports.getClient = getClient;

exports.checkClientAndUpdate = function(client,urls,sendMessage,cbUpdate){
  var isOk = true;
  async.whilst(
    function(){ return true},
    function(_cb){
      getClient(urls,client,function(err,_client,url){
        if(err){
          if(isOk){
            // TODO: send notification
            //sendMessage("","No client founds!",function(){});
            console.log("No client founds!");
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
            //sendMessage("","Client found again",function(){});
            console.log("Client found again");
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
