import { AppDataSource } from '../config/dataSource';
import { Tag } from '../entities/Tag';

async function createSampleTags() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('Database connection established.');
    const tagRepository = AppDataSource.getRepository(Tag);
    
    // Check if there are existing tags
    const existingTagCount = await tagRepository.count();
    console.log(`Found ${existingTagCount} existing tags.`);
    
    if (existingTagCount > 0) {
      console.log('Tags already exist. Skipping sample tag creation.');
      return;
    }
    
    // Sample tags data
    const sampleTags = [
      { name: 'New Arrival', slug: 'new-arrival' },
      { name: 'Featured', slug: 'featured' },
      { name: 'Best Seller', slug: 'best-seller' },
      { name: 'On Sale', slug: 'on-sale' },
      { name: 'Clearance', slug: 'clearance' },
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Home Decor', slug: 'home-decor' },
      { name: 'Sports', slug: 'sports' },
      { name: 'Books', slug: 'books' },
      { name: 'Toys', slug: 'toys' },
      { name: 'Eco-Friendly', slug: 'eco-friendly' },
      { name: 'Handmade', slug: 'handmade' },
      { name: 'Limited Edition', slug: 'limited-edition' },
      { name: 'Premium', slug: 'premium' }
    ];
    
    console.log('Creating sample tags...');
    
    for (const tagData of sampleTags) {
      const tag = new Tag();
      tag.name = tagData.name;
      tag.slug = tagData.slug;
      
      await tagRepository.save(tag);
      console.log(`Created tag: ${tag.name}`);
    }
    
    console.log('Sample tags created successfully!');
    
  } catch (error) {
    console.error('Error creating sample tags:', error);
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createSampleTags()
    .then(() => {
      console.log('Script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default createSampleTags; 