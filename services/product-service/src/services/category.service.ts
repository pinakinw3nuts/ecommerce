import { AppDataSource } from '../config/dataSource';
import { Category } from '../entities/Category';
import { generateSlug } from '../utils/slugify';

export class CategoryService {
  private categoryRepo = AppDataSource.getRepository(Category);

  async createCategory(data: { name: string; description?: string }) {
    const slug = generateSlug(data.name);
    const category = this.categoryRepo.create({
      name: data.name,
      slug,
      description: data.description ?? '',
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string }>) {
    const category = await this.categoryRepo.findOneByOrFail({ id });
    if (data.name) {
      category.name = data.name;
      category.slug = generateSlug(data.name);
    }
    if (data.description !== undefined) category.description = data.description;
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string) {
    return this.categoryRepo.delete(id);
  }

  async listCategories() {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async getCategoryById(id: string) {
    return this.categoryRepo.findOneBy({ id });
  }
} 