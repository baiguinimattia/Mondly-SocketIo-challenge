getCountries(function(data){
    $('.ui.search')
    .search({
      source: data,
      category : "code"
    });
});

function getCountries(callback){
    let url = "/countries";
    $.get(url)
    .done(function(data){
        callback(data);
    });
    
}
