getCountries(function(data){  
    for(let i=0; i< data.length ; i++){
        let stringToAppend = "";
        stringToAppend += "<option value='"+i+"'>" + data[i].title +"</option>";
        $(".ui.dropdown").append(stringToAppend);
    };
    $(".btn.btn-danger").click(function(){
        let textToTranslate = $(".text").val();
        let dropdown = $(".ui.dropdown");
        let target = dropdown[0].value;
        let url = "/translate";
    
        $.post(url , { text : textToTranslate , target : data[target].title} , function( data ){
            $("p").text(data);
        })
    })

});


function getCountries(callback){
    let url = "/countries";
    $.get(url)
    .done(function(data){
        callback(data);
    });
    
}