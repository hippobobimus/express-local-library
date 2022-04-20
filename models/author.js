import mongoose from 'mongoose';
import { DateTime } from 'luxon';
const { Schema } = mongoose;

const AuthorSchema = new Schema(
  {
    firstName: { type: String, required: true, maxLength: 100 },
    lastName: { type: String, required: true, maxLength: 100 },
    dateOfBirth: { type: Date },
    dateOfDeath: { type: Date },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtual for author's full name.
AuthorSchema.virtual('name').get((value, virtual, doc) => {
  let fullName = '';

  if (doc.firstName && doc.lastName) {
    fullName = doc.lastName + ', ' + doc.firstName;
  }
  if (!doc.firstName || !doc.lastName) {
    fullName = '';
  }
  return fullName;
});

// Virtual for author's lifespan
AuthorSchema.virtual('lifespan').get((value, virtual, doc) => {
  let lifetimeString = '';
  if (doc.dateOfBirth) {
    lifetimeString = doc.dateOfBirthFormatted;
  }
  lifetimeString += ' - ';
  if (doc.dateOfDeath) {
    lifetimeString += doc.dateOfDeathFormatted;
  }
  return lifetimeString;
});

AuthorSchema.virtual('dateOfBirthFormatted').get((value, virtual, doc) => {
  return doc.dateOfBirth
    ? DateTime.fromJSDate(doc.dateOfBirth).toLocaleString(DateTime.DATE_MED)
    : '';
});

AuthorSchema.virtual('dateOfDeathFormatted').get((value, virtual, doc) => {
  return doc.dateOfDeath
    ? DateTime.fromJSDate(doc.dateOfDeath).toLocaleString(DateTime.DATE_MED)
    : '';
});

AuthorSchema.virtual('dateOfBirthFormattedForInput').get(
  (value, virtual, doc) => {
    return doc.dateOfBirth
      ? DateTime.fromJSDate(doc.dateOfBirth).toISODate()
      : '';
  }
);

AuthorSchema.virtual('dateOfDeathFormattedForInput').get(
  (value, virtual, doc) => {
    return doc.dateOfDeath
      ? DateTime.fromJSDate(doc.dateOfDeath).toISODate()
      : '';
  }
);

// Virtual for author's URL
AuthorSchema.virtual('url').get((value, virtual, doc) => {
  return '/catalog/author/' + doc._id;
});

export default mongoose.model('Author', AuthorSchema);
