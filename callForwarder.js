exports.handler = function(context, event, callback) {
const got = require('got');

const token = process.env.API_TOKEN || callback('No API_TOKEN defined');
const escalationPolicyId = process.env.ESCALATION_POLICY_ID || callback('No ESCALATION_POLICY_ID defined');


// Set the Default to desired escalation level or use the env variable.
const escalationLevel = parseInt(process.env.ESCALATION_LEVEL) || 1;

const pagerDutyOnCallEndpoint = process.env.PAGERDUTY_API_ENDPOINT || 'https://api.pagerduty.com/oncalls?time_zone=CET';

const deciderUrl = getDeciderUrl();

function getDeciderUrl() {

    if ( !(process.env.DECIDER_URL) && escalationLevel === 1) {
        callback('No ESCALATION_POLICY_ID defined')
    } else {
        return process.env.DECIDER_URL;
    }
}

function getOncall(item) {
        if (item.escalation_policy.id != escalationPolicyId ) { return; }
        if (item.escalation_level != escalationLevel) { return; }

        makeApiCall(item.user.self).then(function(response){
            response.body.user.contact_methods.forEach(getPhoneContact);
        })
}

function getPhoneContact(contact) {
    if (contact.type != 'phone_contact_method_reference' ) { return; }

    makeApiCall(contact.self).then(doCall)
}

function getDialParams(callerId,timeout) {
    let params = {};

    params.timeout = timeout

    if (callerId) {
        params.callerId = callerId
    }

    if (escalationLevel === 1) {
        params.method = 'GET'
        params.action = deciderUrl
    }

   return params;
}

function doCall(response) {
    let phoneNumber = `+${response.body.contact_method.country_code}${response.body.contact_method.address}`;
    let twiml = new Twilio.twiml.VoiceResponse()
    let dialParams =  getDialParams(callerId = event.CallerId, timeoutSeconds = event.Timeout || 170)

    twiml.dial(dialParams, phoneNumber);
    callback(null, twiml);
}

function retrieveOnCallUser(apiEndpoint) {

    makeApiCall(apiEndpoint).then(function(response) {

        response.body.oncalls.forEach(getOncall);

    }).catch(function(error) {

        callback(error);
    });
}

function makeApiCall(endpoint) {

    const headerOptions = {
        Authorization: 'Token token=' + token,
        Accept: 'application/vnd.pagerduty+json;version=2'
    };

    const httpOptions = {
        json: true,
        headers: headerOptions
    };

    return got(endpoint,httpOptions)
            .catch(error => callback(error) );
}

retrieveOnCallUser(pagerDutyOnCallEndpoint)

};
