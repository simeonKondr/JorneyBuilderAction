var connection = new Postmonger.Session();
var payload = {};
var getDataExtentionsQuery = '/events?token=@token&id=@id';
var selectedPhoneField;
var token, eventDefinitionId;
$(window).ready(onRender);

connection.on('initActivity', initialize);
connection.on('clickedNext', save);
connection.on('requestedTokens', requestedTokens);
connection.on('requestedEndpoints', requestedEndpoints);
connection.on('requestedCulture', requestedCulture);
connection.on('requestedInteractionDefaults', requestedInteractionDefaults);
connection.on('requestedInteraction', requestedInteraction);

function onRender() {
    connection.trigger('requestTokens');
    connection.trigger('requestInteraction');
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
    try {
        if (inArguments.length > 0) {
            var values = inArguments[inArguments.length - 1];
            $("textarea#message-template-input").val(values.message);
            selectedPhoneField = values.phoneNumber;
        }
    } catch (error) {
        console.error(error);
    }
    console.log("Data", data);
}

function save() {
    try {
        var formData = {};
        formData.message = $("textarea#message-template-input").val();
        formData.phoneNumber = document.getElementById("phone-parameter").val();
        payload['arguments'].execute.inArguments.push(formData);
        payload.name = 'asdfersde';
        payload['metaData'].isConfigured = true;
    } catch (error) {
        console.error(error);
    }
    console.log("Data ", JSON.stringify(payload));
    connection.trigger('updateActivity', payload);
}


function requestedTokens(data) {
    token = data.fuel2token;
    loadData()
}

function requestedInteraction(data) {
    eventDefinitionId = data.triggers[0].metaData.eventDefinitionId;
    loadData();
}

function sendTestSMS(){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/testSend");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    console.log("sdsd");
    console.log($("input#test-msisdn-input").val());

    let requestPayload = {
        phoneNumber: $("input#test-msisdn-input").val(),
        message: $("textarea#message-template-input").val()
    };
    xhr.send(JSON.stringify(requestPayload));
}

function loadData(){
    if (token && eventDefinitionId){
        getDataExtentionsQuery = getDataExtentionsQuery.replace('@token',token).replace('@id',eventDefinitionId)
        loadDataExtention();
    }
}

function loadDataExtention(){
    var serverEvents = new EventSource(getDataExtentionsQuery);
    serverEvents.onmessage = function (event){
        console.log(event.data);
        fillFieldsData(event.data);
    };
}

function fillFieldsData(data){
    let data = [
        { name: 'Date', type: 'Phone' },
        { name: 'Value', type: 'Decimal' },
        { name: 'Tansaction Id', type: 'Text' },
        { name: 'Subscriber', type: 'Text' }
      ];
    data.forEach(field => {
        if (field.type === 'Phone'){
            let elemSelect = document.createElement('option');
            elemSelect.value = field.name;
            elemSelect.innerText = field.name;
            elemSelect.setAttribute("value", field.name);
            elemSelect.setAttribute("id", field.name);
            document.getElementById("phone-parameter").appendChild(elemSelect);
        }
        let elemLi = document.createElement('li');
        elemLi.innerText = '%%' + field.name + '%%';
        document.getElementById("placeholder-list").appendChild(elemLi);
    })
    document.getElementById("phone-parameter").value = selectedPhoneField;
}
