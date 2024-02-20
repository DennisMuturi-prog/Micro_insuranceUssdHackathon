const credentials={
    apiKey:'381b1e0316eeee63e93e8f9dce8ce991475a9cd197b2729076ef8cc175f2958d',
    username:'sandbox'
}
const AfricasTalking=require('africastalking')(credentials);
const sms=AfricasTalking.SMS;
function sendMessage(phonenumber,message){
    const options={
        to:phonenumber,
        message:message,
        from:'MUTURI_BIZ'
    }
    sms.send(options).then(console.log).catch(console.log);
}
//sendMessage('+254796906772','hi again');
module.exports={sendMessage}