const express=require('express');
const bodyParser=require('body-parser');
const {registerCustomer,checkIfUserExists,checkUserClaims}=require('./database');
const {sendMessage}=require('./smsServer');
const claims=['Claims','Hospitalization','Outpatient','Prescription Medication','Emergency Room Claim','Maternity and New Born Claim'];
const app=express();
function checkHowManyStars(text){
    return (text.match(/\*/g) || []).length;
}
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.post('/ussd',async (req,res)=>{
    const {
        sessionId,
        serviceCode,
        phoneNumber,
        text
    }=req.body;
    let response='';
    const userExists=await checkIfUserExists(phoneNumber);
    if(userExists.length){
        if(text==''){
            response=`CON Welcome to Muturi MicroInsurance Services
            1.Check Account Info
            2.Claims
            3.Premiums
            4.Insurance products
            5.Learn more about Products
            6.Change Account Credentials`
        }
        else if(text=='1'){
            response=`END Account Details
            Phone Number: ${phoneNumber}
            nationalID:${userExists[0].nationalID}`
            const smsResponse=`Account Details
            Phone Number: ${phoneNumber}
            nationalID:${userExists[0].nationalID}`;
            sendMessage(phoneNumber,smsResponse);
        }
        else if(text=='2'){
            response=`CON Choose type of Claim
            1.Hospitalization Claim
            2.Outpatient Care Claim
            3.Prescription Medication Claim
            4.Emergency Room Claim
            5.Maternity and NewBorn Care Claim
            `
        }
        else if (/^2\*\d$/.test(text)){
            const [appMenu,claim]=text.split('*');
            response=`CON ${claims[claim]} claim
            1.My ${claims[claim]} claims
            2.Submit a new claim`;
        }
        else if (/^2\*\d\*\d$/.test(text)){
            const [appMenu,claim,claim1]=text.split('*');
            if(claim1=='1'){
                const userclaims=await checkUserClaims(phoneNumber,claims[claim]);
                response='END '
                if(userclaims.length){
                    console.log(userclaims);
                    let smsResponse='';
                    for(let userclaim of userclaims){
                        response+=`patientname:${userclaim.patient_name}
                        healthcare provider:${userclaim.healthcare_provider}
                        billing Amount:${userclaim.billing_amount}
                        approval status:${userclaim.status}`
                        smsResponse+=`patientname:${userclaim.patient_name}
                        healthcare provider:${userclaim.healthcare_provider}
                        billing Amount:${userclaim.billing_amount}
                        approval status:${userclaim.status}`
                    }
                    sendMessage(phoneNumber,smsResponse);
                }
                else{
                    response+=`You have no ${claims[claim]} claims at the moment`;
                    const smsResponse=`You have no ${claims[claim]} claims at the moment`;
                    sendMessage(phoneNumber,smsResponse);
                }

            }
            else if(claim1=='2'){
                response='CON Enter Policy Number:'    
            }
        }
        else if(/^2\*\d\*2\*\d+$/.test(text)){
            response='CON Enter Billing Amount'
        }
        else if(/^2\*\d\*2\*\d+\*\d+$/.test(text)){
            response='CON Enter Hospital name'
        }
        else if(/^2\*\d\*2\*\d+\*\d+\*\w+$/.test(text)){
            response='CON Enter your 4 digit pin'
            console.log(response);
        }
        else if(/^2\*\d\*2\*\d+\*\d+\*\w+\*\d+$/.test(text)){ 
        }

    }
    else{
        if(text==''){
        response=`CON Welcome to Muturi MicroInsurance Services
        1.Register
        2.Learn about our insurance products`
        }
        else if(text=='1'){
            response=`CON Thank you for your interest in registering for our service
            Enter your National ID:`;
        }
        else if(checkHowManyStars(text)==1){
            if (/^1\*\d{8}$/.test(text)){
                let [appMenu,nationalId]=text.split('*');
                console.log(nationalId);
                response=`CON Enter a 4 digit pin for security:`;
            }
            else{
                let [appMenu,nationalId]=text.split('*');
                console.log(nationalId);
                response=`END Your national ID format is wrong,it should have 8digits.Try again later with correct format.`;
            }
        }
        else if(checkHowManyStars(text)==2){
            if(/^1\*\d{8}\*\d{4}$/.test(text)){
                let [appMenu1,nationalID,userPin]=text.split('*');
                console.log(userPin);
                const userDetails={
                    phoneNumber,
                    nationalID,
                    userPin
                }
                console.log(userDetails);
                try {
                    const result = await registerCustomer(userDetails);
                    if (result) {
                        response = `END You are now a registered customer.`;
                        const smsResponse='Welcome to Muturi MicroInsurance,your home of health insurance.You can dial *384*37351# to enroll to our products.';
                        sendMessage(phoneNumber,smsResponse);
                    } 
                    else {
                        response = `END Registration failed, try again later.`;
                    }
                } 
                catch (error) {
                    console.error('Error during registration:', error);
                    response = `END An error occurred during registration. Please try again later.`;
                }
            }
            else{
                let [appMenu1,appMenu2,userPin]=text.split('*');
                console.log(userPin);
                response=`END You pin format is wrong ,your pin must have 4 digits.Try again later.`   
            }
        }
    }
    res.set('Content-Type:text/plain');
    res.send(response);
})
app.listen(8080,()=>{
    console.log('ussd running')
})
