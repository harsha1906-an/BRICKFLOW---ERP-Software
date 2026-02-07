import { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col } from 'antd';

import { PlusOutlined } from '@ant-design/icons';

import { DatePicker } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import InvoiceItemRow from './InvoiceItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';

export default function InvoiceForm({ subTotal = 0, current = null }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} />;
}

import { request } from '@/request';

function LoadInvoiceForm({ subTotal = 0, current = null }) {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const form = Form.useFormInstance();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);
  const [clientStats, setClientStats] = useState(null);

  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };

  useEffect(() => {
    if (current) {
      const { taxRate = 0, year, number } = current;
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
    }
  }, [current]);
  useEffect(() => {
    const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
    setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);

  const addField = useRef(false);

  useEffect(() => {
    addField.current.click();
  }, []);

  /* New Hook to watch form value */
  const villaId = Form.useWatch('villa');

  useEffect(() => {
    const fetchStats = async () => {
      if (villaId) {
        try {
          const response = await request.list({ entity: 'booking', options: { villa: villaId } });
          if (response.success && response.result.length > 0) {
            const booking = response.result[0];
            // Calculate paid amount from paymentPlan
            let paid = 0;
            if (booking.paymentPlan) {
              paid = booking.paymentPlan.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
            }

            // Auto-populate the first item with Villa details if empty
            if (form) {
              const currentItems = form.getFieldValue('items');
              if (currentItems && currentItems.length > 0 && !currentItems[0].itemName) {
                const villaName = response.result[0].villa?.villaNumber || 'Villa';
                form.setFieldValue(['items', 0, 'itemName'], `Payment for ${villaName}`);
              }
            }

            setClientStats({
              totalAgreement: booking.totalAmount,
              totalPaid: paid,
              balance: booking.totalAmount - paid,
              count: 1
            });
          } else {
            setClientStats(null);
          }
        } catch (e) {
          console.error(e);
          setClientStats(null);
        }
      } else {
        setClientStats(null);
      }
    };
    fetchStats();
  }, [villaId]);

  return (
    <>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={6}>
          <Form.Item
            name="client"
            label={translate('Client')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoCompleteAsync
              entity={'client'}
              displayLabels={['name']}
              searchFields={'name'}
              redirectLabel={'Add New Client'}
              withRedirect
              urlToRedirect={'/customer'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="villa"
            label={translate('Villa')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <SelectAsync
              entity={'villa'}
              displayLabels={['villaNumber']}
              outputValue={'_id'}
            />
          </Form.Item>
          {clientStats && (
            <div style={{
              marginTop: '5px',
              padding: '10px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '4px',
              color: '#000' // Ensure text is visible on light background
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#135200' }}>Property Financial Summary</h4>
              <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
                <div><strong style={{ color: '#000' }}>Total Booked:</strong> <span style={{ color: '#000' }}>{clientStats?.totalAgreement?.toLocaleString()}</span></div>
                <div><strong style={{ color: '#000' }}>Total Paid:</strong> <span style={{ color: '#000' }}>{clientStats?.totalPaid?.toLocaleString()}</span></div>
                <div><strong style={{ color: '#000' }}>Balance:</strong> <span style={{ color: clientStats?.balance > 0 ? 'red' : 'green', fontWeight: 'bold' }}>{clientStats?.balance?.toLocaleString()}</span></div>
              </div>
            </div>
          )}
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            initialValue={lastNumber}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            initialValue={currentYear}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('Reference')}
            name="reference"
          >
            <Input />
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
            initialValue={'draft'}
          >
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={6}>
          <Form.Item
            name="expiredDate"
            label={translate('Expire Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={dayjs().add(30, 'days')}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={5}>
          <Form.Item
            name="buildingStage"
            label="Building Stage"
          >
            <Select placeholder="Select Stage">
              <Select.Option value="foundation">Foundation</Select.Option>
              <Select.Option value="structure">Structure</Select.Option>
              <Select.Option value="plastering">Plastering</Select.Option>
              <Select.Option value="finishing">Finishing</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider dashed />
      <Row gutter={[12, 12]} style={{ position: 'relative' }}>
        <Col className="gutter-row" span={10}>
          <p>{translate('Property / Unit')}</p>
        </Col>
        <Col className="gutter-row" span={8}>
          <p>{translate('Description')}</p>
        </Col>
        <Col className="gutter-row" span={6}>
          <p>{translate('Amount')}</p>
        </Col>
      </Row>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <InvoiceItemRow key={field.key} remove={remove} field={field} current={current}></InvoiceItemRow>
            ))}
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                ref={addField}
              >
                {translate('Add Item')}
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>
      <Divider dashed />
      <div style={{ position: 'relative', width: ' 100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4} offset={10}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Sub Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={subTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <Form.Item
              name="taxRate"
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <SelectAsync
                value={taxRate}
                onChange={handelTaxChange}
                entity={'taxes'}
                outputValue={'taxValue'}
                displayLabels={['taxName']}
                withRedirect={true}
                urlToRedirect="/taxes"
                redirectLabel={translate('Add New Tax')}
                placeholder={translate('Select Tax Value')}
              />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>
    </>
  );
}
