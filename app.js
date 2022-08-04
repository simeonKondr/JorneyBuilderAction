const express = require('express'); //Import the express dependency
const request = require('sync-request');
const jwt = require('jsonwebtoken');
const app = express();              
const port = process.env.PORT || 5000;                  //Save the port number where your server will be listening
const soapRequest = require('easy-soap-request');
const fs = require('fs');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom')
const http = require('http')
const bodyParser = require('body-parser'); 
const { response } = require('express');
const SOAP_REQUEST_URL = 'https://mcrtlgjr-g-gwpsc952zwcc7q2vy.soap.marketingcloudapis.com/service.asmx';
const REST_REQUEST_URL = 'https://mcrtlgjr-g-gwpsc952zwcc7q2vy.rest.marketingcloudapis.com';
const SOAP_OAUTH_REQUEST_URL = 'https://mcrtlgjr-g-gwpsc952zwcc7q2vy.auth.marketingcloudapis.com//v2/token';
const EVEN_DEFINITIONS_ENDPOINT = '/interaction/v1/eventDefinitions/';
const INTEGRATION_ENDPOINT = "https://secure.sendia.ai/Service/MtSaleforce";
const TOKEN_PARAM = '@oauthToken';
const FILTER_VALUE_PARAM = '@filterValue';
const JWT_TOKEN = 'QNw0mcOypEGwiXwvQ_wqoKfIcILsmu9nZ8eIfBKIFqfxJJOxsCaFS_Jb94LoHY3Sff-DS_s1a4Be4hbHH0SC6WaorIvJ1gx6CT1soFmgtO0apTOzepahB8MA1Ml43pnQDArZsw_nOW4J8uxbIgGh3L3IXhZsOdKw71QvWBPFeYOU8XndrNTorPU_wEtEwfilTN1IhgKNmURqjhDaUhA4hwK309skDRURvJLXCBXa6r-J4fZXeVup-u3oW8EZqw2';
const fetch = require('cross-fetch'); 

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname));

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'application/json;')
    res.setHeader('Access-Control-Allow-Origin', '*')
    let id = req.query.id;
    let token = req.query.token;
    res.end(JSON.stringify(getData(id, token)));
})

app.post('/testSend', (req, res) => {
    testData = {
        inArguments: [
            req.body
        ]
    }
    var token = jwt.sign(testData, JWT_TOKEN);
    var options = {
        body: token,
        headers: {
            "Content-Type": "application/jwt"
        }
    }
    var newRes = request('POST', INTEGRATION_ENDPOINT, options);
    console.log('Event definition get: ' + newRes.getBody().toString());
    res.end(newRes.getBody().toString()); 
})

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});

function getData(id, token){
    let dataExtensionId = getEventDefinition(id, token);
    token = getToken(); //get another token for soap
    let objectName = getObjectNameById(dataExtensionId, token);
    return getFieldsSoapRequest(objectName, token);
}

function getObjectNameById(id, token){
    let xml = fs.readFileSync('SOAPEnvelopes/getObjectById.xml', 'utf-8').replace(TOKEN_PARAM, token).replace(FILTER_VALUE_PARAM, id);
    let response = makeRequest(xml);  
    console.log('getObjectNameById: ' + response);   
    let parsedXMLBody = (new DOMParser()).parseFromString(response,"text/xml");
    return parsedXMLBody.getElementsByTagName("CustomerKey")[0].childNodes[0].nodeValue;   
}

function getFieldsSoapRequest(objectName, token){
    let xml = fs.readFileSync('SOAPEnvelopes/getObjectFields.xml', 'utf-8').replace(TOKEN_PARAM, token).replace(FILTER_VALUE_PARAM, objectName);
    let response = makeRequest(xml);   
    console.log('getFieldsSoapRequest: ' + response); 
    return getFields(response);
}

function makeRequest(xml) {
    var options = {
        headers: {
            'user-agent': 'MarketingCloud',
            'Content-Type': 'text/xml;charset=UTF-8',
            'soapAction': 'Retrieve',
            },
        body: xml
    }
    var res = request('POST', SOAP_REQUEST_URL, options);
    return res.getBody().toString()
}

function getEventDefinition(id, token){
    var options = {
        headers: {
            "Authorization" : "Bearer "+ token,
            "Content-Type": "application/json"
            }
    }
    var res = request('GET', REST_REQUEST_URL+EVEN_DEFINITIONS_ENDPOINT + id, options);
    console.log('Event definition get: ' + res);
    return JSON.parse(res.getBody().toString()).arguments.dataExtensionId;
}

function getToken(){
    var options = {
        headers: {
            },
        body: JSON.stringify({
            client_id : "ur3x2s01glui1idzb93ojm6e",
            client_secret : "SOo8570xpiLZBBC2ycQoXhZB",
            grant_type: "client_credentials",
        })
    }
    var res = request('POST', SOAP_OAUTH_REQUEST_URL, options);
    console.log('Event definition get: ' + res.getBody().toString());
    return JSON.parse(res.getBody().toString()).access_token;
}

function getFields(body){
    let parsedXMLBody = (new DOMParser()).parseFromString(body,"text/xml");
    let elementsList = parsedXMLBody.getElementsByTagName("Results");
    let dataExtentionData = [];
    for (elem in elementsList) {
        if (!isNaN(elem)){
            dataExtentionData.push({
                name: elementsList[parseInt(elem)].getElementsByTagName('Name')[0].childNodes[0].nodeValue,
                type: elementsList[parseInt(elem)].getElementsByTagName('FieldType')[0].childNodes[0].nodeValue
            })
        }
    }
    return dataExtentionData;
}