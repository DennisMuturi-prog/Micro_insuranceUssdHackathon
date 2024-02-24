const express=require('express');
const bodyParser=require('body-parser');
const {registerCustomer,checkIfUserExists,checkUserClaims,authenticateUser}=require('./database');
const {validateData}=require('./validateData');
const {insertClaimsIntoDatabaseWithCredentials}=require('./fakeData');
const {tiers}=require('./tiers');
const {sendMessage}=require('./smsServer');
const claims=['Claims','Hospitalization','Outpatient','Prescription Medication','Emergency Room','Maternity and New Born'];
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
        else if(/^2\*\d\*2\*\d+\*\d+\*[\w\s]+$/.test(text)){
            response='CON Enter your 4 digit pin'
        }
        else if(/^2\*\d\*2\*\d+\*\d+\*[\w\s]+\*\d+$/.test(text)){ 
            const [appMenu1,claimType,appMenu2,policyNumber,billingAmount,hospitalName,pin]=text.split('*');
            const authenticated=await authenticateUser(phoneNumber,pin);
            if(pin.toString().length!=4){
                return res.set('Content-Type:text/plain').send('END Your pin should have 4 digits');
            }
            if(authenticated){
                insertClaimsIntoDatabaseWithCredentials(Number(policyNumber),Number(billingAmount),hospitalName,phoneNumber,claims[claimType]);
                response=`END Successfully added claim,we will notify you after screening process.
                Policy Number:${policyNumber}
                Billing Amount:${billingAmount}
                HospitalName:${hospitalName}
                Claim Type:${claims[claimType]}`
                const smsResponse=`Successfully added claim,we will notify you after screening process.
                Policy Number:${policyNumber}
                Billing Amount:${billingAmount}
                HospitalName:${hospitalName}
                Claim Type:${claims[claimType]}`;
                sendMessage(phoneNumber,smsResponse);

            }
            else{
                response='END Wrong Pin'
            }
        }
        else if(text=='4'){
            response=`CON Insurance Products
            1.Individual Health Insurance
            2.Family Health Insurance
            3.Health Savings Account
            4.Medicare
            5.Catastrophic Health Insurance`
        }
        else if(text=='4*1'){
            response=`CON This plan provides 5 tiers.Choose one:
            1.Tier 1-Preventive Care:
            2.Tier 2_Basic Services
            3.Tier 3-Specialized Services
            4.Tier 4-Hospitalization and Surgery
            5.Tier 5-Advanced and Specialty Care
            6.Tier 6-Complex Procedures`
        }
        else if(/^4\*1\*\d$/.test(text)){
            const [appmenu1,appmenu2,tier]=text.split('*');
            response=`CON Insurance Plan
            ${tiers[tier]}
            1.Enroll`
        }
        else if(/^4\*1\*\d\*1$/.test(text)){
            response=`CON Enter Full Name
            Example:John Doe`  
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+$/.test(text)){
            response=`CON Enter Date Of Birth
            Example:dd-mm-yyyy.eg 10-12-2024`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}$/.test(text)){
            response=`CON Choose Gender
            1.Male
            2.Female`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d$/.test(text)){
            response=`CON Monthly Salary or Business Profits`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+$/.test(text)){
            response=`CON Do you consider yourself to be in good health overall?
            1.Yes
            2.No`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d$/.test(text)){
            response=`CON Have you had any major illnesses or surgeries in the past?
            If yes,please specify and comma separate them
            If no,submit no`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d\*[\w\s]+$/.test(text)){
            response=`CON Do you have currently have any pre-existing medical conditions?
            If yes,please specify
            Example:diabetes,hypertension,heart disease
            If no,submit no`

        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d\*[\w\s]+\*[\w\s]+$/.test(text)){
            response=`CON Are you currently taking any prescription medications?
            If yes,list them one by one,comma separated
            example:Panadol,mara moja
            If no,submit no`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d\*[\w\s]+\*[\w\s]+\[\w\s]+$/.test(text)){
            response=`CON Have you ever been hospitalised for a medical condition?
            If yes,provide Details`   
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d\*[\w\s]+\*[\w\s]+\[\w\s]+\*[\w\s]+$/.test(text)){
            response=`CON Have you undergone any surgeries in the past?
            If yes,please sppecify the type and date
            Example:(Kidney surgery ,22-12-2026),(back surgery,10-12-2025)`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d\*[\w\s]+\*[\w\s]+\[\w\s]+\*[\w\s]+\*[\w\s]+$/.test(text)){
            response=`CON Is there a history of hereditary medical conditions in your immediate family(parents/siblings)?
            If yes,please specify`
        }
        else if(/^4\*1\*\d\*1\*[\w\s]+\*\d{2}-\d{2}-\d{4}\*\d\*\d+\*\d\*[\w\s]+\*[\w\s]+\[\w\s]+\*[\w\s]+\*[\w\s]+\*[\w\s]+$/.test(text)){
            const [appmenu1,plan,tier,appmenu2,name,dob,gender,salary,goodHealth,illness,medicalCondition,prescription,hospitalised,surgery,hereditaryCondition]=text.split('*');
            const dataToBeValidated={
                name,
                dob,
                salary,
                illness,
                medicalCondition,
                surgery,
                hereditaryCondition
            }
            const validatedData=await validateData(dataToBeValidated);
            if(validatedData.length){
                response='END Your inputs were wrong wrong,check your inbox to see the problem from our message';
                const smsResponse='';
                for(let problem of validateData){
                    smsResponse+=`
                    ${problem}`;
                }
                sendMessage(smsResponse,phoneNumber);
            }
            else{
                response=`CON Enter your 4 digit pin to confirm:`
            }
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
app.use('/incoming-messages',require('./incomingMessages'));
app.use('/inbound-calls',require('./voiceRoute'));
app.listen(8080,()=>{
    console.log('ussd running');
})
