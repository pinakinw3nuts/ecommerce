import { AppDataSource } from './config/dataSource';
import { ShippingZone } from './entities/ShippingZone';
import { ShippingMethod } from './entities/ShippingMethod';
import { ShippingRate } from './entities/ShippingRate';

async function debugDatabase() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    console.log('Data source initialized');

    // Check shipping zones
    const zones = await AppDataSource.getRepository(ShippingZone).find();
    console.log('Shipping Zones:', JSON.stringify(zones, null, 2));

    // Check shipping methods
    const methods = await AppDataSource.getRepository(ShippingMethod).find();
    console.log('Shipping Methods:', JSON.stringify(methods, null, 2));

    // Check shipping rates
    const rates = await AppDataSource.getRepository(ShippingRate).find();
    console.log('Shipping Rates:', JSON.stringify(rates, null, 2));

    // Specific check for pincode 380002
    console.log('\nChecking zones for pincode 380002:');
    for (const zone of zones) {
      console.log(`Zone: ${zone.name} (${zone.code})`);
      
      // Check if pincode is excluded
      if (zone.excludedPincodes && zone.excludedPincodes.includes('380002')) {
        console.log('- Excluded by excludedPincodes');
        continue;
      }

      // Check if pincode is directly included in regions
      let directMatch = false;
      if (zone.regions) {
        for (const region of zone.regions) {
          if (region.pincode === '380002') {
            console.log('- Directly matched in regions');
            directMatch = true;
            break;
          }
        }
      }

      // Check if pincode matches any pattern
      let patternMatch = false;
      if (zone.pincodePatterns) {
        for (const pattern of zone.pincodePatterns) {
          try {
            if (new RegExp(pattern).test('380002')) {
              console.log(`- Matched pattern: ${pattern}`);
              patternMatch = true;
              break;
            }
          } catch (e) {
            console.log(`- Error with pattern: ${pattern}`, e);
          }
        }
      }

      // Overall match status
      console.log(`- Is applicable: ${directMatch || patternMatch}`);
    }

    await AppDataSource.destroy();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error debugging database:', error);
    process.exit(1);
  }
}

debugDatabase(); 