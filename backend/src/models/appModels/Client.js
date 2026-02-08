const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid 10-digit phone number!`,
    },
  },
  country: String,
  address: String,
  email: String,
  customerId: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  fatherName: String,
  dob: Date,
  aadharCardNumber: String,
  panCardNumber: String,
  drivingLicence: String,
  // Nominee Details
  nomineeName: String,
  nomineeFatherHusbandName: String,
  nomineeRelationship: String,
  nomineeDob: Date,
  nomineeMobile: String,
  nomineeAddress: String,

  // GST Details
  state: String,
  gstin: String,
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Client', schema);
