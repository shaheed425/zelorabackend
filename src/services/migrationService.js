const axios = require('axios');
const Category = require('../models/Category');
const Product = require('../models/Product');
const MigrationLog = require('../models/MigrationLog');
const createSlug = require('../utils/slugify');
const { downloadAndStoreImage } = require('./imageService');

let currentMigrationState = {
  status: 'idle', // idle, processing, completed, failed
  progress: 0,
  total: 0,
  processed: 0,
  imported: 0,
  skipped: 0,
  failed: 0,
  logs: [],
  startedAt: null,
  completedAt: null,
};

function getMigrationStatus() {
  return currentMigrationState;
}

async function startCatalogueMigration({ downloadImages = true } = {}) {
  if (currentMigrationState.status === 'processing') {
    return { success: false, message: 'Migration is already in progress' };
  }

  currentMigrationState = {
    status: 'processing',
    progress: 0,
    total: 0,
    processed: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    logs: [],
    startedAt: new Date(),
    completedAt: null,
  };

  // Run asynchronously so caller doesn't block
  runMigrationTask(downloadImages).catch(err => {
    console.error('Migration Task Unhandled Error:', err);
    currentMigrationState.status = 'failed';
    currentMigrationState.completedAt = new Date();
  });

  return { success: true, message: 'Catalogue migration started asynchronously' };
}

async function runMigrationTask(downloadImages) {
  const BASE_API = 'https://mediumturquoise-hedgehog-393181.hostingersite.com/api';

  try {
    console.log('🚀 Starting Lagro Furniture catalogue migration...');

    // 1. Fetch Categories
    console.log('Fetching categories from source...');
    const catRes = await axios.get(`${BASE_API}/get-all-categories`, { timeout: 15000 });
    const categoriesData = catRes.data?.data || [];
    console.log(`Discovered ${categoriesData.length} categories.`);

    const categoryMap = {}; // externalId or slug -> Mongo Category ID

    for (const cat of categoriesData) {
      const slug = createSlug(cat.slug || cat.category_name);
      let existingCat = await Category.findOne({ $or: [{ externalId: cat.id }, { slug }] });

      let catImageUrl = cat.icon || '';
      if (downloadImages && catImageUrl) {
        const storedImg = await downloadAndStoreImage(catImageUrl, 'categories', slug);
        if (storedImg) catImageUrl = storedImg.url;
      }

      if (!existingCat) {
        existingCat = await Category.create({
          name: cat.category_name,
          slug,
          description: cat.description || `Explore luxury ${cat.category_name} crafted for modern living spaces.`,
          image: catImageUrl,
          externalId: cat.id,
          isActive: true,
        });
        console.log(`Created Category: ${existingCat.name}`);
      } else {
        existingCat.name = cat.category_name;
        if (catImageUrl) existingCat.image = catImageUrl;
        await existingCat.save();
      }

      categoryMap[cat.id] = existingCat._id;
      categoryMap[slug] = existingCat._id;
    }

    // Default category fallback
    let defaultCat = await Category.findOne({ slug: 'furniture' });
    if (!defaultCat) {
      defaultCat = await Category.create({
        name: 'Furniture',
        slug: 'furniture',
        description: 'General premium furniture collection',
        isActive: true,
      });
    }

    // 2. Fetch Special Flags (New Arrivals & Trending)
    const newArrivalIds = new Set();
    const trendingIds = new Set();

    try {
      const newRes = await axios.post(`${BASE_API}/new-products`, {}, { timeout: 10000 });
      if (newRes.data?.products) {
        newRes.data.products.forEach(p => newArrivalIds.add(p.id));
      }
    } catch (e) {
      console.warn('Failed to fetch new-products list:', e.message);
    }

    try {
      const trendRes = await axios.post(`${BASE_API}/trending-products`, {}, { timeout: 10000 });
      if (trendRes.data?.products) {
        trendRes.data.products.forEach(p => trendingIds.add(p.id));
      }
    } catch (e) {
      console.warn('Failed to fetch trending-products list:', e.message);
    }

    // 3. Fetch Products
    console.log('Fetching products from source...');
    const prodRes = await axios.get(`${BASE_API}/get-all-products`, { timeout: 20000 });
    const productsData = prodRes.data?.products || [];
    console.log(`Discovered ${productsData.length} products.`);

    currentMigrationState.total = productsData.length;

    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      currentMigrationState.processed++;
      currentMigrationState.progress = Math.round((currentMigrationState.processed / currentMigrationState.total) * 100);

      try {
        const slug = createSlug(p.slug || p.product_name);

        // Check duplicate by externalId or slug
        let existingProd = await Product.findOne({ $or: [{ externalId: p.id }, { slug }] });

        let categoryId = categoryMap[p.category_id] || (p.category ? categoryMap[p.category.slug] : null) || defaultCat._id;

        // If category is provided in object
        if (p.category && (!categoryId || categoryId.toString() === defaultCat._id.toString())) {
          const catSlug = createSlug(p.category.slug || p.category.category_name);
          let inlineCat = await Category.findOne({ slug: catSlug });
          if (!inlineCat) {
            inlineCat = await Category.create({
              name: p.category.category_name,
              slug: catSlug,
              externalId: p.category.id,
            });
          }
          categoryId = inlineCat._id;
        }

        // Process Prices & SKU from sku_new
        let mainSku = '';
        let price = 45000; // default luxury base price if missing
        let salePrice = 0;
        let stockStatus = 'in-stock';
        let rawImages = [];

        if (p.image1) rawImages.push(p.image1);

        if (Array.isArray(p.sku_new) && p.sku_new.length > 0) {
          const defaultSku = p.sku_new.find(s => s.is_default === 'yes') || p.sku_new[0];
          mainSku = defaultSku.sku || `SKU-${p.id}`;
          if (defaultSku.price) price = Number(defaultSku.price);
          if (defaultSku.special_price) salePrice = Number(defaultSku.special_price);
          if (defaultSku.stock_status) stockStatus = defaultSku.stock_status;

          // Extract gallery images from SKUs
          p.sku_new.forEach(s => {
            if (Array.isArray(s.sku_images)) {
              s.sku_images.forEach(imgObj => {
                if (imgObj.image) rawImages.push(imgObj.image);
              });
            }
          });
        }

        // Deduplicate images
        rawImages = [...new Set(rawImages)];

        // Download & process images
        let processedImages = [];
        let featuredImage = '';

        for (let imgIndex = 0; imgIndex < rawImages.length; imgIndex++) {
          const rawUrl = rawImages[imgIndex];
          if (downloadImages) {
            const stored = await downloadAndStoreImage(rawUrl, 'products', `${slug}-${imgIndex}`);
            if (stored) {
              processedImages.push({
                url: stored.url,
                publicId: stored.publicId,
                alt: p.product_name,
                order: imgIndex,
              });
            }
          } else {
            processedImages.push({
              url: rawUrl,
              publicId: '',
              alt: p.product_name,
              order: imgIndex,
            });
          }
        }

        if (processedImages.length > 0) {
          featuredImage = processedImages[0].url;
        }

        // Build specifications
        const specifications = [
          { name: 'Brand', value: p.brand || 'ZELORA Studio' },
          { name: 'Type', value: p.type || 'Crafted Furniture' },
          { name: 'Warranty', value: '5 Years Manufacturer Warranty' },
          { name: 'Assembly', value: 'Free Professional Setup Included' },
        ];

        // Extract colors from variants
        const colors = [];
        if (Array.isArray(p.variants)) {
          p.variants.forEach(v => {
            if (v.variant_options && Array.isArray(v.variant_options)) {
              v.variant_options.forEach(opt => {
                if (opt.option_name) colors.push(opt.option_name);
              });
            }
          });
        }

        const isNewArrival = newArrivalIds.has(p.id) || i < 15;
        const isTrending = trendingIds.has(p.id) || (i >= 15 && i < 35);
        const isFeatured = i % 5 === 0;

        const productPayload = {
          name: p.product_name,
          slug,
          sku: mainSku,
          category: categoryId,
          subcategory: p.category ? p.category.category_name : '',
          description: p.description || p.short_description || 'Elegantly designed furniture combining luxury aesthetics with ergonomic comfort.',
          shortDescription: p.short_description || 'Premium furniture crafted for modern living spaces.',
          price,
          salePrice: salePrice < price ? salePrice : 0,
          currency: 'INR',
          images: processedImages,
          featuredImage,
          specifications,
          materials: 'Solid Teak Wood / Premium High-Density Foam / Upholstered Fabric',
          colors: [...new Set(colors)],
          tags: [p.brand, p.category ? p.category.category_name : '', 'luxury', 'furniture'],
          badges: p.badge ? [p.badge] : (isNewArrival ? ['NEW'] : (isTrending ? ['TRENDING'] : [])),
          isFeatured,
          isTrending,
          isNewArrival,
          isActive: true,
          stockStatus,
          externalId: p.id,
          sourceUrl: `https://lagrofurni.com/product/${slug}`,
        };

        if (!existingProd) {
          await Product.create(productPayload);
          currentMigrationState.imported++;
        } else {
          await Product.updateOne({ _id: existingProd._id }, { $set: productPayload });
          currentMigrationState.imported++;
        }

        // Save migration log
        await MigrationLog.create({
          sourceUrl: productPayload.sourceUrl,
          productName: p.product_name,
          status: 'completed',
          imagesFound: rawImages.length,
          imagesImported: processedImages.length,
        });

      } catch (prodErr) {
        console.error(`Error migrating product ${p.product_name}:`, prodErr.message);
        currentMigrationState.failed++;
        await MigrationLog.create({
          sourceUrl: `https://lagrofurni.com/product/${p.slug}`,
          productName: p.product_name || 'Unknown',
          status: 'failed',
          error: prodErr.message,
        });
      }
    }

    currentMigrationState.status = 'completed';
    currentMigrationState.completedAt = new Date();
    console.log(`✅ Catalogue Migration Completed! ${currentMigrationState.imported} products imported/updated.`);

  } catch (err) {
    console.error('❌ Migration Error:', err);
    currentMigrationState.status = 'failed';
    currentMigrationState.completedAt = new Date();
    throw err;
  }
}

module.exports = {
  startCatalogueMigration,
  getMigrationStatus,
  runMigrationTask,
};
