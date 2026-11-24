const Product = require('../models/Product');
const Category = require('../models/Category');

const getProducts = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.categoryId) {
            filter.categoryId = req.query.categoryId;
        }

        const products = await Product.find(filter).sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const { name, categoryId, quantity, price } = req.body;

        if (!name || !categoryId || quantity === undefined || price === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required product fields (name, categoryId, quantity, price)'
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category: category does not exist'
            });
        }

        const product = await Product.create({
            name: name.trim(),
            categoryId,
            quantity: Number(quantity),
            price: Number(price)
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, categoryId, quantity, price } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (categoryId !== undefined) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category: category does not exist'
                });
            }
            product.categoryId = categoryId;
        }

        if (name !== undefined) product.name = name.trim();
        if (quantity !== undefined) product.quantity = Number(quantity);
        if (price !== undefined) product.price = Number(price);

        await product.save();

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
};

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
