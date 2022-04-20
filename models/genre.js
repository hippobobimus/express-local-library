import mongoose from 'mongoose';
const { Schema } = mongoose;

const GenreSchema = new Schema({
  name: {type: String, required: true, minLength: 3, maxLength: 100}
});

GenreSchema.virtual('url').get((value, virtual, doc) => {
  return '/catalog/genre/' + doc._id;
})

export default mongoose.model('Genre', GenreSchema);
