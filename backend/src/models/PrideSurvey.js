const mongoose = require("mongoose");

const PrideSurveySchema = new mongoose.Schema({
  surveyId: String,
  surveyDate: Date,

  location: {
    district: String,
    taluka: String,
    villageOrCity: String
  },

  surveyorName: String,

  personal: {
    fullName: String,
    preferredName: String,
    dob: Date,
    age: Number,
    genderIdentity: String,
    education: String,
    mobile: String,
    hasIdProof: Boolean
  },

  family: {
    livingWith: String,
    familyRelation: String,
    facedDiscrimination: Boolean,
    discriminationDetails: String
  },

  transgenderHistory: {
    realizationAge: String,
    challenges: String,
    hasHealthAccess: Boolean
  },

  economic: {
    incomeSource: String,
    monthlyIncomeRange: String,
    hasBankAccount: Boolean,
    availsSchemes: Boolean
  },

  skills: {
    skills: [String],
    wantsToLearn: Boolean
  },

  expectations: {
    expectationsText: String,
    expectedTransformation: [String]
  },

  baselineIndicators: {
    monthlyIncome: String,
    employmentStatus: String,
    socialAcceptance: String,
    confidence: String,
    healthAccess: String
  }

}, { timestamps: true });

module.exports = mongoose.model("PrideSurvey", PrideSurveySchema);
