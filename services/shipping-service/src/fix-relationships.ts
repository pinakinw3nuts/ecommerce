import { AppDataSource } from './config/dataSource';
import { ShippingZone } from './entities/ShippingZone';
import { ShippingMethod } from './entities/ShippingMethod';
import { ShippingRate } from './entities/ShippingRate';

async function fixRelationships() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    console.log('Data source initialized');

    // Get all shipping methods by code
    const standardMethod = await AppDataSource.getRepository(ShippingMethod).findOne({ where: { code: 'STANDARD' } });
    const expressMethod = await AppDataSource.getRepository(ShippingMethod).findOne({ where: { code: 'EXPRESS' } });
    
    if (!standardMethod || !expressMethod) {
      console.error('Could not find standard or express shipping methods!');
      return;
    }

    console.log(`Found standard method: ${standardMethod.id}`);
    console.log(`Found express method: ${expressMethod.id}`);

    // Get zones by code
    const rajkotZone = await AppDataSource.getRepository(ShippingZone).findOne({ where: { code: 'RAJKOT_GJ_30005' } });
    const ahmedabadZone = await AppDataSource.getRepository(ShippingZone).findOne({ where: { code: 'AHMEDABAD_GJ_380002' } });

    if (!rajkotZone || !ahmedabadZone) {
      console.error('Could not find Rajkot or Ahmedabad shipping zones!');
      return;
    }

    console.log(`Found Rajkot zone: ${rajkotZone.id}`);
    console.log(`Found Ahmedabad zone: ${ahmedabadZone.id}`);

    // Fix Rajkot rates
    const rajkotStandardRate = await AppDataSource.getRepository(ShippingRate).findOne({ 
      where: { name: 'Standard Shipping (Rajkot 30005)' } 
    });
    
    const rajkotExpressRate = await AppDataSource.getRepository(ShippingRate).findOne({ 
      where: { name: 'Express Shipping (Rajkot 30005)' } 
    });

    if (rajkotStandardRate) {
      rajkotStandardRate.shippingMethodId = standardMethod.id;
      rajkotStandardRate.shippingZoneId = rajkotZone.id;
      await AppDataSource.getRepository(ShippingRate).save(rajkotStandardRate);
      console.log('Updated Rajkot standard rate');
    }

    if (rajkotExpressRate) {
      rajkotExpressRate.shippingMethodId = expressMethod.id;
      rajkotExpressRate.shippingZoneId = rajkotZone.id;
      await AppDataSource.getRepository(ShippingRate).save(rajkotExpressRate);
      console.log('Updated Rajkot express rate');
    }

    // Fix Ahmedabad rates
    const ahmedabadStandardRate = await AppDataSource.getRepository(ShippingRate).findOne({ 
      where: { name: 'Standard Shipping (Ahmedabad 380002)' } 
    });
    
    const ahmedabadExpressRate = await AppDataSource.getRepository(ShippingRate).findOne({ 
      where: { name: 'Express Shipping (Ahmedabad 380002)' } 
    });

    if (ahmedabadStandardRate) {
      ahmedabadStandardRate.shippingMethodId = standardMethod.id;
      ahmedabadStandardRate.shippingZoneId = ahmedabadZone.id;
      await AppDataSource.getRepository(ShippingRate).save(ahmedabadStandardRate);
      console.log('Updated Ahmedabad standard rate');
    }

    if (ahmedabadExpressRate) {
      ahmedabadExpressRate.shippingMethodId = expressMethod.id;
      ahmedabadExpressRate.shippingZoneId = ahmedabadZone.id;
      await AppDataSource.getRepository(ShippingRate).save(ahmedabadExpressRate);
      console.log('Updated Ahmedabad express rate');
    }

    // Create shipping_method_zones relationships if missing
    const methodZoneRepo = AppDataSource.createQueryBuilder();
    
    // Link standard method to Rajkot zone
    await methodZoneRepo
      .insert()
      .into('shipping_method_zones')
      .values([
        { shipping_method_id: standardMethod.id, shipping_zone_id: rajkotZone.id },
        { shipping_method_id: expressMethod.id, shipping_zone_id: rajkotZone.id },
        { shipping_method_id: standardMethod.id, shipping_zone_id: ahmedabadZone.id },
        { shipping_method_id: expressMethod.id, shipping_zone_id: ahmedabadZone.id }
      ])
      .orIgnore()
      .execute();
    
    console.log('Added shipping_method_zones relationships');

    console.log('Relationships fixed successfully!');

    await AppDataSource.destroy();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error fixing relationships:', error);
    process.exit(1);
  }
}

fixRelationships(); 