import mongoose from 'mongoose';
import { DateTime } from 'luxon';
const { Schema } = mongoose;

const BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, //reference to the associated book
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
    default: 'Maintenance',
  },
  due_back: { type: Date, default: Date.now },
});

BookInstanceSchema.virtual('dueBackFormatted').get((value, virtual, doc) => {
  return DateTime.fromJSDate(doc.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema.virtual('dueBackFormattedForInput').get((value, virtual, doc) => {
  return DateTime.fromJSDate(doc.due_back).toISODate();
});

BookInstanceSchema.virtual('url').get((value, virtual, doc) => {
  return '/catalog/bookinstance/' + doc._id;
});

export default mongoose.model('BookInstance', BookInstanceSchema);
