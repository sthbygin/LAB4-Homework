const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: 0,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0,
        default: 0
    }
}, {
    timestamps: true
});

productSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
    }
});

productSchema.set('toObject', {
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Product', productSchema);
