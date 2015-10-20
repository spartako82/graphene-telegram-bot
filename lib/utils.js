var fs = require('fs');
var _ = require('underscore');

exports.mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}

exports.prependCommand = function(cmds,cmdPrefix){
  _.each(_.keys(cmds),function(c){
    var cmd = cmds[c];
    delete cmds[c];
    cmds[cmdPrefix+c] = cmd;
  });
  return cmds;
};
