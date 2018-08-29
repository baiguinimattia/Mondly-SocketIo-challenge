getCountries(function(data){  
    for(let i=0; i< data.length ; i++){
        let stringToAppend = "";
        stringToAppend += "<option value='"+i+"'>" + data[i].title +"</option>";
        $(".ui.dropdown").append(stringToAppend);
    };
});

function getCountries(callback){
    let url = "/countries";
    $.get(url)
    .done(function(data){
        callback(data);
    });
    
};

