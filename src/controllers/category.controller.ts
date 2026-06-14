import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import categoryService from '../services/category.service';

export class CategoryController {
  async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      sendSuccess(res, 200, 'Categories fetched successfully', categories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, icon, color } = req.body;

      if (!name) {
        sendError(res, 400, 'Category name is required');
        return;
      }

      const category = await categoryService.createCategory(name, icon, color);
      sendSuccess(res, 201, 'Category created successfully', category);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      sendSuccess(res, 200, 'Category updated successfully', category);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      sendSuccess(res, 200, result.message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }
}

export default new CategoryController();