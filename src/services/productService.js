const Product = require('../models/Product');
const Category = require('../models/Category');
const createSlug = require('../utils/slugify');
const { getPagination, getPaginationMetadata } = require('../utils/pagination');

async function getProducts(query = {}) {
  const { page, limit, skip } = getPagination(query.page, query.limit, 12);
  const filter = { isActive: true };

  // Search filter
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
      { materials: searchRegex },
    ];
  }

  // Category filter
  if (query.category) {
    if (query.category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = query.category;
    } else {
      const cat = await Category.findOne({ slug: query.category });
      if (cat) filter.category = cat._id;
    }
  }

  // Subcategory filter
  if (query.subcategory) {
    filter.subcategory = new RegExp(query.subcategory, 'i');
  }

  // Price filter
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // Flag filters
  if (query.isFeatured === 'true' || query.isFeatured === true) filter.isFeatured = true;
  if (query.isTrending === 'true' || query.isTrending === true) filter.isTrending = true;
  if (query.isNewArrival === 'true' || query.isNewArrival === true) filter.isNewArrival = true;
  if (query.stockStatus) filter.stockStatus = query.stockStatus;

  // Sorting
  let sort = { createdAt: -1 };
  if (query.sortBy) {
    if (query.sortBy === 'price_asc') sort = { price: 1 };
    if (query.sortBy === 'price_desc') sort = { price: -1 };
    if (query.sortBy === 'popular') sort = { views: -1 };
    if (query.sortBy === 'name_asc') sort = { name: 1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const pagination = getPaginationMetadata(total, page, limit);

  return { products, pagination };
}

async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug }).populate('category', 'name slug description');
  if (product) {
    product.views += 1;
    await product.save();
  }
  return product;
}

module.exports = {
  getProducts,
  getProductBySlug,
};
