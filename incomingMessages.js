const express=require('express');
const {checkAllUserClaims,checkIfUserExists}=require('./database');
const {sendMessage}=require('./smsServer')
const router=express.Router();
router.post('/',async (req,res)=>{
    const {text,from}=req.body;
    const userExists=await checkIfUserExists(from);
    if(userExists && text.toLowerCase()=='claims'){
        const claims=await checkAllUserClaims(from);
        let  smsResponse=''
        for(let claim of claims){
            smsResponse+=`
            patientName:${claim.patient_name}
            policyNumber:${claim.policy_number}
            Hospital:${claim.healthcare_provider}
            Procedure:${claim.procedure}
            billingAmount:${claim.billing_amount}
            status:${claim.status}
            claimType:${claim.claimType}
            
            `
        }
        sendMessage(from,smsResponse);
    }
    console.log(text);
    res.sendStatus(200);
})
module.exports=router;
