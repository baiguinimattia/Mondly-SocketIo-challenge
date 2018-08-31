let express = require("express");
let app     = express();

let bodyParser = require("body-parser"),
mongoose   = require("mongoose"),
passport   = require("passport"),
localStrategy = require("passport-local"),
flash      = require("connect-flash");

let http = require("http").Server(app);
let io = require("socket.io")(http);

app.use(express.static("public"));
app.set("view engine" , "ejs");


let Leaderboard = require("./models/leaderboard");
let Exercise = require("./models/exercise");
let User = require("./models/user");
let Room = require("./models/room");
let Socket = require("./models/socket");
let Country = require("./models/country");
let middleware = require("./middleware/index");
let userRoutes = require("./routes/index");

mongoose.connect("mongodb://188.27.49.205/32:27017/challengeMondly" , {useNewUrlParser : true});

app.use(bodyParser.urlencoded({ extended : true}));
app.use(bodyParser.json());

app.use(flash());

app.use(require("express-session")({
    secret: "This is ok",
    resave : false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req , res , next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

let Translate = require("@google-cloud/translate");
let projectId = "formidable-bank-214408";

let translate = new Translate({
    projectId : projectId
});

function translateText(text , target , callback){
    translate
    .translate(text , target)
    .then(results=>{
        const translation = results[0];
        console.log(translation);
        callback(translation); 
    })
    .catch(err => {
        // console.log("Error:" , err);
        console.log("we have an error " + err.message);
    });
};

app.get("/" , function(req , res){
    res.render("main");
})

app.get("/main" , function(req , res){
    res.render("main");
})

app.get("/test" , function(req , res){
    res.render("test");
})

app.get("/leaderboards" , function(req , res){
    getLeaderboard(function(leaderboards){
        console.log(leaderboards);
        res.render("leaderboards" ,  {leaderboards : leaderboards});
    });
 
});

app.get("/countries" , function(req , res){
    getCountries(function(arrayCountries){
        res.send(arrayCountries);
    });

});

app.get("/adding" , middleware.isLoggedIn , function(req , res){
    res.render("adding");
});

app.post("/exercise/add" , function(req , res){
    addExercise(req.body.exercise);
});

function addExercise(data){
    let newExercise = {};
    newExercise.statement = data.statement;
    newExercise.response = data.response;

    newExercise.variants = [];
    if(data.variantOne){
        newExercise.variants.push(data.variantOne);
    };
    if(data.variantTwo){
        newExercise.variants.push(data.variantTwo);
    };
    if(data.variantThree){
        newExercise.variants.push(data.variantThree);
    };
    if(data.variantFor){
        newExercise.variants.push(data.variantFor);
    };
    if(data.extra){
        newExercise.extra = data.extra;
    };
    if(data.instruction){
        newExercise.instruction = data.instruction;
    };
    if(data.indicator){
        newExercise.indicator = data.indicator;
    };
    if(data.type){
        newExercise.type = data.type;
    };
    Exercise.create(newExercise,function( error, newExercise){
        if(error){
                console.log(error);
        }
        else{
                console.log("Exercise created");
        }
    });
};

function getCountries(callback){
    let arrayCountries = new Array();
    Country.find({} , function(err , foundCountries){
        if(err){
            console.log(err);
        }
        else{
            for(let i=0 ; i < foundCountries.length ; i++){
                    arrayCountries.push({title : foundCountries[i].name , code : foundCountries[i].tag});
            };
            callback(arrayCountries);
        };
    });
};
getCountriesList(function(array){
    pushCountriesIntoDb(array);
});
function getCountriesList(callback){
    let countries = "Afrikaans|af,Albanian|sq,Amharic|am,Arabic|ar,Armenian|hy,Azeerbaijani|az,Basque|eu,Belarusian|be,Bengali|bn,Bosnian|bs,Bulgarian|bg,Catalan|ca,Cebuano|ceb,Chinese(Simplified)|zh-C,Chinese(Traditional)|zh-T,Corsican|co,Croatian|hr,Czech|cs,Danish|da,Dutch|nl,English|en,Esperanto|eo,Estonian|et,Finnish|fi,French|fr,Frisian|fy,Galician|gl,Georgian|ka,German|de,Greek|el,Gujarati|gu,Haitian|Creole|ht,Hausa|ha,Hawaiian|haw,Hebrew|he,Hindi|hi,Hmong|hmn,Hungarian|hu,Icelandic|is,Igbo|ig,Indonesian|id,Irish|ga,Italian|it,Japanese|ja,Javanese|jw,Kannada|kn,Kazakh|kk,Khmer|km,Korean|ko,Kurdish|ku,Kyrgyz|ky,Lao|lo,Latin|la,Latvian|lv,Lithuanian|lt,Luxembourgish|lb,Macedonian|mk,Malagasy|mg,Malay|ms,Malayalam|ml,Maltese|mt,Maori|mi,Marathi|mr,Mongolian|mn,Myanmar (Burmese)|my,Nepali|ne,Norwegian|no,Nyanja (Chichewa)|ny,Pashto|ps,Persian|fa,Polish|pl,Portuguese (Portugal,Brazil)|pt,Punjabi|pa,Romanian|ro,Russian|ru,Samoan|sm,Scots Gaelic|gd,Serbian|sr,Sesotho|st,Shona|sn,Sindhi|sd,Sinhala (Sinhalese)|si,Slovak|sk,Slovenian|sl,Somali|so,Spanish|es,Sundanese|su,Swahili|sw,Swedish|sv,Tagalog (Filipino)|tl,Tajik|tg,Tamil|ta,Telugu|te,Thai|th,Turkish|tr,Ukrainian|uk,Urdu|ur,Uzbek|uz,Vietnamese|vi,Welsh|cy,Xhosa|xh,Yiddish|yi,Yoruba|yo,Zulu|zu}";
    let helper = countries.split(",");
    let arrayCountries = new Array();
    helper.forEach(function(country){
        let aux = country.split("|");
        arrayCountries.push({title : aux[0] , code : aux[1]});
        
    })
    callback(arrayCountries);
}  

function pushCountriesIntoDb(array){
    var  i;
    for(i = 0 ; i < array.length ; i++){
        Country.create(array[i] , function(err , newCountry){
            if(err){
                console.log(err);
            }
            else{
                
            };
        });
    };
    
};

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

app.use(userRoutes);

app.get("/play" , middleware.isLoggedIn, function(req , res){
    res.render("chat" , {currentUser : req.user});
});

let maximumCapacity = 3;
let numberOfGames = 10;

//this function deletes everything from the database on each run
clearDatabase();

io.on("connection" , function(socket){
    socket.on("new user" , function(data){
        newSocket(socket , data , function(createdSocket){
            checkForDuplicatedSockets(createdSocket);
        });
    });

    socket.on("new room" , function(data){
        findSocketById(socket , function(foundSocket){
            getNumberOfRooms(function(numberOfRooms){
                let newRoom = {};
                newRoom.roomNo = numberOfRooms + 1;
                newRoom.sockets = [];
                newRoom.sockets.push(foundSocket);
                createNewRoom(newRoom);
                foundSocket.roomNo = newRoom.roomNo;
                updateSocket(foundSocket);
                socket.join("room-"+ newRoom.roomNo);
                io.to(foundSocket.socketId).emit("joined empty room" , { message : "You joined room " + newRoom.roomNo + ", which is empty!"});
            })
        });

    });

    socket.on("pressed ready" , function(data){
        findSocketById(socket , function(foundSocket){
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                foundRoom.pressedReady += 1;
                updateRoom(foundRoom);
                if(foundRoom.pressedReady === foundRoom.sockets.length){
                    foundRoom.state = true;
                    updateRoom(foundRoom);
                    io.in("room-" + foundRoom.roomNo).emit("start countdown" , {message : "The game is about to start"});
                }
                else{
                    io.in("room-" + foundRoom.roomNo).emit("not enough players", {message : "There are not enough ready players"});
                }
            });
        });
    });

    socket.on("request list of games" , function(data){
        findSocketById(socket , function(foundSocket){
            pickGames(numberOfGames , function(foundGames){
                    findRoomByNo(foundSocket.roomNo , function(foundRoom){
                            if(!foundRoom.games.length){
                                foundRoom.games = foundGames;
                                updateRoom(foundRoom);
                                io.in("room-" + foundSocket.roomNo).emit("request game");
                            };
                    });
            });
        });
    });

    socket.on("send game" , function(data){
        findSocketById(socket , function(foundSocket){
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                if(foundSocket.currentGame === 9){
                    translateGame(foundRoom.games[foundSocket.currentGame] , foundSocket , function(translatedGame){
                        io.to(foundSocket.socketId).emit("sending game", {game : translatedGame , last : true});
                    })
                    
                }
                else{
                    translateGame(foundRoom.games[foundSocket.currentGame] , foundSocket , function(translatedGame){
                        io.to(foundSocket.socketId).emit("sending game", {game : translatedGame , last : false});
                    })
                    foundSocket.currentGame += 1;
                    updateSocket(foundSocket);
                };
            });
        });
    });

    socket.on("game finished" , function(data){
        findSocketById(socket , function(foundSocket){
            io.to(foundSocket.socketId).emit("show ending screen", {points : foundSocket.points});
            findUserByUsername(foundSocket.username , function(foundUser){
                    foundUser.totalPoints += foundSocket.points;
                    updateUser(foundUser);
            });
        });
    });

    socket.on("correct response" , function(data){
            findSocketById(socket , function(foundSocket){
                    foundSocket.points += data.points;
                    updateSocket(foundSocket);
            });
    });



    
    socket.on("pressed unready" , function(){
        findSocketById(socket , function(foundSocket){
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                foundRoom.pressedReady -= 1;
                updateRoom(foundRoom);
                io.in("room-" + foundRoom.roomNo).emit("not enough players", {message : "There are not enough ready players"});
            });
        });
    });


    socket.on("join specific room" , function(data){
        findSocketByUsername(data.username , function(foundSocket){
            let roomNo = data.lobby;
            findRoomByNo(roomNo , function(foundRoom){
                foundSocket.hasLeft = false;
                if(foundRoom.sockets.length > maximumCapacity || foundRoom.state === true){
                    io.to(foundSocket.socketId).emit('unable to join room', "Please choose another room . This room is either in a game or is full");
                }
                else{
                    foundSocket.roomNo = roomNo;
                    foundRoom.sockets.push(foundSocket);
                    updateRoom(foundRoom);
                    updateSocket(foundSocket);
                    socket.join("room-"+ roomNo);
                    socket.to("room-" + roomNo).emit("new user joined", "User " + foundSocket.username + " joined this room");
                    io.to(foundSocket.socketId).emit("joined specific room" , { message : "You joined room " + roomNo});
                };
            })

        });  
    }); 

    socket.on("picked languages by user" , function(data){
        findSocketById(socket ,function(foundSocket){
            foundSocket.nativeLanguage = data.native;
            foundSocket.learningLanguage = data.learning;
            updateSocket(foundSocket);
        });

    });

    socket.on("new message" , function(data){
      findSocketById(socket , function(foundSocket){
        io.sockets.in("room-"+foundSocket.roomNo).emit("message to room" , { username : foundSocket.username , text : data.message , nativeLanguage : foundSocket.nativeLanguage}); 
      });      
    });

    socket.on("request translation" , function(data){
        findSocketById(socket , function(foundSocket){
            Country.find({ name : foundSocket.nativeLanguage} , function(error , foundCountries){
                if(error){
                    console.log(error);
                }
                else{
                    if(foundCountries.length > 0 ){
                        translateText(data.message , foundCountries[0].tag  , function(translation){
                            io.to(foundSocket.socketId).emit("sending back translation", {translation : translation , from : data.from});
                        });
                    };
                };
            });
        });

    });  
    socket.on("send lobbies list" , function(data){
        findSocketById(socket , function(foundSocket){
            findRooms(function(foundRooms){
                io.emit('sending lobbies' , {lobbies : foundRooms , username : foundSocket.username});
            });
        });
    });
    socket.on("pressed Leave" , function(data){
        findSocketById(socket , function(foundSocket){
            let url = "/";
            console.log(foundSocket.username + "has left room no " + foundSocket.roomNo);
            console.log("redirect to " , url , " after he left the room no " , foundSocket.roomNo);
            io.sockets.in("room-"+foundSocket.roomNo).emit("leftRoom" , { description : foundSocket.username + " has left this lobby!"});
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                removeSocketFromRoom(foundSocket , foundRoom);
                socket.leave("room-" + foundRoom.roomNo);
                removeEmptyRooms();
                io.to(foundSocket.socketId).emit("redirect" , { url : url} );
            })
            foundSocket.roomNo = -1;
            updateSocket(foundSocket);
        });
    });

    socket.on("disconnect" , function(){
        findSocketById(socket , function(foundSocket){
            if(foundSocket.hasLeft === false){
                io.sockets.in("room-"+foundSocket.roomNo).emit("disconnected" , { description : foundSocket.username + " has disconnected from this lobby"});
            };
            removeSocket(foundSocket);
            findRoomByNo(foundSocket.roomNo , function(foundRoom){
                removeSocketFromRoom(foundSocket , foundRoom);
            });
            removeEmptyRooms();
        });
    });    
});

function translateGame(game , socket, callback){
    let translatedGame = {};
    Country.find({ name : socket.learningLanguage} , function(error , foundCountries){
        if(error){
            console.log(error);
        }
        else{
            if(foundCountries.length > 0 ){
                translateText(game.instruction , foundCountries[0].tag  , function(translation){
                    translatedGame.instruction = translation;
                    translatedGame.variants = [];
                    var i;
                    for(i =0 ; i < game.variants.length ; i++){
                        translateText(game.variants[i] , foundCountries[0].tag , function(translation){
                            translatedGame.variants.push(translation);
                        });
                    };
                    if( i === game.variants.length){
                        translateText(game.response , foundCountries[0].tag , function(translation){
                            translatedGame.response = translation;
                            translateText(game.statement , foundCountries[0].tag , function(translation){
                                translatedGame.statement = translation;
                                translateText(game.extra , foundCountries[0].tag , function(translation){
                                    translatedGame.extra = translation;
                                    console.log(translatedGame);
                                    callback(translatedGame);
                                });
                            });

                        });
                    };
                });
            };
        };
    });

};

function updateUser(user){
    User.findByIdAndUpdate(user._id , user , function(err, updatedUser){
        if(err){
            console.log(err);
        }
        else{
            console.log("user updated");
        };
    });

};

function getUsers(callback){
    User.find({} , function(err, foundUsers){
        if(err){
            console.log(err);
        }
        else{
            callback(foundUsers);
        };
    });
};

function getLeaderboard(callback){
    let leaderboardUsers = new Array(10);
    getUsers(function(foundUsers){
        if(foundUsers.length < 10){
            var i;
            for(i = 0 ; i < foundUsers.length ; i ++){
                leaderboardUsers.push(foundUsers[i]);
            };
            if( i === foundUsers.length ){
                order(leaderboardUsers , function(array){
                    leaderboardUsers = array;
                    callback(leaderboardUsers);
                });
                
            };
        }
        else{
            order(foundUsers , function(array){
                console.log("dupa order" , array);
                let i;
                for(i = array.length - 10 ; i < array.length ; i++){
                    leaderboardUsers.push(array[i]);
                };
                if(i === array.length){
                    callback(leaderboardUsers);
                };
            });


        };
    });
};

function order(array ,callback){
    var i , j;
    for(i = 0 ; i < array.length - 1 ; i++){
        for(j = i + 1 ; j < array.length ; j++){
            if(array[i].totalPoints > array[j].totalPoints){
                let aux = array[i];
                array[i] = array[j];
                array[j] = aux;
            };
        };
    };
    if(i === array.length - 1 &&  j === array.length){
        callback(array);
    }
    
};

function findUserByUsername(username , callback){
    User.find({username : username} , function(err , foundUser){
        if(err){
            console.log(err);
        }
        else{
            callback(foundUser[0]);
        };
    });
}; 

function pickGames(numberOfGames, callback){
    let games = [];
    let gameIds = new Array(15).fill(0);
    
    let i = 0 ;
    getExercises(function(foundExercises){
        while( i < numberOfGames){
            getRandomInt(15 , function(number){
                if(gameIds[number] === 0){
                    games.push(foundExercises[number]);
                    gameIds[number] = 1;
                    i++;
                };
            });
        };
        if(i >= numberOfGames){
            callback(games);
        };
    });


};

function getExercises(callback){
    Exercise.find({} , function(err , foundExercises){
        if(err){
            console.log(err);
        }
        else{
            if(foundExercises.length > 0 ){
                callback(foundExercises);
            };
        };
    });
};

function checkIfAlreadyPicked(id , array , callback){
    for(let i = 0 ; i < array.length ; i++){
        if(array[i] === id){
            callback(true);
        };
    };
    callback(false);
};

function getRandomInt(max , callback) {
    callback(Math.floor(Math.random() * Math.floor(max)));
}

function checkForDuplicatedSockets(socket){
    let numberOf = 0;
    let previousPosition = -1;
    findSockets(function(foundSockets){
        for(let i = 0 ; i < foundSockets.length ; i++){

            if(socket.username === foundSockets[i].username){
                numberOf++;
                if(numberOf > 1){
                    removeSocket(foundSockets[previousPosition]);
                    numberOf--;                    
                }
                previousPosition = i;
            };
        };
    });
};



function clearDatabase(){
    Socket.deleteMany({} , function(err){
        if(err) console.log(err);
    });
    Room.deleteMany({} , function(err){
        if(err) console.log(err);
    })
};


function removeSocketFromRoom(socket , room){
    for(let i = 0 ; i < room.sockets.length ; i++){
        if(room.sockets[i].socketId === socket.socketId){
            room.sockets.splice(i , 1);
            Room.findByIdAndUpdate(room._id , room , function(err , updatedRoom){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("socket removed from room");
                };
            });
        };
    };
};

function removeEmptyRooms(){
    findRooms(function(foundRooms){
        foundRooms.forEach(function(room){
            if(!room.sockets.length){
                removeRoom(room);
            };
        });
    });

};

function findSockets(callback){
    Socket.find({} , function(err , foundSockets){
        if(err){
            console.log(err);
        }
        else{
            console.log("din findSockets")
            callback(foundSockets);
        }
    });
};


function newSocket(socket , data , callback){
    let newSocket = {};
    newSocket.socketId = socket.id;
    newSocket.username = data.username;
    Socket.create(newSocket,function( error, newSocket){
        if(error){
                console.log(error);
        }
        else{
                console.log("Socket succesfully created");
                callback(newSocket);
        }
    });
};

function createNewRoom(data){
    let newRoom = {};
    newRoom.name = data.name;
    newRoom.roomNo = data.roomNo;
    newRoom.sockets = data.sockets;
    Room.create(newRoom,function( error, newRoom){
        if(error){
                console.log(error);
        }
        else{
            console.log("Room succesfully created");
        }
    });
};

function findSocketById(socket , callback){
    Socket.find({socketId : socket.id} , function(err , foundSocket){
        if(err){
            console.log(err);
        }
        else{
            if(foundSocket.length){
                callback(foundSocket[0]);
            };
        };
    });
};

function findSocketByUsername(username , callback){
    Socket.find({username : username} , function(err , foundSocket){
        if(err){
            console.log(err);
        }
        else{
            if(foundSocket.length){
                callback(foundSocket[0]);
            };
        };
    });
};

function findRooms(callback){
    Room.find({} , function(err , foundRooms){
        if(err){
            console.log(err);
        }
        else{
            callback(foundRooms);
        };
    });
};

function getNumberOfRooms(callback){
    Room.find({} , function(err , foundRooms){
        if(err){
            console.log(err);
        }
        else{
            callback(foundRooms.length);
        };
    });
};

function findRoomByNo(roomNo , callback){
    Room.find({ roomNo : roomNo} , function(err , foundRooms){
        if(err){
            console.log(err);
        }
        else{
            if(foundRooms.length){
                callback(foundRooms[0]); 
            };
        };
    });
};

function updateSocket(socket){
    Socket.findByIdAndUpdate(socket._id , socket , function(err , updatedSocket){
            if(err){
                console.log(err);
            }
            else{
                console.log("Socket succesfully updated");
            }
    });

};

function updateRoom(room){
    Room.findByIdAndUpdate(room._id , room , function(err , updatedRoom){
        if(err){
            console.log(err);
        }
        else{
            console.log("Room succesfully updated");
        }
    });
};

function removeRoom(room){
            Room.findByIdAndRemove(room._id , function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Room succesfully removed");
                }
            });
};

function removeSocket(socket){
        Socket.findByIdAndRemove(socket._id , function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Socket succesfully removed");
            }
        });
};


app.get("/*" , function(req , res){
    res.send("<h1>Error 404! Page not found!</h1>");
});


http.listen(3000 , function(){
    console.log("Connection to server established");
});