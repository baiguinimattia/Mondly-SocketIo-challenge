$("#add-exercise").click(function(event){
    let url = "/exercise/add";
    let exercise = {};
    
    if($("#statement").val() != ""){
        exercise.statement = $("#statement").val();
    };
    if($("#variant-one").val() != ""){
        exercise.variantOne = $("#variant-one").val();
    };
    if($("#variant-two").val() != ""){
        exercise.variantTwo = $("#variant-two").val();
    };
    if($("#variant-three").val() != ""){
        exercise.variantThree = $("#variant-three").val();
    };
    if($("#variant-for").val() != ""){
        exercise.variantFor = $("#variant-for").val();
    };   
    if($("#response").val() != ""){
        exercise.response = $("#response").val();
    }
    if($("#extra").val() != ""){
        exercise.extra = $("#extra").val();
    };
    if($("#instruction").val() != ""){
        exercise.instruction = $("#instruction").val();
    };
    if($("#indicator").val() != ""){
        exercise.indicator = $("#indicator").val();
    };
    if($("#type").val() != ""){
        exercise.type = $("#type").val();
    };


    $.post(url , { exercise : exercise} , function( data ){
        
    });

});