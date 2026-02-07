import { Form, Input, InputNumber } from 'antd';
import useMoney from '@/settings/useMoney';

export default function InventoryForm() {
  const { currency_symbol } = useMoney();
  // Renamed to InventoryForm for clarity
  return (
    <>
      <Form.Item
        label="Product"
        name="product"
        rules={[
          {
            required: true,
            message: 'Please input Product name!',
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Quantity"
        name="quantity"
        rules={[
          {
            required: true,
            message: 'Please input Quantity!',
            type: 'number',
            min: 0, // Ensure non-negative numbers
          },
        ]}
      >
        <InputNumber />
      </Form.Item>

      <Form.Item
        label="Unit Price"
        name="unitPrice"
        rules={[
          {
            required: true,
            message: 'Please input Unit Price!',
            type: 'number',
            min: 0, // Ensure non-negative numbers
          },
        ]}
      >
        <InputNumber
          formatter={(value) => (value ? `${currency_symbol} ${value}` : '').replace(/\B(?=(?:\d{2})+(?!\d)(?:\d{3})?)/g, ',')}
          parser={(value) => value.replace(new RegExp(`\\${currency_symbol}\\s?|(,*)`, 'g'), '')}
        />
      </Form.Item>
    </>
  );
}
