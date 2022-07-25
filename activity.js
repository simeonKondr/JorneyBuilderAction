var connection = new Postmonger.Session();
var payload = {};
var getDataExtentionsQuery = '/events?token=@token&id=@id';
var selectedPhoneField;
var token, eventDefinitionId, eventDefinitionKey;
var serverEvents;
var mergeFieldPattern = "{{Event.@eventDefinition.@field}}"
var dataExtentionLoaded = false;
var fieldsArray = [];
var fieldsMergeArray = [];
$(window).ready(onRender);

connection.on('initActivity', initialize);
connection.on('clickedNext', save);
connection.on('requestedTokens', requestedTokens);
connection.on('requestedInteraction', requestedInteraction);

function onRender() {
    connection.trigger('requestTokens');
    connection.trigger('requestInteraction');
    connection.trigger('ready');
}

function initialize(data) {
    console.log('*** init ' + JSON.stringify(data));
    if (data) {
        payload = data;
    }

    var hasInArguments = Boolean(
        payload['arguments'] &&
        payload['arguments'].execute &&
        payload['arguments'].execute.inArguments &&
        payload['arguments'].execute.inArguments.length > 0
    );

    var inArguments = hasInArguments ? payload['arguments'].execute.inArguments : {};
        if (inArguments.length > 0) {
            var values = inArguments[inArguments.length - 1];
            $("textarea#message-template-input").val(values.message);
            selectedPhoneField = values.phoneNumber;
        }    
    console.log("Data", data);
}

function save() {
    var formData = {};
    let message = $("textarea#message-template-input").val();
    fieldsArray.forEach((element, index) => {
        if (message.includes(element)){
            message = message.replaceAll(element, fieldsMergeArray[index]);
        }
    });
    formData.message = message;
    formData.phoneNumber = document.getElementById("phone-parameter").value;
    payload['arguments'].execute.inArguments = [];
    payload['arguments'].execute.inArguments.push(formData);
    payload.name = 'asdfersde';
    payload['metaData'].isConfigured = true;
    console.log("Data ", JSON.stringify(payload));
    connection.trigger('updateActivity', payload);
}


function requestedTokens(data) {
    token = data.fuel2token;
    loadData()
}

function requestedInteraction(data) {
    eventDefinitionId = data.triggers[0].metaData.eventDefinitionId;
    mergeFieldPattern = mergeFieldPattern.replace('@eventDefinition',data.triggers[0].metaData.eventDefinitionKey);
    loadData()
}

function sendTestSMS(){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/testSend");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    console.log($("input#test-msisdn-input").val());
    let requestPayload = {
        phoneNumber: $("input#test-msisdn-input").val(),
        message: $("textarea#message-template-input").val()
    };
    xhr.send(JSON.stringify(requestPayload));
}

function loadData(){
    console.log(token);
    console.log(eventDefinitionId);
    if (token && eventDefinitionId && !dataExtentionLoaded){
        console.log(token);
        console.log(eventDefinitionId);
        getDataExtentionsQuery = getDataExtentionsQuery.replace('@token',token).replace('@id',eventDefinitionId)
        const Http = new XMLHttpRequest();
        Http.open("GET", getDataExtentionsQuery);
        Http.send();
        Http.onreadystatechange = (e) => {
            if (Http.responseText){
                console.log(Http.responseText);
                fillFieldsData(JSON.parse(Http.responseText));
                dataExtentionLoaded = true;
            }
        }
        
    }
}

function fillFieldsData(data){
    let phoneElem = document.getElementById("phone-parameter");
    let selectElem = document.getElementById("placeholder-list");
    phoneElem.innerHTML = '';
    selectElem.innerHTML = '';
    data.forEach(field => {
        if (field.type != 'Phone'){
            let elemSelect = document.createElement('option');
            elemSelect.value = mergeFieldPattern.replace('@field', field.name);
            elemSelect.innerText = field.name;
            elemSelect.setAttribute("value", mergeFieldPattern.replace('@field', field.name));
            elemSelect.setAttribute("id", field.name);
            phoneElem.appendChild(elemSelect);
        }
        let elemLi = document.createElement('li');
        elemLi.innerText = '%%' + field.name + '%%';
        selectElem.appendChild(elemLi);
        fieldsArray.push('%%' + field.name + '%%');
        fieldsMergeArray.push(mergeFieldPattern.replace('@field', field.name));
    })
    phoneElem.value = selectedPhoneField;

    let message = $("textarea#message-template-input").val();
    fieldsMergeArray.forEach((element, index) => {
        if (message.includes(element)){
            message = message.replaceAll(element, fieldsArray[index]);
        }
    });
    $("textarea#message-template-input").val(message);
}
