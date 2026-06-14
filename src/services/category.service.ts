import Category from '../models/Category.model';
import { AppError } from '../middleware/error.middleware';
import slugify from 'slugify';

export class CategoryService {
  async getAllCategories() {
    return await Category.find({ isActive: true }).sort({ name: 1 });
  }

  async createCategory(name: string, icon?: string, color?: string) {
    const slug = slugify(name, { lower: true });

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new AppError(409, 'Category already exists');
    }

    const category = new Category({
      name,
      slug,
      icon,
      color,
    });

    await category.save();
    return category;
  }

  async updateCategory(categoryId: string, updateData: any) {
    const category = await Category.findByIdAndUpdate(categoryId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    return category;
  }

  async deleteCategory(categoryId: string) {
    const deleted = await Category.findByIdAndDelete(categoryId);

    if (!deleted) {
      throw new AppError(404, 'Category not found');
    }

    return { message: 'Category deleted successfully' };
  }
}

export default new CategoryService();