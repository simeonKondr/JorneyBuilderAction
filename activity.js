var connection = new Postmonger.Session();
var payload = {};
var getDataExtentionsQuery = '/events?token=@token&id=@id';

$(window).ready(onRender);

connection.on('initActivity', initialize);
connection.on('clickedNext', save);
connection.on('requestedTokens', requestedTokens);
connection.on('requestedEndpoints', requestedEndpoints);
connection.on('requestedCulture', requestedCulture);
connection.on('requestedInteractionDefaults', requestedInteractionDefaults);
connection.on('requestedInteraction', requestedInteraction);

// var serverEvents = new EventSource(getDataExtentionsQuery);
// serverEvents.onmessage = function (event){
//     console.log(event.data);
// };

sendTestSMS();


function onRender() {
    connection.trigger('ready');
    connection.trigger('requestTokens');
    connection.trigger('requestEndpoints');
    connection.trigger('requestCulture');
    connection.trigger('requestInteractionDefaults');
    connection.trigger('requestInteraction');
    // testSoapRequest();

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
            // $("textarea#message").val(values.message);
            // $("input#phoneNumber").val(values.phoneNumber);
        }
    } catch (error) {
        console.error(error);
    }
    console.log("Data", data);
}

function save() {
    try {
        var formData = {};

        formData.message = '$("textarea#message").val()';
        formData.phoneNumber = '$("input#phoneNumber").val()';
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
    console.log('*** requestedTokens ' + JSON.stringify(data));
}

function requestedEndpoints(data) {
    console.log('*** requestedEndpoints ' + JSON.stringify(data));
}

function requestedCulture(data) {
    console.log('*** requestedCulture ' + JSON.stringify(data));
}

function requestedInteractionDefaults(data) {
    console.log('*** requestedInteractionDefaults ' + JSON.stringify(data));
}

function requestedInteraction(data) {
    console.log('*** requestedInteraction ' + JSON.stringify(data));
}

function sendTestSMS(){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/testSend");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    let requestPayload = {
        phoneNumber: 'phone',
        message:'message'
    };
    xhr.send(JSON.stringify(requestPayload));
}
