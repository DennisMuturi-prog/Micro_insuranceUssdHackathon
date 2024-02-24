const express=require('express');
const router=express.Router();
router.post('/',(req,res)=>{
    const xmlResponse=`
    <Response>
        <Say voice="en-US-Standard-C" playBeep="false" >Hello Negroe</Say>
    </Response>`
    res.send(xmlResponse);
})
module.exports=router;