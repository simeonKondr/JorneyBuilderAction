const express = require('express'); //Import the express dependency
const jwt = require('jsonwebtoken');
const app = express();              
const port = process.env.PORT || 5000;                  //Save the port number where your server will be listening
const soapRequest = require('easy-soap-request');
const fs = require('fs');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom')
const http = require('http')
const bodyParser = require('body-parser'); 
const { response } = require('express');
const SOAP_REQUEST_URL = 'https://mckf95dtmppfrvw982c7b765cmq1.soap.marketingcloudapis.com/service.asmx';
const REST_REQUEST_URL = 'https://mckf95dtmppfrvw982c7b765cmq1.rest.marketingcloudapis.com';
const EVEN_DEFINITIONS_ENDPOINT = '/interaction/v1/eventDefinitions/'
const TOKEN_PARAM = '@oauthToken';
const FILTER_VALUE_PARAM = '@filterValue';
const JWT_TOKEN = 'QNw0mcOypEGwiXwvQ_wqoKfIcILsmu9nZ8eIfBKIFqfxJJOxsCaFS_Jb94LoHY3Sff-DS_s1a4Be4hbHH0SC6WaorIvJ1gx6CT1soFmgtO0apTOzepahB8MA1Ml43pnQDArZsw_nOW4J8uxbIgGh3L3IXhZsOdKw71QvWBPFeYOU8XndrNTorPU_wEtEwfilTN1IhgKNmURqjhDaUhA4hwK309skDRURvJLXCBXa6r-J4fZXeVup-u3oW8EZqw2';
const fetch = require('cross-fetch'); 

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname));

// app.get('/events', (req, res) => {
//     res.setHeader('Content-Type', 'text/event-stream')
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     let id = req.query.id;
//     let token = req.query.token;
//     // const id = '21BFF107-B4CF-4ECF-B959-73699AB89CD7', token='eyJhbGciOiJIUzI1NiIsImtpZCI6IjQiLCJ2ZXIiOiIxIiwidHlwIjoiSldUIn0.eyJhY2Nlc3NfdG9rZW4iOiJXMkNXOUZPdkV6VEswdXp2VTQ5NHI4aHIiLCJjbGllbnRfaWQiOiJ6MDBzMGE0MHB3MzNseHAyd3oxNmRtNm0iLCJlaWQiOjUzNjAwMjA0OCwic3RhY2tfa2V5IjoiUzUxIiwicGxhdGZvcm1fdmVyc2lvbiI6MiwiY2xpZW50X3R5cGUiOiJTZXJ2ZXJUb1NlcnZlciIsInBpZCI6MTc4fQ.AWvErR9vXB53azerua4t2aWXEMhyoH1AXu-cn4ghV80._FK4h2-vlGAs3a7loA-DkdyJ585iGDTl2uCOHxta9h2qO9uw1QkgW4_57OhZpZ_PACshwICYgOMd06yPIXRF0uaRO2Q00rvTaYw-aCxLjDRAvh_wODacErr3kgJckDkbtBkByGo6my1vTVb0WRe30kd4TmJVVJqw9CiqP';
//     getData(id, token).then(val => {
//         console.log(val)
//         res.write(val);
//     });
// })

app.post('/testSend', (req, res) => {
    let phone = req.body.phoneNumber;     
    let message = req.body.message;
    var token = jwt.sign(req.body, JWT_TOKEN);
    var options = {
        method: "POST",
        body: token
    }
    res.end('{"success":"true"}');
    return fetch('https://end2s2sse3ylv.x.pipedream.net/', options).then(data => {
        return data.json();
    }, reason => console.log(reason) ).then(data => {
        console.log(data);
    })
})

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});

// getData().then(val => console.log(val));

function getData(id, token){
    return getEventDefinition(id, token).then(json => {
        let xml = fs.readFileSync('SOAPEnvelopes/getObjectById.xml', 'utf-8').replace(TOKEN_PARAM, token).replace(FILTER_VALUE_PARAM, json.arguments.dataExtensionId);
        return makeRequest(xml);
    }).then(response => {
        const { headers, body, statusCode } = response.response;
        let parsedXMLBody = (new DOMParser()).parseFromString(body,"text/xml");
        let objectName = parsedXMLBody.getElementsByTagName("CustomerKey")[0].childNodes[0].nodeValue;
        let xml = fs.readFileSync('SOAPEnvelopes/getObjectFields.xml', 'utf-8').replace(TOKEN_PARAM, token).replace(FILTER_VALUE_PARAM, objectName);
        return makeRequest(xml);
    }).then(response => {
        const { headers, body, statusCode } = response.response;
        return getFields(body);
    })
}

function makeRequest(xml) {
    const url = SOAP_REQUEST_URL;
    const sampleHeaders = {
    'user-agent': 'MarketingCloud',
    'Content-Type': 'text/xml;charset=UTF-8',
    'soapAction': 'Retrieve',
    };
    return soapRequest({ url: url, headers: sampleHeaders, xml: xml, timeout: 10000 });
}

function getEventDefinition(id, token){
    var options = {
        method: "GET",
        headers: {
          "Authorization" : "Bearer "+ token,
          "Content-Type": "application/json"
        }
    }
    return fetch(REST_REQUEST_URL+EVEN_DEFINITIONS_ENDPOINT + id, options).then(data => {
        return data.json();
    }, reason => console.log(reason) )
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