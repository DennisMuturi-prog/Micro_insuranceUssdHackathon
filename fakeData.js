const dotenv=require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const client = new MongoClient(process.env.CONNECTIONSTRING, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const {faker} = require('@faker-js/faker');
const dbName = 'Insurance';

async function generateClaim() {
  // Generate random data for a single insurance claim
  const claimData = {
    patient_name: faker.person.fullName(),
    policyholder_name: faker.person.fullName(),
    policy_number: faker.number.int({ digits: 8 }),
    date_of_service: faker.date.between({from:'2023-01-01',to:'2024-05-05'}),
    healthcare_provider: faker.company.name(),
    diagnosis: faker.lorem.word(),
    procedure: faker.lorem.word(),
    billing_amount: faker.finance.amount({min:1000,max:200000}),
    prescription_details: faker.lorem.sentence(),
    status: Math.random() < 0.5 ? 'pending' : 'complete',
    phoneNumber: faker.phone.number(), // Adding phoneNumber field
    // Add more fields as needed
  };

  return claimData;
}
async function generateClaimWithCredentials(policyNumber,billingAmount,hospitalName,phoneNumber,claimType) {
  // Generate random data for a single insurance claim
  const claimData = {
    patient_name: faker.person.fullName(),
    policyholder_name: faker.person.fullName(),
    policy_number: policyNumber,
    date_of_service: faker.date.between({from:'2023-01-01',to:'2024-05-05'}),
    date_of_claim:new Date(),
    healthcare_provider: hospitalName,
    diagnosis: faker.lorem.word(),
    procedure: faker.lorem.word(),
    billing_amount: billingAmount,
    prescription_details: faker.lorem.sentence(),
    status: 'pending',
    phoneNumber: phoneNumber, // Adding phoneNumber field
    // Add more fields as needed
    claimType:claimType

  };

  return claimData;
}

async function insertClaimsIntoDatabase(numClaims) {
  try {
    await client.connect();
    const database = client.db(dbName);
    const claimsCollection = database.collection('claims');

    // Insert generated claims into MongoDB
    for (let i = 0; i < numClaims; i++) {
      const claim = await generateClaim();
      await claimsCollection.insertOne(claim);
    }

    console.log(`${numClaims} claims inserted into MongoDB.`);
  } finally {
    await client.close();
  }
}
async function insertClaimsIntoDatabaseWithCredentials(policyNumber,billingAmount,hospitalName,phoneNumber,claimType) {
  try {
    await client.connect();
    const database = client.db(dbName);
    const claimsCollection = database.collection('claims');
    const claim = await generateClaimWithCredentials(policyNumber,billingAmount,hospitalName,phoneNumber,claimType);
    await claimsCollection.insertOne(claim);
  }
  finally {
    await client.close();
  }
}


// Number of claims to generate and insert
const numClaimsToGenerate = 1;

// Insert generated claims into the database
//insertClaimsIntoDatabase(numClaimsToGenerate);
module.exports={insertClaimsIntoDatabaseWithCredentials};
