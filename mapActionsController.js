const Graph = require('node-dijkstra');
var mongoose = require('mongoose');
var placesSchema = require('./placesSchema');
var DB = require('./database');
// get all places
exports.getMap = function(req,res) {
    var status = 200;
    if(!DB.isConnectedToDB()){
        res.status(status).send({"message":"No connection to data base.Try again leter"});
    }
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        res.status(status).send(data)
    });
};



exports.getMapToDisplay = function(req,res) {
    var status = 200;
    if(!DB.isConnectedToDB()){
        res.status(status).send({"message":"No connection to data base.Try again leter"});
    }
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        var result = calculateMap(data);
        res.status(status).send(result)
    });
  
};

function calculateMap(places) {
    var map = [ [],[],[],[],[], [], [], [], [], [] ];
    for(var i=0;i<places.length;i++){
        var place = places[i];
        var coord_y = place.coord_y;
        var height = place.height;
        var coord_x = place.coord_x;
        var width = place.width;
        for (var j=coord_y;j<coord_y+height;j++){
            for (var k=coord_x;k<coord_x+width;k++){
                var cell = {type: place.type, border: "none", status:place.status,place_id: place.id, in_path: false};
                map[j][k] = cell;
            }
        }
    }
    /*
    var cell_counter=0;
    for (var p=0;p<map.length;p++){
        var row=map[p];
        for(var q=0;q<row.length;q++){
            map[p][q].box_id = cell_counter;
            cell_counter++;
        }
    }
    */
    return JSON.stringify(map);
}



// get id's of places of the shortest path and cost
exports.getPath = function(req,res) { //todo validation
    var from = req.params.from;
    var to = req.params.to;
    console.log("from:"+from);
    console.log("to:"+to);
    var status = 200;

    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        console.log("size data:"+data.length);
        var temp  = JSON.stringify(data);
        var places = JSON.parse(temp);  // todo need to change

        var route = getGraph(places);
        var message = route.path(from,to,{cost:true});
        res.status(status).send(message)
    });
};

exports.setStatusRoom = function(req,res) { //todo set status in data base
    var status = 200;
    var roomId = req.params.room; //id of room
    var roomStatus = req.params.status; //status string
    var response;
    var query = placesSchema.findOne().where({id:roomId});
    query.exec(function (err,doc) {
        if(err) {
            console.log(err);
            throw err;
        }
       if(doc.type != 'class'){
            response =  [{"message":"Room is not class. Can't change status of room"}];
            res.status(status).send(response);
        }
       else if(doc.status == roomStatus){
            response =  [{"message":"Same status"}];
            res.status(status).send(response);
        }
        else{
           var query = doc.update({
               $set:{'status':roomStatus}
           });
           query.exec(function (err,results) {
               if(err)throw err;
               response =  [{"message":"Save status done"}];
               res.status(status).send(response);
           });
        }
    });

//  var response = [{"Response":"Room:"+room+" RoomStatus:"+roomStatus}];

};


// is function getRoomStatus needed?
exports.getRoomStatus = function(req,res) { //todo make query by param :room
    placesSchema.find({},function (err,data) {
        if(err){
            throw err;
        }
        var room_status;
        res.status(200).send(room_status)
    });
};



//console.log(route.path('1', '4',{cost:true}));


function getGraph(places) {
    var graph = new Graph();
    var sizeArray = places.length;

    for (var i = 0; i < sizeArray; i++) {
        var sizeNeighbors = places[i].neighbors.length;
        var neighbors = places[i].neighbors;
        var cost = 0;
        var neighbor = null;
        var temp = {};
        for (var j = 0; j < sizeNeighbors; j++) {
            neighbor = parseInt(neighbors[j].Id);
            cost = parseInt(neighbors[j].weight);
            temp[neighbor] = cost;
        }
        console.log(typeof  places[i]);
        console.log(places[i].Id);
        console.log(temp);
        graph.addNode(places[i].Id.toString(), temp);
    }
    console.log(graph);
    return graph;
}
