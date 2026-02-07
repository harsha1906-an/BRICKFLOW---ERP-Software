import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Form, Input, InputNumber, Select, Radio } from 'antd';
import { DatePicker } from 'antd';
import SelectAsync from '@/components/SelectAsync';
import { useMoney, useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';
import { useAppContext } from '@/context/appContext';
import numberToWords from '@/utils/numberToWords';

export default function ExpenseForm({ maxAmount = null, isUpdateForm = false }) {
    const translate = useLanguage();
    const { TextArea } = Input;
    const money = useMoney();
    const { dateFormat } = useDate();

    const form = Form.useFormInstance();
    const { state } = useAppContext();
    const companyId = state.currentCompany;

    const recipientType = Form.useWatch('recipientType', form);
    const amount = Form.useWatch('amount', form);

    useEffect(() => {
        if (companyId) {
            form.setFieldsValue({ companyId });
        }
    }, [companyId, form]);

    return (
        <>
            <Form.Item name="companyId" hidden>
                <Input />
            </Form.Item>
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
                label={translate('Recipient Type')}
                name="recipientType"
                rules={[{ required: true }]}
                style={{ width: '50%', float: 'right', paddingLeft: '20px' }}
            >
                <Select>
                    <Select.Option value="Supplier">Supplier (Inventory)</Select.Option>
                    <Select.Option value="Labour">Labour (Employee)</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                </Select>
            </Form.Item>

            {/* Dynamic Recipient Selection */}
            <div style={{ clear: 'both' }}>
                {recipientType === 'Supplier' && (
                    <Form.Item
                        label={translate('Supplier')}
                        name="supplier"
                        rules={[{ required: true, message: 'Please select a supplier' }]}
                    >
                        <SelectAsync
                            entity={'supplier'}
                            displayLabels={['name']}
                            outputValue={'_id'}
                        />
                    </Form.Item>
                )}

                {recipientType === 'Labour' && (
                    <Form.Item
                        label={translate('Labour')}
                        name="labour"
                        rules={[{ required: true, message: 'Please select a labourer' }]}
                    >
                        <SelectAsync
                            entity={'labour'}
                            displayLabels={['name']}
                            outputValue={'_id'}
                            options={{ filter: 'companyId', equal: companyId }}
                        />
                    </Form.Item>
                )}

                {recipientType === 'Labour' && (
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Form.Item label={translate('Penalty Deduction')} name="penalty" style={{ flex: 1 }}>
                            <InputNumber
                                min={0}
                                controls={false}
                                addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        <Form.Item label={translate('Advance Deduction')} name="advance" style={{ flex: 1 }}>
                            <InputNumber
                                min={0}
                                controls={false}
                                addonBefore={money.currency_position === 'before' ? money.currency_symbol : undefined}
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </div>
                )}
            </div>

            <Form.Item
                name="date"
                label={translate('date')}
                rules={[
                    {
                        required: true,
                        type: 'object',
                    },
                ]}
                initialValue={dayjs()}
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
                    style={{ width: '100%' }}
                />
                {amount > 0 && (
                    <div style={{ color: '#aaa', fontSize: '12px', marginTop: '5px', fontStyle: 'italic' }}>
                        {numberToWords(amount)}
                    </div>
                )}
            </Form.Item>

            <Form.Item
                label={translate('Payment Mode')}
                name="paymentMode"
                rules={[{ required: true }]}
            >
                <Select>
                    <Select.Option value="Cash">Cash</Select.Option>
                    <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                    <Select.Option value="Card">Card</Select.Option>
                    <Select.Option value="UPI">UPI</Select.Option>
                    <Select.Option value="Cheque">Cheque</Select.Option>
                </Select>
            </Form.Item>

            <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.paymentMode !== currentValues.paymentMode}
            >
                {({ getFieldValue }) => {
                    const paymentMode = getFieldValue('paymentMode');
                    return paymentMode && paymentMode !== 'Cash' ? (
                        <Form.Item
                            label={translate('Transaction ID / Reference')}
                            name="reference"
                            rules={[{ required: true, message: 'Reference is required' }]}
                        >
                            <Input />
                        </Form.Item>
                    ) : null;
                }}
            </Form.Item>

            <Form.Item label={translate('Description')} name="description">
                <TextArea rows={4} />
            </Form.Item>
        </>
    );
}
