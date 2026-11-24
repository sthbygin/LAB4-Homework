const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    }
}, {
    timestamps: true
});

categorySchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
    }
});

categorySchema.set('toObject', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Category', categorySchema);
