;
var restify = require('restify');
var builder = require('botbuilder');
require('dotenv-extended').load();

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
//var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/c449a0f8-86a6-4374-b4f7-ea124b11d692?subscription-key=a7b401710041460eba2408ee74e17be9&verbose=true&timezoneOffset=0&q='
var recognizer = new builder.LuisRecognizer(model)
var dialog = new builder.IntentDialog({recognizers: [recognizer]});

myObj = {'username':'null', 'issueType':'null', 'deviceType':'null', 'macaddr':'null', 'resHall':'null'};

bot.dialog('/', dialog)
    //========================
    //LUIS Dialog
    //========================

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
    .matches('username',emailResponce)

    //==========
    //reset in event of wrong answers
    //==========
    .matches('restart', restartResponse)
    .onDefault((session, results) => 
    {
        session.send("Sorry, I didn't understand");
    })

//==========
//Base issue
//==========
function connectionResponse(session)
{
    session.send("Is it a wireless or wired issue?");
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
        session.send("Do you know how to find your MAC Address of your device?");
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
        session.send("What residence hall do you live in?");
    }
    else
    {
        sendRestartPrompt(session, "MAC Address", myObj.macaddr);
    }
}
function yesResponse(session)
{
    session.send("What is your MAC Address?");
}
function noResponse(session)
{
    session.send("Try going to Bing, and searching \"%s find MAC Address. Can you find it now?\"", myObj.deviceType);
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
        session.send("What is your Carthage email?");
    }
    else
    {
        sendRestartPrompt(session, "residence hall", myObj.resHall);
    }
}

//==========
//Email
//==========

function emailResponce(session)
{
    var user = session.message.text;
    if(myObj.username == 'null')
    {
        myObj.username = user;
        
        if(myObj.issueType != 'null')
        {
            session.send("You are having a %s connectivity problem", myObj.issueType);
        }
        else
        {
            session.send("You have not stated whether your issue was wired or wirelss. If you would like, do so now.");
        }
        
        if(myObj.deviceType != 'null')
        {
            session.send("The issue is on your %s", myObj.deviceType);
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
        
        session.send("Your email is %s", myObj.username);
    }
    else
    {
        sendRestartPrompt(session, "Carthage email", myObj.username);
    }
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