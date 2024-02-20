const dotenv=require('dotenv');
dotenv.config();
const bcrypt=require('bcrypt');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const client = new MongoClient(process.env.CONNECTIONSTRING, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function registerCustomer({phoneNumber,nationalID,userPin}) {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    const hash = await bcrypt.hash(userPin,10);
    // Store hash in your password DB.
    const results = await client.db("Insurance").collection('customers').insertOne({phoneNumber:phoneNumber,nationalID:nationalID,pin:hash});
    return results;
  }  catch (error) {
    console.log('Error in insertUserUserData:', error);
  }
}
async function checkIfUserExists(phoneNumber){
    try {
        await client.connect();
        const user=await client.db("Insurance").collection('customers').find({phoneNumber:phoneNumber}).toArray();
        if(user.length){
            return user;
        }
        else{
            return false;
        }
        
    } catch (error) {
        console.log(error);   
    }

}
async function checkUserClaims(phoneNumber,claimType){
    try {
        await client.connect();
        const claims=await client.db("Insurance").collection('claims').find({phoneNumber:phoneNumber,claimType:claimType}).toArray();
        if(claims.length){
            return claims;
        }
        else{
            return false;
        }
        
    } catch (error) {
        console.log(error);   
    }

}

module.exports={registerCustomer,checkIfUserExists,checkUserClaims}
