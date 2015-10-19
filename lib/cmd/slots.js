var fs = require('fs');
var _ = require('underscore');
var _str = require('underscore.string');

// Load slot list
var hSlotList = {}; // {chatId:[{witness: <>,min:<int>]}
var dataDir = "";

exports.init = function(_dataDir){
  dataDir = _dataDir;
  if(fs.existsSync(dataDir+"/slots.json")){
    var _hSlotList = JSON.parse(fs.readFileSync(dataDir+"/slots.json"));
    hSlotList = _hSlotList;
  }
};

exports.show = function(client,args,chatId,cb){
  var slotList = hSlotList[chatId] || [];
  var res = "SLOTS:\n"
  res = _.reduce(slotList,function(tot,s){
    return tot + _str.sprintf("%-d %s\n",s.min,s.witness);
  },res);
  cb(false,res);
};

exports.set = function(client,args,chatId,cb){
  if(args.length >= 2){
    var witness = args[0].toLowerCase();
    var min = parseInt(args[1],10);
    var slotList = hSlotList[chatId] || [];
    if(min < 0 || min >= 60){
      cb(false,"Min should be between 0 and 60");
      return;
    }
    // check if already exists at the same min
    var existsMin = _.find(slotList,function(s){
      return s.min === min;
    });
    if(existsMin){
      cb(false,_str.sprintf("min %-2d already taken by %s",existsMin.min,existsMin.witness));
      return;
    }
    // check if already exists the witness
    var existsWit = _.find(slotList,function(s){
      return s.witness === witness;
    });
    if(existsWit){
      cb(false,_str.sprintf("%s already set at min %-2d",existsWit.witness,existsWit.min));
      return;
    }
    slotList.push({witness:witness, min:min});
    slotList = _.sortBy(slotList,function(s){
      return s.min;
    });
    hSlotList[chatId] = slotList;
    fs.writeFile(dataDir+"/slots.json",JSON.stringify(hSlotList),function(){});
    cb(false,_str.sprintf("Set %s at %-2d min",witness,min));
  }
  else{
    cb(false,_str.sprintf("/setslot WITNESS MIN"));
  }
};

exports.rm = function(client,args,chatId,cb){
  if(args.length >= 1){
    var witness = args[0].toLowerCase();
    var slotList = hSlotList[chatId] || [];
    // check if already exists the witness
    var existsWit = _.find(slotList,function(s){
      return s.witness === witness;
    });
    if(existsWit){
      slotList = _.filter(slotList,function(s){
        return s.witness !== witness;
      });
      hSlotList[chatId] = slotList;
      fs.writeFile(dataDir+"/slots.json",JSON.stringify(hSlotList),function(){});
      cb(false,_str.sprintf("removed %s at %d min",existsWit.witness,existsWit.min));
    }
    else{
      cb(false,_str.sprintf("slot for witness %s not found",witness));
    }
  }
  else{
    cb(false,_str.sprintf("/rmslot WITNESS"));
  }
};
