var fs = require('fs');
var _ = require('underscore');
var _str = require('underscore.string');

// Load slot list
var hSlotList = {}; // {chatId:[{witness: <>,min:<int>]}
if(fs.existsSync("slots.json")){
  var _hSlotList = JSON.parse(fs.readFileSync("slots.json"));
  hSlotList = _hSlotList;
}

exports.show = function(bot,client,msg){
  var slotList = hSlotList[msg.chat.id.toString()] || [];
  var res = "SLOTS:\n"
  res = _.reduce(slotList,function(tot,s){
    return tot + _str.sprintf("%-d %s\n",s.min,s.witness);
  },res);
  bot.sendMessage(msg.chat.id,res);
};

exports.set = function(bot,client,msg){
  var params = msg.text.split(" ");
  if(params.length >= 3){
    var witness = params[1].toLowerCase();
    var min = parseInt(params[2],10);
    var slotList = hSlotList[msg.chat.id.toString()] || [];
    if(min < 0 || min > 60){
      bot.sendMessage(msg.chat.id,"Min should be between 0 and 60");
      return;
    }
    // check if already exists at the same min
    var existsMin = _.find(slotList,function(s){
      return s.min === min;
    });
    if(existsMin){
      bot.sendMessage(msg.chat.id,_str.sprintf("min %-2d already taken by %s",existsMin.min,existsMin.witness));
      return;
    }
    // check if already exists the witness
    var existsWit = _.find(slotList,function(s){
      return s.witness === witness;
    });
    if(existsWit){
      bot.sendMessage(msg.chat.id,_str.sprintf("%s already set at min %-2d",existsWit.witness,existsWit.min));
      return;
    }
    slotList.push({witness:witness, min:min});
    slotList = _.sortBy(slotList,function(s){
      return s.min;
    });
    hSlotList[msg.chat.id.toString()] = slotList;
    fs.writeFile("slots.json",JSON.stringify(hSlotList),function(){});
    bot.sendMessage(msg.chat.id,_str.sprintf("Set %s at %-2d min",witness,min));
  }
  else{
    bot.sendMessage(msg.chat.id,_str.sprintf("/setslot WITNESS MIN"));
  }
};

exports.rm = function(bot,client,msg){
  var params = msg.text.split(" ");
  if(params.length >= 2){
    var witness = params[1].toLowerCase();
    var slotList = hSlotList[msg.chat.id.toString()] || [];
    // check if already exists the witness
    var existsWit = _.find(slotList,function(s){
      return s.witness === witness;
    });
    if(existsWit){
      slotList = _.filter(slotList,function(s){
        return s.witness !== witness;
      });
      hSlotList[msg.chat.id.toString()] = slotList;
      fs.writeFile("slots.json",JSON.stringify(hSlotList),function(){});
      bot.sendMessage(msg.chat.id,_str.sprintf("removed %s at %d min",existsWit.witness,existsWit.min));
    }
    else{
      bot.sendMessage(msg.chat.id,_str.sprintf("slot for witness %s not found",witness));
    }
  }
  else{
    bot.sendMessage(msg.chat.id,_str.sprintf("/rmslot WITNESS"));
  }
};
