var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var mapAction = require('./mapActionsController');


app.set('port',port);
app.use('/',express.static('./public'));
app.use(function (req,res,next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.get('/getMap',mapAction.getMap);
app.get('/getMapToDisplay',mapAction.getMapToDisplay);
app.get('/getPath/:from/:to',mapAction.getPath);
app.get('/setStatusRoom/:room/:status',mapAction.setStatusRoom);
app.get('/getRoomStatus/:roomId',mapAction.getRoomStatus); 

app.listen(port, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

