# Digital Library Assistant 
The Library Digital Assistant helps the user through the steps of creating a connectivity ticket. The user messages a Natural Language Processing (NLP) service in Microsoft's "Cognitive Services" suite called Language Understanding Intelligence Service (LUIS) by using Microsoft Bot Framework as a front end. LUIS will generate a keyword from the user's responses. With the keyword generated, we can predict the next steps of creating a ticket. For example, if the user inputs, "I am having a problem connecting to the Wi-Fi," LUIS will interpret this as a wireless problem, which will lead to the next logical question of, "What device seems to be giving you trouble?" After collecting all the information needed to create a ticket (problem, wired or wireless, what type of device, MAC Address, residence hall, and user's email), the Library Digital Assistant will create a ticket in the request tracker system.
