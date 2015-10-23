var fs = require('fs');
var _ = require('underscore');
var _str = require('underscore.string');

// Load location list
var hLocationList = {}; // {chatId:[{witness: <>,location:<string>]}
var dataDir = "";

exports.init = function(_dataDir){
  dataDir = _dataDir;
  if(fs.existsSync(dataDir+"/locations.json")){
    var _hLocationList = JSON.parse(fs.readFileSync(dataDir+"/locations.json"));
    hLocationList = _hLocationList;
  }
};

exports.show = function(client,args,chatId,cb){
  var locationList = hLocationList[chatId] || [];
  var res = "WITNESS LOCATION:\n"
  res = _.reduce(locationList,function(tot,s){
    return tot + _str.sprintf("%s: %s\n",s.witness,s.location);
  },res);
  cb(false,res);
};

exports.set = function(client,args,chatId,cb){
  if(args.length >= 2){
    var witness = args[0].toLowerCase();
    var location = args.slice(1).join(" ");
    var locationList = hLocationList[chatId] || [];
    // Filter witness
    locationList = _.filter(locationList,function(o){
      return o.witness !== witness;
    });
    locationList.push({witness:witness, location:location});
    locationList = _.sortBy(locationList,function(s){
      return s.witness;
    });
    hLocationList[chatId] = locationList;
    console.log(dataDir,hLocationList);
    fs.writeFile(dataDir+"/locations.json",JSON.stringify(hLocationList),function(){});
    cb(false,_str.sprintf("Set %s at %s",witness,location));
  }
  else{
    cb(false,_str.sprintf("/setlocation WITNESS LOCATION"));
  }
};

exports.rm = function(client,args,chatId,cb){
  if(args.length >= 1){
    var witness = args[0].toLowerCase();
    var locationList = hLocationList[chatId] || [];
    // check if already exists the witness
    var existsWit = _.find(locationList,function(s){
      return s.witness === witness;
    });
    if(existsWit){
      locationList = _.filter(locationList,function(s){
        return s.witness !== witness;
      });
      hLocationList[chatId] = locationList;
      fs.writeFile(dataDir+"/locations.json",JSON.stringify(hLocationList),function(){});
      cb(false,_str.sprintf("removed %s at %s",existsWit.witness,existsWit.location));
    }
    else{
      cb(false,_str.sprintf("location for witness %s not found",witness));
    }
  }
  else{
    cb(false,_str.sprintf("/rmlocation WITNESS"));
  }
};
