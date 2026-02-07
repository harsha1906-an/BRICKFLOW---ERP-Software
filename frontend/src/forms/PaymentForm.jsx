import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Select, Descriptions } from 'antd';
import { DatePicker } from 'antd';
import SelectAsync from '@/components/SelectAsync';
import { useMoney, useDate } from '@/settings';
import { request } from '@/request';

import useLanguage from '@/locale/useLanguage';

function PropertyBalance() {
  const form = Form.useFormInstance();
  const villaId = Form.useWatch('villa', form);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (villaId) {
      const fetchStats = async () => {
        const response = await request.list({ entity: 'booking', options: { villa: villaId } });
        if (response.success && response.result.length > 0) {
          const booking = response.result[0];
          // Calculate paid amount
          let paid = 0;
          if (booking.paymentPlan) {
            paid = booking.paymentPlan.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
          }
          setStats({
            total: booking.totalAmount,
            paid: paid,
            balance: booking.totalAmount - paid
          });
        } else {
          setStats(null);
        }
      };
      fetchStats();
    } else {
      setStats(null);
    }
  }, [villaId]);

  if (!stats) return null;

  return (
    <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
      <Descriptions title="Property Financial Status" size="small" column={3} layout="vertical">
        <Descriptions.Item label="Total Agreement">{stats.total?.toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Total Paid">{stats.paid?.toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Balance Due">
          <span style={{ color: 'red', fontWeight: 'bold' }}>{stats.balance?.toLocaleString()}</span>
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}

export default function PaymentForm({ maxAmount = null, isUpdateForm = false }) {
  const translate = useLanguage();
  const { TextArea } = Input;
  const money = useMoney();
  const { dateFormat } = useDate();
  return (
    <>
      <Form.Item
        label={translate('number')}
        name="number"
        initialValue={1}
        rules={[
          {
            required: true,
          },
        ]}
        style={{ width: '50%', float: 'left', paddingRight: '20px' }}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="client"
        label={translate('Client')}
        rules={[
          {
            required: true,
          },
        ]}
        style={{ width: '100%', clear: 'both' }}
      >
        <SelectAsync
          entity={'client'}
          displayLabels={['name']}
          outputValue={'_id'}
          onChange={(value) => {
            // Reset villa when client changes
            // We could also store client ID to filter villas
          }}
        />
      </Form.Item>

      <PropertyBalance />
      {isUpdateForm && (
        <Form.Item
          label={translate('Transaction Code')}
          name="transactionCode"
          style={{ width: '50%', float: 'right', paddingLeft: '20px' }}
        >
          <Input readOnly bordered={false} style={{ color: 'black', fontWeight: 'bold' }} />
        </Form.Item>
      )}
      <Form.Item
        name="date"
        label={translate('date')}
        rules={[
          {
            required: true,
            type: 'object',
          },
        ]}
        initialValue={dayjs().add(30, 'days')}
        style={{ width: '100%' }}
      >
        <DatePicker format={dateFormat} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label={translate('amount')} name="amount" rules={[{ required: true }]}>
        <InputNumber
          className="moneyInput"
          min={0}
          controls={false}
          max={maxAmount}
          addonAfter={money.currency_position === 'after' ? money.currency_symbol : undefined}
          addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
        />
      </Form.Item>
      <Form.Item
        label={translate('payment Mode')}
        name="paymentMode"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select>
          <Select.Option value="Cash">Cash</Select.Option>
          <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
          <Select.Option value="Card">Card</Select.Option>
          <Select.Option value="Loan">Loan</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label={translate('Villa')}
        name="villa"
        rules={[
          {
            required: true,
            message: 'Please select a villa',
          },
        ]}
      >
        <SelectAsync
          entity={'villa'}
          displayLabels={['villaNumber']}
          outputValue={'_id'}
        />
      </Form.Item>
      <Form.Item
        label="Building Stage"
        name="buildingStage"
      >
        <Select placeholder="Select Stage">
          <Select.Option value="foundation">Foundation</Select.Option>
          <Select.Option value="structure">Structure</Select.Option>
          <Select.Option value="plastering">Plastering</Select.Option>
          <Select.Option value="finishing">Finishing</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="Ledger / Account"
        name="ledger"
        initialValue="official"
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value="official">Official Account (White)</Select.Option>
          <Select.Option value="internal">Internal Account (Black)</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.paymentMode !== currentValues.paymentMode}
      >
        {({ getFieldValue }) => {
          const paymentMode = getFieldValue('paymentMode');
          return (
            <Form.Item
              label={translate('Transaction ID')}
              name="ref"
              rules={[
                {
                  required: paymentMode && paymentMode !== 'Cash',
                  message: 'Transaction ID is required'
                }
              ]}
            >
              <Input placeholder="Transaction ID / Reference Number" />
            </Form.Item>
          );
        }}
      </Form.Item>
      <Form.Item label={translate('Description')} name="description">
        <TextArea />
      </Form.Item>
    </>
  );
}
