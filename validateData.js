const axios=require('axios');
async function validateData({name,dob,salary,illness,medicalCondition,surgery,hereditaryCondition}){
    let problems=[];
    let nameRegex = /^[a-zA-Z\s]+$/;
if (!nameRegex.test(name)) {
    console.log("Invalid name. Name should contain only letters and spaces.");
}

// Validate date of birth (should be in dd-mm-yyyy format)
let dobRegex = /^\d{2}-\d{2}-\d{4}$/;
if (!dobRegex.test(dob)) {
    console.log("Invalid date of birth. Date of birth should be in dd-mm-yyyy format.");
    problems.push("Invalid date of birth. Date of birth should be in dd-mm-yyyy format.")
}
// Validate salary (should be a positive number)
if (isNaN(salary) || salary < 0) {
    console.log("Invalid salary. Salary should be a positive number.");
    problems.push("Invalid salary. Salary should be a positive number.");
}
const illnessResult=await axios.get(`https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${illness}`);
if(illnessResult.data[0]==0){
    console.log('no such illness');
    problems.push('no such illness exists');
}
const medicalConditionResult=await axios.get(`https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${medicalCondition}`);
if(medicalConditionResult.data[0]==0){
    console.log('no such medicalCondition');
    problems.push('no such medical Condition exists');
}
const surgeryResult=await axios.get(`https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${surgery}`);
if(surgeryResult.data[0]==0){
    console.log('no such surgery');
    problems.push('no such surgery exists');
}
const hereditaryConditionResult=await axios.get(`https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${hereditaryCondition}`);
if(hereditaryConditionResult.data[0]==0){
    console.log('no such hereditary condition exists');
    problems.push('no such hereditary condition exists');
}
return problems;
}
module.exports={validateData}