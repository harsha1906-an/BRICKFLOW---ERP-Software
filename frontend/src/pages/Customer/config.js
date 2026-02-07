export const fields = {
  name: {
    type: 'string',
    required: true,
  },
  country: {
    type: 'country',
    // color: 'red',
  },
  address: {
    type: 'string',
  },
  phone: {
    type: 'phone',
  },
  email: {
    type: 'email',
  },
  customerId: {
    type: 'string',
    label: 'Customer ID',
  },
  gender: {
    type: 'select',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
    ],
  },
  fatherName: {
    type: 'string',
    label: "Father's Name",
  },
  dob: {
    type: 'date',
    label: 'Date of Birth',
  },
  aadharCardNumber: {
    type: 'aadhar',
    label: 'Aadhar Card Number',
  },
  panCardNumber: {
    type: 'string',
    label: 'PAN Card Number',
  },
  drivingLicence: {
    type: 'string',
    label: 'Driving Licence',
  },
};
