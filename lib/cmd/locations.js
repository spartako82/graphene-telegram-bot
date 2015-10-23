var fs = require('fs');
var _ = require('underscore');
var _str = require('underscore.string');

// Load location list
var hLocationList = {}; // {chatId:[{witness: <>,location:<string>,hosting:<string>]}
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
  var res = "WITNESS LOCATION-HOSTING:\n"
  res = _.reduce(locationList,function(tot,s){
    return tot + _str.sprintf("%s %s-%s\n",s.witness,s.location,s.hosting);
  },res);
  cb(false,res);
};

exports.set = function(client,args,chatId,cb){
  if(args.length >= 3){
    var witness = args[0].toLowerCase();
    var location = args[1];
    var hosting = args[2];
    var locationList = hLocationList[chatId] || [];
    // Filter witness
    locationList = _.filter(locationList,function(o){
      return o.witness !== witness;
    });
    locationList.push({witness:witness, location:location, hosting:hosting});
    locationList = _.sortBy(locationList,function(s){
      return s.witness;
    });
    hLocationList[chatId] = locationList;
    console.log(dataDir,hLocationList);
    fs.writeFile(dataDir+"/locations.json",JSON.stringify(hLocationList),function(){});
    cb(false,_str.sprintf("Set %s at %s-%s",witness,location,hosting));
  }
  else{
    cb(false,_str.sprintf("/setlocation WITNESS LOCATION HOSTING"));
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
      cb(false,_str.sprintf("removed %s at %s-%s",existsWit.witness,existsWit.location,existsWit.hosting));
    }
    else{
      cb(false,_str.sprintf("location for witness %s not found",witness));
    }
  }
  else{
    cb(false,_str.sprintf("/rmlocation WITNESS"));
  }
};
