const Category = require('../models/Category');
const Product = require('../models/Product');

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ createdAt: 1 });
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const normalizedName = name.trim();
        const existing = await Category.findOne({ name: normalizedName });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        const category = await Category.create({ name: normalizedName });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const normalizedName = name.trim();
        const duplicate = await Category.findOne({ name: normalizedName, _id: { $ne: id } });
        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        category.name = normalizedName;
        await category.save();

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        await Category.findByIdAndDelete(id);
        await Product.deleteMany({ categoryId: id });

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
