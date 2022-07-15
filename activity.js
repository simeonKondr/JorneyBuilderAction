var connection = new Postmonger.Session();
var payload = {};

$(window).ready(onRender);

connection.on('initActivity', initialize);
connection.on('clickedNext', save);

function onRender() {
    connection.trigger('ready');
}

function initialize(data) {
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
            $("textarea#message").val(values.message);
            $("input#phoneNumber").val(values.phoneNumber);
            $("input#login").val(values.login);
            $("input#password").val(values.password);
        }
    } catch (error) {
        console.error(error);
    }
    console.log("Data", data);
}

function save() {
    try {
        var formData = {};

        formData.message = $("textarea#message").val();
        formData.phoneNumber = $("input#phoneNumber").val();
        formData.login = $("input#login").val();
        formData.password = $("input#password").val();
        payload['arguments'].execute.inArguments.push(formData);

        payload['metaData'].isConfigured = true;
    } catch (error) {
        console.error(error);
    }
    console.log("Data ", JSON.stringify(payload));
    connection.trigger('updateActivity', payload);
}