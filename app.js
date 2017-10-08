;
var restify = require('restify');
var builder = require('botbuilder');
require('dotenv-extended').load();
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MY_APP_ID,
    appPassword: process.env.MY_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, '/');

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/' + process.env.LUIS_ID + '?subscription-key=' + process.env.LUIS_KEY + '&verbose=true&timezoneOffset=0&q='
var recognizer = new builder.LuisRecognizer(model)
var dialog = new builder.IntentDialog({recognizers: [recognizer]});

myObj = {'username':'null', 'issueType':'null', 'deviceType':'null', 'macaddr':'null', 'resHall':'null'};
var isDone = false;

bot.dialog('/', dialog)
    //========================
    //LUIS Dialog
    //========================

    //==========
    //Help!
    //==========
    .matches('help', helpResponse)

    //==========
    //Base issue
    //==========
    .matches('connect',connectionResponse)
    .matches('wireless', wirelessResponse)
    .matches('wired', wiredResponse)

    //=========
    //Types of devices
    //=========
    .matches('desktop', deviceResponse)
    .matches('laptop', deviceResponse)
    .matches('phone', deviceResponse)

    //==========
    //MAC Address
    //==========
    .matches('macaddress', macResponse)
    .matches('yes', yesResponse)
    .matches('no', noResponse)

    //==========
    //Building room and number
    //==========
    .matches('room',roomResponse)

    //==========
    //Email
    //==========
    .matches('username',emailResponse)

    //==========
    //reset in event of wrong answers
    //==========
    .matches('restart', restartResponse)
    .onDefault((session, results) => 
    {
        session.send("Sorry, I didn't understand");
    })

//==========
//Help!
//==========
function helpResponse(session)
{
    session.send("It's okay! I'm your Library Digital Assistant to help you get your issue to someone who can help. What appears to be the problem?")
}

//==========
//Base issue
//==========
function connectionResponse(session)
{
    session.send("First things first, are you trying to make a wired or wireless connection?");
}

function wirelessResponse(session)
{
    if(myObj.issueType == 'null')
    {
        myObj.issueType = 'wireless';
        session.send("What type of device is it?");
    }
    else
    {
        sendRestartPrompt(session, "connection type", myObj.issueType);
    }
}

function wiredResponse(session)
{
    if(myObj.issueType == 'null')
    {
        myObj.issueType = 'wired';
        session.send("What type of device is it?");
    }
    else
    {
        sendRestartPrompt(session, "connection type", myObj.issueType);
    }
}

//=========
//Types of devices
//=========
function deviceResponse(session)
{
    var typeOfDevice = session.message.text;
    if(myObj.deviceType == 'null')
    {
        myObj.deviceType = typeOfDevice;
        isDone =false;
        session.send("Do you know how to find the MAC Address of your device?");
    }
    else
    {
        sendRestartPrompt(session, "device type", myObj.deviceType);
    }
}

//==========
//MAC Address
//==========
function macResponse(session)
{
    var mac = session.message.text;
    if(myObj.macaddr == 'null')
    {
        myObj.macaddr = mac;
        session.send("Thank you! What residence hall do you live in?");
    }
    else
    {
        sendRestartPrompt(session, "MAC Address", myObj.macaddr);
    }
}
function yesResponse(session)
{
    if(!isDone)
    {
        session.send("Awesome! What is your MAC Address?");
    }
    else
    {
        var options = { method: 'POST',
        url: 'http://52.237.155.201:8080/REST/1.0/ticket/new',
        qs: { user: process.env.RT_USER, pass: process.env.RT_PASS },
        headers: 
         { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
        formData: { content: 'id:ticket/new\nSubject:'+ JSON.stringify(myObj.issueType) + ' issue with ' + JSON.stringify(myObj.deviceType) + '\n Queue: test' } };
        
        request(options, function (error, response, body) {
        if (error) throw new Error(error);
        
        console.log(body);
        });
        session.send("Thank you, your information has been collected and submitted to Request Tracker. Have a nice day!");
        for (x in myObj)
        {
            myObj[x] = "null";
        }
    }
}
function noResponse(session)
{
    if(!isDone)
    {
        session.send("Thats okay! Try going to Bing, and searching \"%s find MAC Address.\" Can you find it now?\"", myObj.deviceType);        
    }
    else
    {
        session.send("Sorry about that, lets try again then! Clearing data now...What is your issue?");
        for (x in myObj)
        {
            myObj[x] = "null";
        }
    }
}

//==========
//Building room and number
//==========
function roomResponse(session)
{
    var room = session.message.text;

    if(myObj.resHall == 'null')
    {
        myObj.resHall = room;
        session.send("Great! Last Question! What is your Carthage email?");
    }
    else
    {
        sendRestartPrompt(session, "residence hall", myObj.resHall);
    }
}

//==========
//Email
//==========

function emailResponse(session)
{
    var user = session.message.text;
    myObj.username = user;
        
    if(myObj.issueType != 'null')
    {
        session.send("You are having a %s connectivity problem", myObj.issueType);
    }
    else
    {
        session.send("You have not stated whether your issue was wired or wireless. If you would like, do so now.");
    }
        
    if(myObj.deviceType != 'null')
    {
        session.send("The issue is on a %s", myObj.deviceType);
    }
    else
    {
        session.send("You have not said what type of device you had. If you would like, do so now.");
    }

    if(myObj.macaddr != 'null')
    {
        session.send("Your MAC Address is %s", myObj.macaddr);
    }
    else
    {
        session.send("You have not given your MAC address. If you would like, do so now.");
    }

    if(myObj.resHall != 'null')
    {
        session.send("You live in %s", myObj.resHall);
    }
    else
    {
        session.send("You have not given your residence hall. If you would like, do so now.");
    }
        
    isDone = true;
    session.send("Your email is %s. If that is incorrect you can retype it", myObj.username);
    session.send("Alright! Does all the previous information look correct?");
}

//==========
//reset in event of wrong answers
//==========
function restartResponse(session)
{
    for (x in myObj)
        {
            myObj[x] = "null";
        }
    session.send("Sorry for the mistake. We've cleared all our data again, please describe your issue again.")
}

//=========
//Helper Functions
//=========
function sendRestartPrompt(session, type, userType)
{
    session.send("You've already said your %s was: %s. If that is incorrect, respond with \'reset\' to start over",type, userType);
}