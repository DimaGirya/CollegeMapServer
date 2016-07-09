
//------------Connect tomongodbonmLabvia Mongoose--------------
var flagIsConnection =  false;
var mongoose = require('mongoose');
config = {
   // mongoUrl:'mongodb://ColleageMap:shenkarmap@ds013414.mlab.com:13414/collegemap'
    mongoUrl:'mongodb://collegemap:collegemap@ds011725.mlab.com:11725/collegemapdb'
};

//The server optionauto_reconnectis defaulted to true
var options = {
        server: {
            auto_reconnect:true
        }
    };

mongoose.connect(config.mongoUrl, options);
db = mongoose.connection;// a global connection variable

// Event handlers for Mongoose
db.on('error', function (err) {
    console.log('Mongoose: Error: ' + err);
});
db.on('open', function(){
    flagIsConnection = true;
    console.log('Mongoose: Connection established');
});
db.on('disconnected', function(){
    flagIsConnection = false;
    console.log('Mongoose: Connection stopped,recconect');
    mongoose.connect(config.mongoUrl, options);
});
db.on('reconnected', function (){
    flagIsConnection = true;
    console.info('Mongoose reconnected!');
});


exports.isConnectedToDB = function () {
   return flagIsConnection
};
