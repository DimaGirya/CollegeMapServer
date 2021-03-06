const Graph = require('node-dijkstra');
var mongoose = require('mongoose');
var placesSchema = require('./placesSchema');
var DB = require('./database');
var errorStr = "An error occurred. Error code:";
var mapToDisplay = undefined;
var map = undefined;
console.log("Server start");

function getMapFromDb(){ // get data from DB and calculate map
    if(!DB.isConnectedToDB()){
         mapToDisplay = undefined;
         map = undefined;
        console.error("No connected to db. Can't calculate map!")
    }
    placesSchema.find({},function (err,data) {
        if(err){
            console.log(err);
            res.status(500).send(errorStr+"0");
        }
        map = data;
        mapToDisplay = calculateMap(data);
        console.log("Map calculate done.")
    });
}

exports.getMap = function(req,res) {    //return map data ( not calculate map)
    console.log("getMap call");
    res.status(200).send(map)
};

exports.getMapToDisplay = function(req,res) { // return calculate map to display
    console.log("getMapToDisplay call");
    res.status(200).send(mapToDisplay);
};


/*
    @param: json map data
    @return: calculate map that client can display to user
 */
function calculateMap(places) {
    var map = [];
    var numberOfRows = places.length;
    for (var i = 0; i < numberOfRows; i++) {
        var place = places[i];
        var coordY = place.coord_y;
        var coordX = place.coord_x;
        var roomHeight = coordY + place.height;
        for (var j = coordY; j < roomHeight; j++) {
            var roomWidth = coordX + place.width;
            for (var k = coordX; k < roomWidth; k++) {
                while(map[j] === undefined){
                    map.push([]);
                }
                // map data:
                // type - type of object (room,hallway,office or other )
                // status - status of room
                // in_path - if room in patch
                // name -  room/object name
                // border - tempory string that by replace on calculateMapsBorders
                // if you want to add something to data put it on json her
                 map[j][k] = {type: place.type, border: "border", status: place.status, place_id: place.id, in_path: false,name:place.name,
                 coord_x:j,coord_y:k};
            }
        }
    }
    calculateMapsBorders(map);
    return map;
}

function calculateMapsBorders(map) {  // this function is set type of boorder for each div
    var mapLength =  map.length;
    for(var y = 0; y <mapLength; y++) {
        var current_row = map[y];
        var currentRowLength  = current_row.length;
        for(var x = 0; x < currentRowLength; x++) {
            try {
                if(map[y][x].type == "hallway"){
                    continue;
                }
                if (map[y - 1] === undefined) {
                    map[y][x].border += "Top";
                }
                else if (map[y][x].place_id !== map[y - 1][x].place_id) {
                    map[y][x].border += "Top"
                }

                if (map[y][x + 1] === undefined) {
                    map[y][x].border += "Right";
                }
                else if (map[y][x].place_id !== map[y][x + 1].place_id) {
                    map[y][x].border += "Right"
                }

                if (map[y + 1][x] === undefined) {
                    map[y][x].border += "Bottom";
                }
                else if (map[y][x].place_id !== map[y + 1][x].place_id) {
                    map[y][x].border += "Bottom"
                }

                if (map[y][x - 1] === undefined) {
                    map[y][x].border += "Left";
                }
                else if (map[y][x].place_id !== map[y][x - 1].place_id) {
                    map[y][x].border += "Left"
                }
        }
            catch(e){}
        }
    }
}

// get id's of places of the shortest path and cost
exports.getPath = function(req,res) {
    var from = req.params.from;
    var to = req.params.to;
    var status = 200;
    placesSchema.find({},function (err,data) {
        if(err){
            console.log(err);
            res.status(500).send(errorStr+"6");
        }
        var temp  = JSON.stringify(data);
        var places = JSON.parse(temp);
        var route = getGraph(places);
        var message = route.path(from,to,{cost:true,trim:true});
        res.status(status).send(message)
    });
};

exports.setStatusRoom = function(req,res) {
    var status = 200;
    var roomId = req.params.room; //id of room
    var roomStatus = req.params.status; //status string
    var response;
    var query = placesSchema.findOne().where({id:roomId});
    query.exec(function (err,doc) {
        if(err) {
            console.log(err);
            res.status(500).send(errorStr+"1");
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
                if(err) {
                    console.log(err);
                    res.status(500).send(errorStr+"2");
                }
                var size = map.length;
                for(var i = 0; i < size; i++){
                    if(map[i].id == roomId){
                        map[i].status =  roomStatus;
                        break;
                    }
                }
                var mapSizeX = mapToDisplay.length;
                var mapSizeY;
                for (var j = 0 ; j < mapSizeX; j++) {
                    if(mapToDisplay[j] === undefined){
                        console.log(j);
                        continue
                    }
                    mapSizeY = mapToDisplay[j].length;
                    for (var k = 0; k < mapSizeY; k++) {
                        try {
                            console.log(mapToDisplay[j][k]);
                            if (mapToDisplay[j][k].place_id == roomId) {
                                mapToDisplay[j][k].status = roomStatus;
                            }
                        }
                        catch(e){}
                }
            }
                response =  [{"message":"Save status done"}];
                res.status(status).send(response);
            });
        }
    });
};

exports.getRoomStatus = function(req,res) {
    var roomId = req.params.roomId;
    placesSchema.find({"id":roomId},function (err,data) {
        if(err){
            console.log(err);
            res.status(500).send(errorStr+"3");
        }
        res.status(200).send(data)
    });
};

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
        graph.addNode(places[i].id.toString(), temp);
    }
    return graph;
}

exports.addComments = function (req,res) {
    var roomId = req.params.roomId;
    var userName = req.params.userName;
    var commentStr = req.params.comment;
    var date = new Date();
    var comment = {};
    comment["userName"] = userName;
    comment["commentStr"] = commentStr;
    comment["date"] = date;
    var query = placesSchema.findOne().where({id:roomId});
    query.exec(function (err,doc) {
        if(err) {
            console.log(err);
            res.status(500).send(errorStr+"4");
        }
        var temp = doc.comments;
        temp.push(comment);
        var query = doc.update({
            $set:{'comments':temp}
        });
        query.exec(function (err,results) {
            if (err) {
                console.log(err);
                res.status(500).send(errorStr+"5");
            }
            else {
                res.status(200).send(results)
            }
        });

    });
};

setTimeout(function () {    //wait for mongoose connection established
    console.log("Load map....");
    var count = 1;
    console.log('Attempt number  '+count);
    getMapFromDb();
    setTimeout(function () {    //wait for get data from mongo db + calculate map
        if (mapToDisplay !== undefined) {
            console.log('Server ready to work.');
            return;
        }
        var intervalObject = setInterval(function () {  // try again if attempt fail
            getMapFromDb();
            count++;
            console.log('Attempt number  ' + count);
            console.log(typeof mapToDisplay);
            if (mapToDisplay !== undefined) {
                console.log('Server ready to work.');
                clearInterval(intervalObject);
            }
        }, 3000);
    },3000);
},3000);
