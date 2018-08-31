$(function () {
    var socket = io({"connect timeout" : 10000 , "reconnect" : true , "reconnection delay" : 200 , "max reconnection attempts" : 5});

    let username = $("strong#username").text().toLowerCase();
    console.log(username);
    socket.emit("new user" , { username : username});

    $(".send").click(function(event){
        let message = $("#message").val();
        socket.emit("new message" , { username : username , message : message});
    });

    socket.on("message to room" , function(data){
        socket.emit("request translation" , {message : data.text , from : data.username , username : username});
    });

    socket.on("message to self" , function(data){
        appendText("#messages" , "<li>" + data.from + ": " + data.message + "</li>");
    });

    socket.on("sending back translation" , function(data){
        appendText("#messages" , "<li>" + data.from + ": " + data.translation + "</li>");
    });



    $(".btn.btn-danger.random").click(function(event){
        socket.emit("assign random room" , {username : username});
    });

    socket.on("need new room" , function(data){
        socket.emit("new room" , {username : username});
        $(".btn.btn-danger.new-room").addClass("hidden");
        $(".container.rooms").addClass("hidden");
        $(".row.chat").fadeIn(1000);
    });

    socket.on("need specific room" , function(data){
        socket.emit("join specific room" , { username : username , lobby : data.room});
        $(".btn.btn-danger.new-room").addClass("hidden");
        $(".container.rooms").addClass("hidden");
        $(".row.chat").fadeIn(1000);
    });

    $(".btn.btn-danger.new-room").click(function(event){
        socket.emit("new room" , {username : username});
        $(".btn.btn-danger.new-room").addClass("hidden");
        $(".container.rooms").addClass("hidden");
        $(".row.chat").fadeIn(1000);

    });

    socket.on("new user joined" , function(data){
        appendText("#messages" , "<li>" + data + "</li>");
    });

    socket.on("joined empty room" , function(data){
        appendText("#messages" , "<li>" + data.message + "</li>");
    });

    socket.on("joined specific room" , function(data){
        appendText("#messages" , "<li>" + data.message + "</li>");
    });



    $("#ready").click(function(event){
        if($("#ready").hasClass("btn-danger")){
            $("#ready").removeClass("btn-danger");
            $("#ready").addClass("btn-success");
            socket.emit("pressed ready");
        }
        else{
            $("#ready").addClass("btn-danger");
            $("#ready").removeClass("btn-success");
            socket.emit("pressed unready");
        };
        
    });

    socket.on("not enough players" , function(data){
        $("#ready-text").text(data.message);
    });

    socket.on("start countdown" , function(data){
        // $("#ready-text").text(data.message);
        console.log("everyone is ready");
        socket.emit("request list of games");
        setTimeout(function(){
            $("#chat-stage").removeClass("active");
            $("#chat-stage").addClass("disabled");

            $("#game-stage").removeClass("disabled");
            $("#game-stage").addClass("active");

            // $(".row.chat").addClass("hidden");
            $(".row.chat").fadeOut();
            $("#game-aria").fadeIn(1000);
            // $("#game-aria").removeClass("hidden");
        },5000);     

    });

    socket.on("request game" , function(data){
        socket.emit("send game");
    });

    socket.on("sending game" , function(data){
            if(typeof data === undefined){

            }
            else{
                console.log(data);
                appendGame(data.game , function(){
                    if(!$("#game-aria").hasClass("hidden")){
                        $("#game-aria").fadeIn(1000);
                    };
                    let pressed = false;
                    $(".btn-info.response").click(function(){
                        if($(this).hasClass("btn-info") && !pressed){
                            pressed = true;
                            if($(this).text() === data.game.response){
                                $(this).removeClass("btn-info");
                                $(this).addClass("btn-success");
                                socket.emit("correct response" , {username : username , points : data.game.worth});

                                $("#div-extra").css("background-color" , "#99ff99");
                                $("#div-extra").fadeIn(500);
                            }
                            else{
                                $(this).removeClass("btn-info");
                                $(this).addClass("btn-danger");
                                socket.emit("wrong response" , {username : username});
                                $("#div-extra").css("background-color" , "#ff0000");
                                $("#div-extra").fadeIn(500);
                            };

                        };
                    });
                    $("button#continue").click(function(event){
                        if(!pressed){
                            alert("Please choose an answer");
                        }
                        else{
                            $(".btn-info.response").each(function(event){
                                $(this).unbind("click");
                            });
                            if(data.last){
                                socket.emit("game finished");
                            }
                            else{
                                socket.emit("send game");

                                removeClassForButton($("#response-1"));
                                removeClassForButton($("#response-2"));
                                removeClassForButton($("#response-3"));
                                removeClassForButton($("#response-4"));
                                $("#div-extra").css("display" , "none");
                                $("#game-aria").css("display" , "none");
                                $("#game-aria").removeClass("hidden");
                            };


                        };
                        $("button#continue").unbind("click");
                    });

                });

            };
    });

    socket.on("show ending screen" , function(data){
            $("#h1-results").text("You've acumulated " + data.points + " points");
            $("#game-aria").fadeOut();
            $("#results-aria").fadeIn(1000);
    });



    socket.on("reset" , function(data){
        $(".container.language").removeClass("hidden");
        $(".row.chat").addClass("hidden");
        $(".btn.btn-danger.new-room").removeClass("hidden");
    });

    socket.on("unable to join room" , function(data){
            alert(data);
    });

    socket.on("disconnected" , function(data){
        console.log(data);
        $("#messages").append("<li>" + data.description + "</li>");
    });

    socket.on("send connected users" , function(data){
        console.log(data);
    });

    $("#language").click(function(event){
        
        $(".container.rooms").removeClass("hidden");
        $("#modal").addClass("hidden");

        $("#language-stage").removeClass("active");
        $("#language-stage").addClass("disabled");

        $("#chat-stage").removeClass("disabled");
        $("#chat-stage").addClass("active");



        let dropdownNative = $(".dropdown.native");
        let nativeLanguage = dropdownNative[0][Number(dropdownNative[0].value) + 1].text;
        
        let dropdownLearn = $(".dropdown.learn");
        let learnLanguage = dropdownLearn[0][Number(dropdownLearn[0].value) + 1].text;
        console.log("picked languages" , nativeLanguage , learnLanguage);
        socket.emit("picked languages by user" , {username : username , native : nativeLanguage , learning : learnLanguage});
        socket.emit("send lobbies list" , {username : username});
        
        // $(".btn.btn-primary.modal").addClass("hidden");
        socket.on("sending lobbies" , function(data){
            if(data.username === username){
                    console.log(data);
                    data.lobbies.forEach(function(room){
                        if(3 - room.sockets.length && room.state === false){
                            $("#rooms").append("<li>" + "Room " + room.roomNo  + "</li><button data-type-id=" + room.roomNo + " class='btn btn-danger lobby'>Join room</button>");
                        }
                        else{
                            $("#rooms").append("<li>" + "Room " + room.roomNo  + "</li>");
                        };
                        $(".btn.btn-danger.lobby").click(function(event){
                            let room = $(".btn.btn-danger.lobby").attr("data-type-id");
                            socket.emit("join specific room" , { username : username , lobby : room});
                            $(".row.chat").removeClass("hidden");
                            $(".container.rooms").addClass("hidden");
                            $(".btn.btn-danger.new-room").addClass("hidden");
                        }); 
                });
            };
        });
    });

    $(".leave").click(function(){
        socket.emit("pressed Leave" , {username : username});
        $(".container.rooms").removeClass("hidden");
        $(".btn.btn-danger.new-room").removeClass("hidden");
        $(".row.chat").addClass("hidden");
        $("#messages").text("");
        $("#modal").removeClass("hidden");
    });

    socket.on("redirect" , function(data){
        window.location = "http://localhost:3000" + data.url;
    });

    socket.on("leftRoom" , function(data){
        $("#messages").append("<li>" + data.description + "</li>");
    });

    getCountries(function(data){  
        for(let i=0; i< data.length ; i++){
            let stringToAppend = "";
            stringToAppend += "<option value='"+i+"'>" + data[i].title +"</option>";
            $(".ui.dropdown").append(stringToAppend);
        };
        $(".btn.btn-danger.send").click(function(){
            let textToTranslate = $("#message").val();
            $("#message").val("");
            let dropdown = $(".ui.dropdown");
            let target = dropdown[0].value;
            let url = "/translate";
        
            $.post(url , { text : textToTranslate , target : data[target].title} , function( data ){
                socket.emit("new message" , { username : username , message : data});
            });
        });
    
    });

});


$("#submitName").click(function(event){
    let username = $("#pickedName").val();
    console.log(username);
});

function appendText(to , text){
    $(to).append(text);
};


function getCountries(callback){
    let url = "/countries";
    $.get(url)
    .done(function(data){
        callback(data);
    });
    
};

function getRoomsList(callback){
        let url = "/rooms";
        $.get(url)
        .done(function(data){
                console.log(data);
                data.arrayLobbies.forEach(function(room){
                    if(3 - room.connectedUsers.length){
                        $("#rooms").append("<li>" + "Room " + room.id  + "</li><button data-type-id=" + room.id + " class='btn btn-danger lobby'>Join room</button>");
                    }
                    else{
                        $("#rooms").append("<li>" + "Room " + room.id  + "</li>");
                    };

                });
                callback();
        });
};

function removeClassForButton(button){
    button.removeClass("btn-success");
    button.removeClass("btn-danger");
    button.addClass("btn-info");
}

function appendGame(data , callback){
        $("#instruction-text").text(data.instruction);
        $("#statement-text").text(data.statement);
        $("#response-1").text(data.variants[0]);
        $("#response-2").text(data.variants[1]);
        $("#response-3").text(data.variants[2]);
        $("#response-4").text(data.variants[3]);
        if(data.variants.length === 3){
            $("#response-4").addClass("hidden");
            $("#response-1").removeClass("hidden");
            $("#response-2").removeClass("hidden");
            $("#response-3").removeClass("hidden");
            $("#response-1").css("width" , "33.33%")
            $("#response-2").css("width" , "33.33%")
            $("#response-3").css("width" , "33.33%")

        }
        else{
            if(data.variants.length === 2){
                $("#response-3").addClass("hidden");
                $("#response-4").addClass("hidden");
                $("#response-1").removeClass("hidden");
                $("#response-2").removeClass("hidden");
                $("#response-1").css("width" , "50%")
                $("#response-2").css("width" , "50%")
            };
        };
        $("h3#extra").text(data.extra);
        callback();


};