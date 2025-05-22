import { useState } from 'react';
import { 
  FormSection, 
  FormRow, 
  FormInput, 
  FormSelect, 
  FormTextarea,
  FormToggle 
} from '../SettingsFormComponents';

interface OrderSettingsData {
  // Order Processing
  automaticOrderProcessing: boolean;
  processingTimeLimit: string;
  allowPartialFulfillment: boolean;
  allowPartialRefunds: boolean;
  requireOrderNotes: boolean;
  autoUpdateOrderStatus: boolean;
  
  // Order Numbers
  orderNumberPrefix: string;
  orderNumberSuffix: string;
  orderNumberStartingNumber: string;
  orderNumberPadding: string;
  useSequentialOrderNumbers: boolean;
  resetOrderNumbersYearly: boolean;
  
  // Order Statuses
  enableCustomStatuses: boolean;
  defaultOrderStatus: string;
  markPaidWhenCompleted: boolean;
  markShippedWhenCompleted: boolean;
  allowBulkStatusUpdates: boolean;
  statusUpdateNotifications: boolean;
  
  // Order Emails
  sendOrderConfirmation: boolean;
  sendProcessingNotification: boolean;
  sendShippingNotification: boolean;
  sendDeliveryNotification: boolean;
  sendOrderCompletedEmail: boolean;
  includePrintableInvoice: boolean;
  
  // Order Limits
  minimumOrderAmount: string;
  maximumOrderAmount: string;
  maximumItemQuantity: string;
  allowMultipleCurrencies: boolean;
  restrictCountries: boolean;
  allowedCountries: string[];
  
  // Order Notes
  enableCustomerNotes: boolean;
  enableInternalNotes: boolean;
  maxNoteLength: string;
  attachmentsAllowed: boolean;
  maxAttachmentSize: string;
  allowedAttachmentTypes: string[];
  
  // Order History
  orderHistoryDuration: string;
  enableOrderTracking: boolean;
  guestOrderLookup: boolean;
  saveAbandonedCarts: boolean;
  abandonedCartTimeout: string;
  enableOrderExport: boolean;
}

const orderStatusOptions = [
  { value: 'pending', label: 'Pending Payment' },
  { value: 'processing', label: 'Processing' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

export function OrderSettings() {
  const [settings, setSettings] = useState<OrderSettingsData>({
    // Order Processing
    automaticOrderProcessing: true,
    processingTimeLimit: '24',
    allowPartialFulfillment: true,
    allowPartialRefunds: true,
    requireOrderNotes: false,
    autoUpdateOrderStatus: true,
    
    // Order Numbers
    orderNumberPrefix: 'ORD-',
    orderNumberSuffix: '',
    orderNumberStartingNumber: '1000',
    orderNumberPadding: '6',
    useSequentialOrderNumbers: true,
    resetOrderNumbersYearly: false,
    
    // Order Statuses
    enableCustomStatuses: false,
    defaultOrderStatus: 'processing',
    markPaidWhenCompleted: true,
    markShippedWhenCompleted: true,
    allowBulkStatusUpdates: true,
    statusUpdateNotifications: true,
    
    // Order Emails
    sendOrderConfirmation: true,
    sendProcessingNotification: true,
    sendShippingNotification: true,
    sendDeliveryNotification: true,
    sendOrderCompletedEmail: true,
    includePrintableInvoice: true,
    
    // Order Limits
    minimumOrderAmount: '0',
    maximumOrderAmount: '10000',
    maximumItemQuantity: '100',
    allowMultipleCurrencies: true,
    restrictCountries: false,
    allowedCountries: [],
    
    // Order Notes
    enableCustomerNotes: true,
    enableInternalNotes: true,
    maxNoteLength: '1000',
    attachmentsAllowed: true,
    maxAttachmentSize: '5',
    allowedAttachmentTypes: ['.pdf', '.jpg', '.png', '.doc', '.docx'],
    
    // Order History
    orderHistoryDuration: '365',
    enableOrderTracking: true,
    guestOrderLookup: true,
    saveAbandonedCarts: true,
    abandonedCartTimeout: '72',
    enableOrderExport: true,
  });

  const handleChange = (field: keyof OrderSettingsData, value: string | boolean | string[]) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Order Processing */}
      <FormSection 
        title="Order Processing" 
        description="Configure how orders are processed in your store"
      >
        <FormRow
          label="Automatic Order Processing"
          htmlFor="automaticOrderProcessing"
          description="Automatically process orders when payment is received"
        >
          <FormToggle
            id="automaticOrderProcessing"
            checked={settings.automaticOrderProcessing}
            onChange={(e) => handleChange('automaticOrderProcessing', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Processing Time Limit"
          htmlFor="processingTimeLimit"
          description="Maximum hours for processing an order"
        >
          <FormInput
            id="processingTimeLimit"
            type="number"
            value={settings.processingTimeLimit}
            onChange={(e) => handleChange('processingTimeLimit', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Allow Partial Fulfillment"
          htmlFor="allowPartialFulfillment"
          description="Allow orders to be fulfilled in parts"
        >
          <FormToggle
            id="allowPartialFulfillment"
            checked={settings.allowPartialFulfillment}
            onChange={(e) => handleChange('allowPartialFulfillment', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Partial Refunds"
          htmlFor="allowPartialRefunds"
          description="Enable partial refund processing"
        >
          <FormToggle
            id="allowPartialRefunds"
            checked={settings.allowPartialRefunds}
            onChange={(e) => handleChange('allowPartialRefunds', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Require Order Notes"
          htmlFor="requireOrderNotes"
          description="Require notes for order status changes"
        >
          <FormToggle
            id="requireOrderNotes"
            checked={settings.requireOrderNotes}
            onChange={(e) => handleChange('requireOrderNotes', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Auto-Update Order Status"
          htmlFor="autoUpdateOrderStatus"
          description="Automatically update order status based on actions"
        >
          <FormToggle
            id="autoUpdateOrderStatus"
            checked={settings.autoUpdateOrderStatus}
            onChange={(e) => handleChange('autoUpdateOrderStatus', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Order Numbers */}
      <FormSection 
        title="Order Numbers" 
        description="Configure order number format and sequence"
      >
        <FormRow
          label="Order Number Prefix"
          htmlFor="orderNumberPrefix"
          description="Text to appear before order number"
        >
          <FormInput
            id="orderNumberPrefix"
            value={settings.orderNumberPrefix}
            onChange={(e) => handleChange('orderNumberPrefix', e.target.value)}
          />
        </FormRow>

        <FormRow
          label="Order Number Suffix"
          htmlFor="orderNumberSuffix"
          description="Text to appear after order number"
        >
          <FormInput
            id="orderNumberSuffix"
            value={settings.orderNumberSuffix}
            onChange={(e) => handleChange('orderNumberSuffix', e.target.value)}
          />
        </FormRow>

        <FormRow
          label="Starting Number"
          htmlFor="orderNumberStartingNumber"
          description="First number in the order sequence"
        >
          <FormInput
            id="orderNumberStartingNumber"
            type="number"
            value={settings.orderNumberStartingNumber}
            onChange={(e) => handleChange('orderNumberStartingNumber', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Number Padding"
          htmlFor="orderNumberPadding"
          description="Minimum digits in order number"
        >
          <FormInput
            id="orderNumberPadding"
            type="number"
            value={settings.orderNumberPadding}
            onChange={(e) => handleChange('orderNumberPadding', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Use Sequential Numbers"
          htmlFor="useSequentialOrderNumbers"
          description="Use sequential numbering for orders"
        >
          <FormToggle
            id="useSequentialOrderNumbers"
            checked={settings.useSequentialOrderNumbers}
            onChange={(e) => handleChange('useSequentialOrderNumbers', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Reset Numbers Yearly"
          htmlFor="resetOrderNumbersYearly"
          description="Reset order numbers at the start of each year"
        >
          <FormToggle
            id="resetOrderNumbersYearly"
            checked={settings.resetOrderNumbersYearly}
            onChange={(e) => handleChange('resetOrderNumbersYearly', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Order Statuses */}
      <FormSection 
        title="Order Statuses" 
        description="Configure order status settings"
      >
        <FormRow
          label="Enable Custom Statuses"
          htmlFor="enableCustomStatuses"
          description="Allow creation of custom order statuses"
        >
          <FormToggle
            id="enableCustomStatuses"
            checked={settings.enableCustomStatuses}
            onChange={(e) => handleChange('enableCustomStatuses', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Default Order Status"
          htmlFor="defaultOrderStatus"
          description="Status assigned to new orders"
        >
          <FormSelect
            id="defaultOrderStatus"
            value={settings.defaultOrderStatus}
            onChange={(e) => handleChange('defaultOrderStatus', e.target.value)}
            options={orderStatusOptions}
          />
        </FormRow>

        <FormRow
          label="Mark Paid When Completed"
          htmlFor="markPaidWhenCompleted"
          description="Automatically mark orders as paid when completed"
        >
          <FormToggle
            id="markPaidWhenCompleted"
            checked={settings.markPaidWhenCompleted}
            onChange={(e) => handleChange('markPaidWhenCompleted', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Mark Shipped When Completed"
          htmlFor="markShippedWhenCompleted"
          description="Automatically mark orders as shipped when completed"
        >
          <FormToggle
            id="markShippedWhenCompleted"
            checked={settings.markShippedWhenCompleted}
            onChange={(e) => handleChange('markShippedWhenCompleted', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allow Bulk Status Updates"
          htmlFor="allowBulkStatusUpdates"
          description="Enable updating multiple order statuses at once"
        >
          <FormToggle
            id="allowBulkStatusUpdates"
            checked={settings.allowBulkStatusUpdates}
            onChange={(e) => handleChange('allowBulkStatusUpdates', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Status Update Notifications"
          htmlFor="statusUpdateNotifications"
          description="Send notifications on order status changes"
        >
          <FormToggle
            id="statusUpdateNotifications"
            checked={settings.statusUpdateNotifications}
            onChange={(e) => handleChange('statusUpdateNotifications', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Order Emails */}
      <FormSection 
        title="Order Emails" 
        description="Configure order notification emails"
      >
        <FormRow
          label="Send Order Confirmation"
          htmlFor="sendOrderConfirmation"
          description="Send email when order is placed"
        >
          <FormToggle
            id="sendOrderConfirmation"
            checked={settings.sendOrderConfirmation}
            onChange={(e) => handleChange('sendOrderConfirmation', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Send Processing Notification"
          htmlFor="sendProcessingNotification"
          description="Send email when order processing begins"
        >
          <FormToggle
            id="sendProcessingNotification"
            checked={settings.sendProcessingNotification}
            onChange={(e) => handleChange('sendProcessingNotification', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Send Shipping Notification"
          htmlFor="sendShippingNotification"
          description="Send email when order ships"
        >
          <FormToggle
            id="sendShippingNotification"
            checked={settings.sendShippingNotification}
            onChange={(e) => handleChange('sendShippingNotification', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Send Delivery Notification"
          htmlFor="sendDeliveryNotification"
          description="Send email when order is delivered"
        >
          <FormToggle
            id="sendDeliveryNotification"
            checked={settings.sendDeliveryNotification}
            onChange={(e) => handleChange('sendDeliveryNotification', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Send Order Completed Email"
          htmlFor="sendOrderCompletedEmail"
          description="Send email when order is completed"
        >
          <FormToggle
            id="sendOrderCompletedEmail"
            checked={settings.sendOrderCompletedEmail}
            onChange={(e) => handleChange('sendOrderCompletedEmail', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Include Printable Invoice"
          htmlFor="includePrintableInvoice"
          description="Attach printable invoice to order emails"
        >
          <FormToggle
            id="includePrintableInvoice"
            checked={settings.includePrintableInvoice}
            onChange={(e) => handleChange('includePrintableInvoice', e.target.checked)}
          />
        </FormRow>
      </FormSection>

      {/* Order Limits */}
      <FormSection 
        title="Order Limits" 
        description="Configure order restrictions and limits"
      >
        <FormRow
          label="Minimum Order Amount"
          htmlFor="minimumOrderAmount"
          description="Minimum total amount required for orders"
        >
          <FormInput
            id="minimumOrderAmount"
            type="number"
            value={settings.minimumOrderAmount}
            onChange={(e) => handleChange('minimumOrderAmount', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Maximum Order Amount"
          htmlFor="maximumOrderAmount"
          description="Maximum total amount allowed for orders"
        >
          <FormInput
            id="maximumOrderAmount"
            type="number"
            value={settings.maximumOrderAmount}
            onChange={(e) => handleChange('maximumOrderAmount', e.target.value)}
            min="0"
          />
        </FormRow>

        <FormRow
          label="Maximum Item Quantity"
          htmlFor="maximumItemQuantity"
          description="Maximum quantity allowed per item"
        >
          <FormInput
            id="maximumItemQuantity"
            type="number"
            value={settings.maximumItemQuantity}
            onChange={(e) => handleChange('maximumItemQuantity', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Allow Multiple Currencies"
          htmlFor="allowMultipleCurrencies"
          description="Accept orders in different currencies"
        >
          <FormToggle
            id="allowMultipleCurrencies"
            checked={settings.allowMultipleCurrencies}
            onChange={(e) => handleChange('allowMultipleCurrencies', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Restrict Countries"
          htmlFor="restrictCountries"
          description="Limit orders to specific countries"
        >
          <FormToggle
            id="restrictCountries"
            checked={settings.restrictCountries}
            onChange={(e) => handleChange('restrictCountries', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Allowed Countries"
          htmlFor="allowedCountries"
          description="Comma-separated list of allowed country codes"
        >
          <FormInput
            id="allowedCountries"
            value={settings.allowedCountries.join(', ')}
            onChange={(e) => handleChange('allowedCountries', e.target.value.split(',').map(c => c.trim()))}
            placeholder="US, CA, GB"
            disabled={!settings.restrictCountries}
          />
        </FormRow>
      </FormSection>

      {/* Order Notes */}
      <FormSection 
        title="Order Notes" 
        description="Configure order notes and attachments"
      >
        <FormRow
          label="Enable Customer Notes"
          htmlFor="enableCustomerNotes"
          description="Allow customers to add notes to orders"
        >
          <FormToggle
            id="enableCustomerNotes"
            checked={settings.enableCustomerNotes}
            onChange={(e) => handleChange('enableCustomerNotes', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Enable Internal Notes"
          htmlFor="enableInternalNotes"
          description="Allow staff to add internal notes"
        >
          <FormToggle
            id="enableInternalNotes"
            checked={settings.enableInternalNotes}
            onChange={(e) => handleChange('enableInternalNotes', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Maximum Note Length"
          htmlFor="maxNoteLength"
          description="Maximum characters allowed in notes"
        >
          <FormInput
            id="maxNoteLength"
            type="number"
            value={settings.maxNoteLength}
            onChange={(e) => handleChange('maxNoteLength', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Allow Attachments"
          htmlFor="attachmentsAllowed"
          description="Allow file attachments with notes"
        >
          <FormToggle
            id="attachmentsAllowed"
            checked={settings.attachmentsAllowed}
            onChange={(e) => handleChange('attachmentsAllowed', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Max Attachment Size (MB)"
          htmlFor="maxAttachmentSize"
          description="Maximum file size in megabytes"
        >
          <FormInput
            id="maxAttachmentSize"
            type="number"
            value={settings.maxAttachmentSize}
            onChange={(e) => handleChange('maxAttachmentSize', e.target.value)}
            min="1"
            disabled={!settings.attachmentsAllowed}
          />
        </FormRow>

        <FormRow
          label="Allowed Attachment Types"
          htmlFor="allowedAttachmentTypes"
          description="Comma-separated list of allowed file extensions"
        >
          <FormInput
            id="allowedAttachmentTypes"
            value={settings.allowedAttachmentTypes.join(', ')}
            onChange={(e) => handleChange('allowedAttachmentTypes', e.target.value.split(',').map(t => t.trim()))}
            placeholder=".pdf, .jpg, .png, .doc"
            disabled={!settings.attachmentsAllowed}
          />
        </FormRow>
      </FormSection>

      {/* Order History */}
      <FormSection 
        title="Order History" 
        description="Configure order history and tracking"
      >
        <FormRow
          label="Order History Duration (days)"
          htmlFor="orderHistoryDuration"
          description="Days to keep order history"
        >
          <FormInput
            id="orderHistoryDuration"
            type="number"
            value={settings.orderHistoryDuration}
            onChange={(e) => handleChange('orderHistoryDuration', e.target.value)}
            min="1"
          />
        </FormRow>

        <FormRow
          label="Enable Order Tracking"
          htmlFor="enableOrderTracking"
          description="Allow customers to track their orders"
        >
          <FormToggle
            id="enableOrderTracking"
            checked={settings.enableOrderTracking}
            onChange={(e) => handleChange('enableOrderTracking', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Guest Order Lookup"
          htmlFor="guestOrderLookup"
          description="Allow guests to look up their orders"
        >
          <FormToggle
            id="guestOrderLookup"
            checked={settings.guestOrderLookup}
            onChange={(e) => handleChange('guestOrderLookup', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Save Abandoned Carts"
          htmlFor="saveAbandonedCarts"
          description="Save and track abandoned shopping carts"
        >
          <FormToggle
            id="saveAbandonedCarts"
            checked={settings.saveAbandonedCarts}
            onChange={(e) => handleChange('saveAbandonedCarts', e.target.checked)}
          />
        </FormRow>

        <FormRow
          label="Abandoned Cart Timeout (hours)"
          htmlFor="abandonedCartTimeout"
          description="Hours before cart is considered abandoned"
        >
          <FormInput
            id="abandonedCartTimeout"
            type="number"
            value={settings.abandonedCartTimeout}
            onChange={(e) => handleChange('abandonedCartTimeout', e.target.value)}
            min="1"
            disabled={!settings.saveAbandonedCarts}
          />
        </FormRow>

        <FormRow
          label="Enable Order Export"
          htmlFor="enableOrderExport"
          description="Allow exporting of order data"
        >
          <FormToggle
            id="enableOrderExport"
            checked={settings.enableOrderExport}
            onChange={(e) => handleChange('enableOrderExport', e.target.checked)}
          />
        </FormRow>
      </FormSection>
    </div>
  );
} 