var fs = require('fs');
var _ = require('underscore');
var _str = require('underscore.string');

// Load liquidity list
var hLiquidityList = {}; // {chatId:[{witness: <>,liquidity:<string>]}
var dataDir = "";

exports.init = function(_dataDir){
  dataDir = _dataDir;
  if(fs.existsSync(dataDir+"/liquidity.json")){
    var _hLiquidityList = JSON.parse(fs.readFileSync(dataDir+"/liquidity.json"));
    hLiquidityList = _hLiquidityList;
  }
};

exports.show = function(client,args,chatId,cb){
  var liquidityList = hLiquidityList[chatId] || [];
  var res = "WITNESS LIQUDITY:\n"
  res = _.reduce(liquidityList,function(tot,s){
    return tot + _str.sprintf("%s: %s\n",s.witness,s.liquidity);
  },res);
  cb(false,res);
};

exports.set = function(client,args,chatId,cb){
  if(args.length >= 2){
    var witness = args[0].toLowerCase();
    var liquidity = args.slice(1).join(" ");
    var liquidityList = hLiquidityList[chatId] || [];
    // Filter witness
    liquidityList = _.filter(liquidityList,function(o){
      return o.witness !== witness;
    });
    liquidityList.push({witness:witness, liquidity:liquidity});
    liquidityList = _.sortBy(liquidityList,function(s){
      return s.witness;
    });
    hLiquidityList[chatId] = liquidityList;
    console.log(dataDir,hLiquidityList);
    fs.writeFile(dataDir+"/liquidity.json",JSON.stringify(hLiquidityList),function(){});
    cb(false,_str.sprintf("Set %s: %s",witness,liquidity));
  }
  else{
    cb(false,_str.sprintf("/setliquidity WITNESS LIQUIDITY"));
  }
};

exports.rm = function(client,args,chatId,cb){
  if(args.length >= 1){
    var witness = args[0].toLowerCase();
    var liquidityList = hLiquidityList[chatId] || [];
    // check if already exists the witness
    var existsWit = _.find(liquidityList,function(s){
      return s.witness === witness;
    });
    if(existsWit){
      liquidityList = _.filter(liquidityList,function(s){
        return s.witness !== witness;
      });
      hLiquidityList[chatId] = liquidityList;
      fs.writeFile(dataDir+"/liquidity.json",JSON.stringify(hLiquidityList),function(){});
      cb(false,_str.sprintf("removed %s: %s",existsWit.witness,existsWit.liquidity));
    }
    else{
      cb(false,_str.sprintf("liquidity for witness %s not found",witness));
    }
  }
  else{
    cb(false,_str.sprintf("/rmliquidity WITNESS"));
  }
};
