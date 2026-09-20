const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { _id: true });

const colorVariantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  image: { type: String, default: '' },
  hex: { type: String, default: '' },
}, { _id: false });

const specSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subcategory: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    shortDescription: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    images: [imageSchema],
    featuredImage: {
      type: String,
      default: '',
    },
    specifications: [specSchema],
    dimensions: {
      type: String,
      default: '',
    },
    height: {
      type: String,
      default: '',
    },
    width: {
      type: String,
      default: '',
    },
    depth: {
      type: String,
      default: '',
    },
    materials: {
      type: String,
      default: '',
    },
    colors: [{ type: String }],
    colorVariants: [colorVariantSchema],
    tags: [{ type: String }],
    badges: [{ type: String }],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stockStatus: {
      type: String,
      enum: ['in-stock', 'out-of-stock'],
      default: 'in-stock',
    },
    views: {
      type: Number,
      default: 0,
    },
    externalId: {
      type: Number,
      default: null,
    },
    sourceUrl: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

// Search indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1, isFeatured: 1, isTrending: 1, isNewArrival: 1 });

module.exports = mongoose.model('Product', productSchema);
