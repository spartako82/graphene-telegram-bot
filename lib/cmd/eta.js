var _ = require('underscore'),
_str = require('underscore.string'),
moment = require('moment');

var cmd = function(client,args,chatId,cb){
  var now = new Date();
  var time = new Date(Date.UTC(2015,10,4,16,00,00));
  console.log(time);
  var deltaHour = moment(time).diff(moment(now),"hours");
  var deltaMin = moment(time).diff(moment(now),"minutes")-deltaHour*60;
  cb(false,_str.sprintf("Eta: %dh:%dm",deltaHour,deltaMin));
};

exports.index = cmd;
