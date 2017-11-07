exports.handler = function(context, event, callback) {

let twiml = new Twilio.twiml.VoiceResponse();
let level2FunctionUrl = process.env.LEVEL_2_FUNCTION_URL;
 
function  redirectCall() {
      twiml.redirect({ method: 'GET' }, level2FunctionUrl);
}

function isCallRefused(event){

    if ( event.AnsweredBy == 'machine_start' || event.DialCallStatus == 'no-answer' || event.DialCallStatus == 'busy' || event.DialCallStatus == 'failed' ) {
        redirectCall();    
    }
}

isCallRefused(event);   
callback(null, twiml);

};
