import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface ProductSettingsData {
  // Inventory Management
  lowStockThreshold: string;
  outOfStockThreshold: string;
  notifyLowStock: boolean;
  autoUpdateStock: boolean;
  allowBackorders: boolean;
  hideOutOfStock: boolean;
  stockDisplayFormat: string;
  reserveStock: boolean;
  reserveDuration: string;
  
  // Product Display
  productsPerPage: string;
  defaultSortOrder: string;
  showSKU: boolean;
  showBrand: boolean;
  showWeight: boolean;
  showDimensions: boolean;
  showStockLevel: boolean;
  enableQuickView: boolean;
  galleryLayout: string;
  zoomEnabled: boolean;
  
  // Product Features
  enableVariations: boolean;
  maxVariationsPerProduct: string;
  enableAttributes: boolean;
  maxAttributesPerProduct: string;
  enableCategories: boolean;
  maxCategoriesPerProduct: string;
  enableTags: boolean;
  maxTagsPerProduct: string;
  
  // Reviews & Ratings
  minimumRating: string;
  moderateReviews: boolean;
  allowPhotoReviews: boolean;
  allowVideoReviews: boolean;
  reviewApprovalRequired: boolean;
  showAverageRating: boolean;
  showReviewCount: boolean;
  allowReviewEditing: boolean;
  reviewEditTimeLimit: string;
  
  // Product Options
  enableCustomizations: boolean;
  maxCustomizations: string;
  enableBundling: boolean;
  maxBundleItems: string;
  enableGiftWrapping: boolean;
  giftMessageMaxLength: string;
  
  // Digital Products
  enableDigitalProducts: boolean;
  maxDownloads: string;
  downloadExpiry: string;
  allowStreamingPreview: boolean;
  maxFileSize: string;
  allowedFileTypes: string[];
  
  // SEO Settings
  generateMetaTitles: boolean;
  generateMetaDescriptions: boolean;
  enableCanonicalUrls: boolean;
  enableSchemaMarkup: boolean;
  enableOpenGraph: boolean;
  enableTwitterCards: boolean;
}

const stockDisplayOptions = [
  { value: 'exact', label: 'Exact quantity' },
  { value: 'range', label: 'Stock range' },
  { value: 'status', label: 'In/Out of stock only' },
];

const sortOrderOptions = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'date_desc', label: 'Newest First' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating', label: 'Average Rating' },
];

const galleryLayoutOptions = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
  { value: 'masonry', label: 'Masonry' },
];

const ratingOptions = [
  { value: '1', label: '1 Star' },
  { value: '2', label: '2 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '5', label: '5 Stars' },
];

export function ProductSettings() {
  const [settings, setSettings] = useState<ProductSettingsData>({
    // Inventory Management
    lowStockThreshold: '5',
    outOfStockThreshold: '0',
    notifyLowStock: true,
    autoUpdateStock: true,
    allowBackorders: false,
    hideOutOfStock: false,
    stockDisplayFormat: 'exact',
    reserveStock: true,
    reserveDuration: '60',
    
    // Product Display
    productsPerPage: '24',
    defaultSortOrder: 'date_desc',
    showSKU: true,
    showBrand: true,
    showWeight: true,
    showDimensions: true,
    showStockLevel: true,
    enableQuickView: true,
    galleryLayout: 'grid',
    zoomEnabled: true,
    
    // Product Features
    enableVariations: true,
    maxVariationsPerProduct: '50',
    enableAttributes: true,
    maxAttributesPerProduct: '10',
    enableCategories: true,
    maxCategoriesPerProduct: '5',
    enableTags: true,
    maxTagsPerProduct: '10',
    
    // Reviews & Ratings
    minimumRating: '1',
    moderateReviews: true,
    allowPhotoReviews: true,
    allowVideoReviews: true,
    reviewApprovalRequired: true,
    showAverageRating: true,
    showReviewCount: true,
    allowReviewEditing: true,
    reviewEditTimeLimit: '48',
    
    // Product Options
    enableCustomizations: true,
    maxCustomizations: '5',
    enableBundling: true,
    maxBundleItems: '10',
    enableGiftWrapping: true,
    giftMessageMaxLength: '500',
    
    // Digital Products
    enableDigitalProducts: true,
    maxDownloads: '5',
    downloadExpiry: '30',
    allowStreamingPreview: true,
    maxFileSize: '500',
    allowedFileTypes: ['.pdf', '.zip', '.mp4'],
    
    // SEO Settings
    generateMetaTitles: true,
    generateMetaDescriptions: true,
    enableCanonicalUrls: true,
    enableSchemaMarkup: true,
    enableOpenGraph: true,
    enableTwitterCards: true,
  });

  const handleChange = (field: keyof ProductSettingsData, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Inventory Management */}
      <FormSection 
        title="Inventory Management" 
        description="Configure how product inventory is managed"
      >
        <FormRow
          label="Low Stock Threshold"
          htmlFor="lowStockThreshold"
          description="Quantity to trigger low stock notifications"
        >
          <FormInput
            id="lowStockThreshold"
            type="number"
            value={settings.lowStockThreshold}
            onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Out of Stock Threshold"
          htmlFor="outOfStockThreshold"
          description="Quantity to mark product as out of stock"
        >
          <FormInput
            id="outOfStockThreshold"
            type="number"
            value={settings.outOfStockThreshold}
            onChange={(e) => handleChange('outOfStockThreshold', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Notify Low Stock"
          htmlFor="notifyLowStock"
          description="Send notifications when products reach low stock threshold"
        >
          <FormToggle
            id="notifyLowStock"
            checked={settings.notifyLowStock}
            onChange={(e) => handleChange('notifyLowStock', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Auto-Update Stock"
          htmlFor="autoUpdateStock"
          description="Automatically update stock levels after orders"
        >
          <FormToggle
            id="autoUpdateStock"
            checked={settings.autoUpdateStock}
            onChange={(e) => handleChange('autoUpdateStock', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Backorders"
          htmlFor="allowBackorders"
          description="Allow customers to order out-of-stock items"
        >
          <FormToggle
            id="allowBackorders"
            checked={settings.allowBackorders}
            onChange={(e) => handleChange('allowBackorders', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Hide Out of Stock"
          htmlFor="hideOutOfStock"
          description="Hide products when they are out of stock"
        >
          <FormToggle
            id="hideOutOfStock"
            checked={settings.hideOutOfStock}
            onChange={(e) => handleChange('hideOutOfStock', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Stock Display Format"
          htmlFor="stockDisplayFormat"
          description="How stock levels are shown to customers"
        >
          <FormSelect
            id="stockDisplayFormat"
            value={settings.stockDisplayFormat}
            onChange={(e) => handleChange('stockDisplayFormat', e.target.value)}
            options={stockDisplayOptions}
          />
        </FormRow>

        <FormRow
          label="Reserve Stock"
          htmlFor="reserveStock"
          description="Reserve stock when added to cart"
        >
          <FormToggle
            id="reserveStock"
            checked={settings.reserveStock}
            onChange={(e) => handleChange('reserveStock', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Reserve Duration"
          htmlFor="reserveDuration"
          description="Minutes to reserve stock in cart (0 for no limit)"
        >
          <FormInput
            id="reserveDuration"
            type="number"
            value={settings.reserveDuration}
            onChange={(e) => handleChange('reserveDuration', e.target.value)}
            min="0"
          />
        </FormRow>
      </FormSection>

      {/* Product Display */}
      <FormSection 
        title="Product Display" 
        description="Configure how products are displayed"
      >
        <FormRow
          label="Products Per Page"
          htmlFor="productsPerPage"
          description="Number of products to show per page"
        >
          <FormInput
            id="productsPerPage"
            type="number"
            value={settings.productsPerPage}
            onChange={(e) => handleChange('productsPerPage', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Default Sort Order"
          htmlFor="defaultSortOrder"
          description="Default product sorting method"
        >
          <FormSelect
            id="defaultSortOrder"
            value={settings.defaultSortOrder}
            onChange={(e) => handleChange('defaultSortOrder', e.target.value)}
            options={sortOrderOptions}
          />
        </FormRow>

        <FormRow
          label="Show SKU"
          htmlFor="showSKU"
          description="Display product SKU"
        >
          <FormToggle
            id="showSKU"
            checked={settings.showSKU}
            onChange={(e) => handleChange('showSKU', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Brand"
          htmlFor="showBrand"
          description="Display product brand"
        >
          <FormToggle
            id="showBrand"
            checked={settings.showBrand}
            onChange={(e) => handleChange('showBrand', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Weight"
          htmlFor="showWeight"
          description="Display product weight"
        >
          <FormToggle
            id="showWeight"
            checked={settings.showWeight}
            onChange={(e) => handleChange('showWeight', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Dimensions"
          htmlFor="showDimensions"
          description="Display product dimensions"
        >
          <FormToggle
            id="showDimensions"
            checked={settings.showDimensions}
            onChange={(e) => handleChange('showDimensions', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Stock Level"
          htmlFor="showStockLevel"
          description="Display current stock level"
        >
          <FormToggle
            id="showStockLevel"
            checked={settings.showStockLevel}
            onChange={(e) => handleChange('showStockLevel', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Quick View"
          htmlFor="enableQuickView"
          description="Allow quick view of products"
        >
          <FormToggle
            id="enableQuickView"
            checked={settings.enableQuickView}
            onChange={(e) => handleChange('enableQuickView', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Gallery Layout"
          htmlFor="galleryLayout"
          description="Product gallery layout style"
        >
          <FormSelect
            id="galleryLayout"
            value={settings.galleryLayout}
            onChange={(e) => handleChange('galleryLayout', e.target.value)}
            options={galleryLayoutOptions}
          />
        </FormRow>

        <FormRow
          label="Enable Zoom"
          htmlFor="zoomEnabled"
          description="Enable image zoom on hover"
        >
          <FormToggle
            id="zoomEnabled"
            checked={settings.zoomEnabled}
            onChange={(e) => handleChange('zoomEnabled', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Product Features */}
      <FormSection 
        title="Product Features" 
        description="Configure product attributes and variations"
      >
        <FormRow
          label="Enable Variations"
          htmlFor="enableVariations"
          description="Allow products to have variations"
        >
          <FormToggle
            id="enableVariations"
            checked={settings.enableVariations}
            onChange={(e) => handleChange('enableVariations', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Variations per Product"
          htmlFor="maxVariationsPerProduct"
          description="Maximum number of variations allowed per product"
        >
          <FormInput
            id="maxVariationsPerProduct"
            type="number"
            value={settings.maxVariationsPerProduct}
            onChange={(e) => handleChange('maxVariationsPerProduct', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Enable Attributes"
          htmlFor="enableAttributes"
          description="Allow products to have custom attributes"
        >
          <FormToggle
            id="enableAttributes"
            checked={settings.enableAttributes}
            onChange={(e) => handleChange('enableAttributes', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Attributes per Product"
          htmlFor="maxAttributesPerProduct"
          description="Maximum number of attributes allowed per product"
        >
          <FormInput
            id="maxAttributesPerProduct"
            type="number"
            value={settings.maxAttributesPerProduct}
            onChange={(e) => handleChange('maxAttributesPerProduct', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Enable Categories"
          htmlFor="enableCategories"
          description="Allow products to be categorized"
        >
          <FormToggle
            id="enableCategories"
            checked={settings.enableCategories}
            onChange={(e) => handleChange('enableCategories', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Categories per Product"
          htmlFor="maxCategoriesPerProduct"
          description="Maximum number of categories allowed per product"
        >
          <FormInput
            id="maxCategoriesPerProduct"
            type="number"
            value={settings.maxCategoriesPerProduct}
            onChange={(e) => handleChange('maxCategoriesPerProduct', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Enable Tags"
          htmlFor="enableTags"
          description="Allow products to be tagged"
        >
          <FormToggle
            id="enableTags"
            checked={settings.enableTags}
            onChange={(e) => handleChange('enableTags', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Tags per Product"
          htmlFor="maxTagsPerProduct"
          description="Maximum number of tags allowed per product"
        >
          <FormInput
            id="maxTagsPerProduct"
            type="number"
            value={settings.maxTagsPerProduct}
            onChange={(e) => handleChange('maxTagsPerProduct', e.target.value)}
            min="1"
          />
        </FormRow>
      </FormSection>

      {/* Reviews & Ratings */}
      <FormSection 
        title="Reviews & Ratings" 
        description="Configure product review settings"
      >
        <FormRow
          label="Minimum Rating"
          htmlFor="minimumRating"
          description="Minimum rating allowed for reviews"
        >
          <FormSelect
            id="minimumRating"
            value={settings.minimumRating}
            onChange={(e) => handleChange('minimumRating', e.target.value)}
            options={ratingOptions}
          />
        </FormRow>

        <FormRow
          label="Moderate Reviews"
          htmlFor="moderateReviews"
          description="Review all reviews before publishing"
        >
          <FormToggle
            id="moderateReviews"
            checked={settings.moderateReviews}
            onChange={(e) => handleChange('moderateReviews', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Photo Reviews"
          htmlFor="allowPhotoReviews"
          description="Allow customers to add photos to reviews"
        >
          <FormToggle
            id="allowPhotoReviews"
            checked={settings.allowPhotoReviews}
            onChange={(e) => handleChange('allowPhotoReviews', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Video Reviews"
          htmlFor="allowVideoReviews"
          description="Allow customers to add videos to reviews"
        >
          <FormToggle
            id="allowVideoReviews"
            checked={settings.allowVideoReviews}
            onChange={(e) => handleChange('allowVideoReviews', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Review Approval Required"
          htmlFor="reviewApprovalRequired"
          description="Require approval before publishing reviews"
        >
          <FormToggle
            id="reviewApprovalRequired"
            checked={settings.reviewApprovalRequired}
            onChange={(e) => handleChange('reviewApprovalRequired', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Average Rating"
          htmlFor="showAverageRating"
          description="Display average product rating"
        >
          <FormToggle
            id="showAverageRating"
            checked={settings.showAverageRating}
            onChange={(e) => handleChange('showAverageRating', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Show Review Count"
          htmlFor="showReviewCount"
          description="Display number of reviews"
        >
          <FormToggle
            id="showReviewCount"
            checked={settings.showReviewCount}
            onChange={(e) => handleChange('showReviewCount', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Review Editing"
          htmlFor="allowReviewEditing"
          description="Allow customers to edit their reviews"
        >
          <FormToggle
            id="allowReviewEditing"
            checked={settings.allowReviewEditing}
            onChange={(e) => handleChange('allowReviewEditing', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Review Edit Time Limit"
          htmlFor="reviewEditTimeLimit"
          description="Hours allowed for editing reviews (0 for no limit)"
        >
          <FormInput
            id="reviewEditTimeLimit"
            type="number"
            value={settings.reviewEditTimeLimit}
            onChange={(e) => handleChange('reviewEditTimeLimit', e.target.value)}
            min="0"
          />
        </FormRow>
      </FormSection>

      {/* Product Options */}
      <FormSection 
        title="Product Options" 
        description="Configure additional product features"
      >
        <FormRow
          label="Enable Customizations"
          htmlFor="enableCustomizations"
          description="Allow product customizations"
        >
          <FormToggle
            id="enableCustomizations"
            checked={settings.enableCustomizations}
            onChange={(e) => handleChange('enableCustomizations', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Customizations"
          htmlFor="maxCustomizations"
          description="Maximum number of customization options per product"
        >
          <FormInput
            id="maxCustomizations"
            type="number"
            value={settings.maxCustomizations}
            onChange={(e) => handleChange('maxCustomizations', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Enable Bundling"
          htmlFor="enableBundling"
          description="Allow product bundling"
        >
          <FormToggle
            id="enableBundling"
            checked={settings.enableBundling}
            onChange={(e) => handleChange('enableBundling', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Bundle Items"
          htmlFor="maxBundleItems"
          description="Maximum number of items in a bundle"
        >
          <FormInput
            id="maxBundleItems"
            type="number"
            value={settings.maxBundleItems}
            onChange={(e) => handleChange('maxBundleItems', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Enable Gift Wrapping"
          htmlFor="enableGiftWrapping"
          description="Allow gift wrapping options"
        >
          <FormToggle
            id="enableGiftWrapping"
            checked={settings.enableGiftWrapping}
            onChange={(e) => handleChange('enableGiftWrapping', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Gift Message Max Length"
          htmlFor="giftMessageMaxLength"
          description="Maximum characters for gift messages"
        >
          <FormInput
            id="giftMessageMaxLength"
            type="number"
            value={settings.giftMessageMaxLength}
            onChange={(e) => handleChange('giftMessageMaxLength', e.target.value)}
            min="1"
          />
        </FormRow>
      </FormSection>

      {/* Digital Products */}
      <FormSection 
        title="Digital Products" 
        description="Configure digital product settings"
      >
        <FormRow
          label="Enable Digital Products"
          htmlFor="enableDigitalProducts"
          description="Allow selling of digital products"
        >
          <FormToggle
            id="enableDigitalProducts"
            checked={settings.enableDigitalProducts}
            onChange={(e) => handleChange('enableDigitalProducts', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Downloads"
          htmlFor="maxDownloads"
          description="Maximum number of downloads per purchase"
        >
          <FormInput
            id="maxDownloads"
            type="number"
            value={settings.maxDownloads}
            onChange={(e) => handleChange('maxDownloads', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Download Expiry"
          htmlFor="downloadExpiry"
          description="Days until download links expire (0 for never)"
        >
          <FormInput
            id="downloadExpiry"
            type="number"
            value={settings.downloadExpiry}
            onChange={(e) => handleChange('downloadExpiry', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Allow Streaming Preview"
          htmlFor="allowStreamingPreview"
          description="Enable streaming previews for digital content"
        >
          <FormToggle
            id="allowStreamingPreview"
            checked={settings.allowStreamingPreview}
            onChange={(e) => handleChange('allowStreamingPreview', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max File Size (MB)"
          htmlFor="maxFileSize"
          description="Maximum file size in megabytes"
        >
          <FormInput
            id="maxFileSize"
            type="number"
            value={settings.maxFileSize}
            onChange={(e) => handleChange('maxFileSize', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Allowed File Types"
          htmlFor="allowedFileTypes"
          description="Comma-separated list of allowed file extensions"
        >
          <FormInput
            id="allowedFileTypes"
            value={settings.allowedFileTypes.join(', ')}
            onChange={(e) => handleChange('allowedFileTypes', e.target.value.split(',').map(t => t.trim()))}
            placeholder=".pdf, .zip, .mp4"
          />
        </FormRow>
      </FormSection>

      {/* SEO Settings */}
      <FormSection 
        title="SEO Settings" 
        description="Configure product SEO options"
      >
        <FormRow
          label="Generate Meta Titles"
          htmlFor="generateMetaTitles"
          description="Auto-generate SEO titles"
        >
          <FormToggle
            id="generateMetaTitles"
            checked={settings.generateMetaTitles}
            onChange={(e) => handleChange('generateMetaTitles', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Generate Meta Descriptions"
          htmlFor="generateMetaDescriptions"
          description="Auto-generate meta descriptions"
        >
          <FormToggle
            id="generateMetaDescriptions"
            checked={settings.generateMetaDescriptions}
            onChange={(e) => handleChange('generateMetaDescriptions', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Canonical URLs"
          htmlFor="enableCanonicalUrls"
          description="Add canonical URL tags"
        >
          <FormToggle
            id="enableCanonicalUrls"
            checked={settings.enableCanonicalUrls}
            onChange={(e) => handleChange('enableCanonicalUrls', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Schema Markup"
          htmlFor="enableSchemaMarkup"
          description="Add schema.org markup"
        >
          <FormToggle
            id="enableSchemaMarkup"
            checked={settings.enableSchemaMarkup}
            onChange={(e) => handleChange('enableSchemaMarkup', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Open Graph"
          htmlFor="enableOpenGraph"
          description="Add Open Graph meta tags"
        >
          <FormToggle
            id="enableOpenGraph"
            checked={settings.enableOpenGraph}
            onChange={(e) => handleChange('enableOpenGraph', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Twitter Cards"
          htmlFor="enableTwitterCards"
          description="Add Twitter Card meta tags"
        >
          <FormToggle
            id="enableTwitterCards"
            checked={settings.enableTwitterCards}
            onChange={(e) => handleChange('enableTwitterCards', e.target.checked)}
          />
        </FormRow>
      </FormSection>
    </div>
  );
} 