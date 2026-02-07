import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Select, DatePicker, Divider, Row, Col, App, Card, Descriptions, Checkbox } from 'antd';
import useMoney from '@/settings/useMoney';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';
import SelectAsync from '@/components/SelectAsync';
import dayjs from 'dayjs';
import numberToWords from '@/utils/numberToWords';

export default function BookingCreate() {
    const { message } = App.useApp();
    const [form] = Form.useForm();
    const translate = useLanguage();
    const { currency_symbol, inputFormatter, inputParser } = useMoney();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { state } = useLocation();
    const [villas, setVillas] = useState([]);

    const officialAmount = Form.useWatch('officialAmount', form);
    const internalAmount = Form.useWatch('internalAmount', form);
    const totalAmount = Form.useWatch('totalAmount', form);
    const downPayment = Form.useWatch('downPayment', form);
    const emiAmount = Form.useWatch('emiAmount', form);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await request.create({ entity: 'booking', jsonData: values });
            if (response.success) {
                message.success('Booking created successfully');
                navigate('/booking');
            } else {
                message.error(response.message || 'Failed to create booking');
            }
        } catch (error) {
            message.error('An error occurred');
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px' }}>
            <Card title={translate('Create New Booking')}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={(changedValues, allValues) => {
                        if (changedValues.address !== undefined || changedValues.isSameAddress !== undefined) {
                            if (allValues.isSameAddress) {
                                form.setFieldsValue({ nomineeAddress: allValues.address });
                            }
                        }
                    }}
                    initialValues={{
                        paymentPlan: [{ name: 'Booking Amount', amount: 0, status: 'pending' }],
                        villa: state?.villaId
                    }}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="client"
                                label={translate('Client')}
                                rules={[{ required: true, message: 'Please select a client' }]}
                            >
                                <SelectAsync
                                    entity={'client'}
                                    displayLabels={['name']}
                                    outputValue={'_id'}
                                    onChange={async (value) => {
                                        if (value) {
                                            try {
                                                const response = await request.read({ entity: 'client', id: value });
                                                if (response.success && response.result) {
                                                    const client = response.result;
                                                    form.setFieldsValue({
                                                        phone: client.phone,
                                                        email: client.email,
                                                        address: client.address,
                                                        fatherName: client.fatherName,
                                                        dob: client.dob ? dayjs(client.dob) : null,
                                                        gender: client.gender,
                                                        panCardNumber: client.panCardNumber,
                                                        aadharCardNumber: client.aadharCardNumber,
                                                        drivingLicence: client.drivingLicence,
                                                        customerId: client.customerId
                                                    });
                                                    // Also update nominee if same address is checked
                                                    if (form.getFieldValue('isSameAddress')) {
                                                        form.setFieldsValue({ nomineeAddress: client.address });
                                                    }
                                                }
                                            } catch (e) { console.error(e); }
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="villa"
                                label={translate('Villa')}
                                rules={[{ required: true, message: 'Please select a villa' }]}
                            >
                                <SelectAsync
                                    entity={'villa'}
                                    displayLabels={['villaNumber']}
                                    outputValue={'_id'}
                                    options={{ status: 'available', items: 1000 }}
                                    onChange={async (value) => {
                                        if (value) {
                                            try {
                                                const response = await request.read({ entity: 'villa', id: value });
                                                if (response.success && response.result) {
                                                    const villa = response.result;
                                                    form.setFieldsValue({
                                                        totalAmount: villa.totalAmount,
                                                        officialAmount: villa.accountableAmount,
                                                        internalAmount: villa.nonAccountableAmount,
                                                        villaNumber: villa.villaNumber,
                                                        houseType: villa.houseType,
                                                        landArea: villa.landArea,
                                                        groundFloorArea: villa.groundFloorArea,
                                                        firstFloorArea: villa.firstFloorArea,
                                                        secondFloorArea: villa.secondFloorArea,
                                                        builtUpArea: villa.builtUpArea,
                                                        facing: villa.facing,
                                                        accountableAmount: villa.accountableAmount,
                                                        nonAccountableAmount: villa.nonAccountableAmount
                                                    });
                                                }
                                            } catch (e) {
                                                console.error('Failed to fetch villa details', e);
                                            }
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">{translate('Client Details')}</Divider>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="customerId" label={translate('Customer ID')}>
                                <Input id="customerId" name="customerId" readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="phone" label={translate('Phone')}>
                                <Input id="phone" name="phone" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="email" label={translate('Email')}>
                                <Input id="email" name="email" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="fatherName" label={translate('Father Name')}>
                                <Input id="fatherName" name="fatherName" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="gender" label={translate('Gender')}>
                                <Select id="gender" name="gender">
                                    <Select.Option value="male">Male</Select.Option>
                                    <Select.Option value="female">Female</Select.Option>
                                    <Select.Option value="other">Other</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="dob" label={translate('Date of Birth')}>
                                <DatePicker id="dob" name="dob" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="panCardNumber" label={translate('PAN Card Number')}>
                                <Input id="panCardNumber" name="panCardNumber" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="aadharCardNumber" label={translate('Aadhar Card Number')}>
                                <Input id="aadharCardNumber" name="aadharCardNumber" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="drivingLicence" label={translate('Driving Licence')}>
                                <Input id="drivingLicence" name="drivingLicence" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item name="address" label={translate('Address')}>
                                <Input.TextArea id="address" name="address" rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">{translate('Villa Details')}</Divider>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="villaNumber" label={translate('Villa Number')}>
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="houseType" label={translate('House Type')}>
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="facing" label={translate('Facing')}>
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="landArea" label={translate('Land Area (sqft)')}>
                                <InputNumber style={{ width: '100%' }} readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="groundFloorArea" label={translate('Ground Floor (sqft)')}>
                                <InputNumber style={{ width: '100%' }} readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="firstFloorArea" label={translate('1st Floor (sqft)')}>
                                <InputNumber style={{ width: '100%' }} readOnly />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="secondFloorArea" label={translate('2nd Floor (sqft)')}>
                                <InputNumber style={{ width: '100%' }} readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="builtUpArea" label={translate('Total Built Up (sqft)')}>
                                <InputNumber style={{ width: '100%' }} readOnly />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="accountableAmount" label={translate('Official Price (White)')}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    readOnly
                                    formatter={inputFormatter}
                                    parser={inputParser}
                                    prefix={currency_symbol}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="nonAccountableAmount" label={translate('Internal Price (Black)')}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    readOnly
                                    formatter={inputFormatter}
                                    parser={inputParser}
                                    prefix={currency_symbol}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    {/* Moved to previous row */}

                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                label={translate('Official Amount (White)')}
                                name="officialAmount"
                                initialValue={0}
                                extra={officialAmount > 0 ? <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#aaa', marginTop: '5px' }}>{numberToWords(officialAmount)}</div> : null}
                            >
                                <InputNumber
                                    id="officialAmount"
                                    name="officialAmount"
                                    style={{ width: '100%' }}
                                    formatter={inputFormatter}
                                    parser={inputParser}
                                    prefix={currency_symbol}
                                    onChange={(value) => {
                                        const internal = form.getFieldValue('internalAmount') || 0;
                                        form.setFieldsValue({ totalAmount: (value || 0) + internal });
                                    }}
                                />
                            </Form.Item>
                            <Form.Item
                                label={translate('Internal Amount (Black)')}
                                name="internalAmount"
                                initialValue={0}
                                extra={internalAmount > 0 ? <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#aaa', marginTop: '5px' }}>{numberToWords(internalAmount)}</div> : null}
                            >
                                <InputNumber
                                    id="internalAmount"
                                    name="internalAmount"
                                    style={{ width: '100%' }}
                                    formatter={inputFormatter}
                                    parser={inputParser}
                                    prefix={currency_symbol}
                                    onChange={(value) => {
                                        const official = form.getFieldValue('officialAmount') || 0;
                                        form.setFieldsValue({ totalAmount: official + (value || 0) });
                                    }}
                                />
                            </Form.Item>
                            <Form.Item
                                label={translate('Total Agreement Amount')}
                                name="totalAmount"
                                rules={[{ required: true, message: 'Please enter total amount' }]}
                                extra={totalAmount > 0 ? <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#aaa', marginTop: '5px' }}>{numberToWords(totalAmount)}</div> : null}
                            >
                                <InputNumber
                                    id="totalAmount"
                                    name="totalAmount"
                                    style={{ width: '100%' }}
                                    formatter={inputFormatter}
                                    parser={inputParser}
                                    prefix={currency_symbol}
                                    readOnly
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="bookingDate"
                                label={translate('Booking Date')}
                                rules={[{ required: true }]}
                            >
                                <DatePicker id="bookingDate" name="bookingDate" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">{translate('Payment Details')}</Divider>
                    <Row gutter={24}>
                        <Col span={6}>
                            <Form.Item name="paymentMode" label={translate('Payment Mode (Plan)')} initialValue="full">
                                <Select id="paymentMode" name="paymentMode">
                                    <Select.Option value="full">{translate('Full Payment')}</Select.Option>
                                    <Select.Option value="installment">{translate('Installment')}</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="paymentMethod" label={translate('Payment Method')} initialValue="Cash">
                                <Select>
                                    <Select.Option value="Cash">Cash</Select.Option>
                                    <Select.Option value="Cheque">Cheque</Select.Option>
                                    <Select.Option value="UPI">UPI</Select.Option>
                                    <Select.Option value="IMPS">IMPS</Select.Option>
                                    <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="transactionId" label={translate('Transaction ID / Cheque No')}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label={translate('Down Payment (D.P)')}
                                name="downPayment"
                                extra={downPayment > 0 ? <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#aaa', marginTop: '5px' }}>{numberToWords(downPayment)}</div> : null}
                            >
                                <InputNumber
                                    id="downPayment"
                                    name="downPayment"
                                    style={{ width: '100%' }}
                                    formatter={inputFormatter}
                                    parser={inputParser}
                                    prefix={currency_symbol}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.paymentMode !== curr.paymentMode}>
                        {({ getFieldValue }) => {
                            const paymentMode = getFieldValue('paymentMode');
                            if (paymentMode === 'installment') {
                                return (
                                    <>
                                        <Row gutter={24}>
                                            <Col span={6}>
                                                <Form.Item name="installmentType" label={translate('Installment Type')} initialValue="stagewise">
                                                    <Select>
                                                        <Select.Option value="bankloan">{translate('Bank Loan')}</Select.Option>
                                                        <Select.Option value="stagewise">{translate('Stage-wise')}</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.installmentType !== curr.installmentType}>
                                            {({ getFieldValue }) => {
                                                const installmentType = getFieldValue('installmentType');
                                                if (installmentType === 'bankloan') {
                                                    return (
                                                        <Row gutter={24}>
                                                            <Col span={6}>
                                                                <Form.Item
                                                                    label={translate('EMI Amount')}
                                                                    name="emiAmount"
                                                                    extra={emiAmount > 0 ? <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#aaa', marginTop: '5px' }}>{numberToWords(emiAmount)}</div> : null}
                                                                >
                                                                    <InputNumber
                                                                        id="emiAmount"
                                                                        name="emiAmount"
                                                                        style={{ width: '100%' }}
                                                                        formatter={inputFormatter}
                                                                        parser={inputParser}
                                                                        prefix={currency_symbol}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={6}>
                                                                <Form.Item name="noOfEmi" label={translate('No. of EMIs')}>
                                                                    <InputNumber id="noOfEmi" name="noOfEmi" style={{ width: '100%' }} />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                    );
                                                } else if (installmentType === 'stagewise') {
                                                    return (
                                                        <Row gutter={24}>
                                                            <Col span={6}>
                                                                <Form.Item name="noOfInstallments" label={translate('Number of Installments')}>
                                                                    <InputNumber id="noOfInstallments" name="noOfInstallments" style={{ width: '100%' }} />
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                    );
                                                }
                                                return null;
                                            }}
                                        </Form.Item>
                                    </>
                                );
                            }
                            return null;
                        }}
                    </Form.Item>

                    <Divider orientation="left">{translate('Nominee Information')}</Divider>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Form.Item name="nomineeName" label={translate('Nominee Name')}>
                                <Input id="nomineeName" name="nomineeName" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="nomineeFatherHusbandName" label={translate("Father's / Husband's Name")}>
                                <Input id="nomineeFatherHusbandName" name="nomineeFatherHusbandName" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="nomineeRelationship" label={translate('Relationship')}>
                                <Input id="nomineeRelationship" name="nomineeRelationship" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={6}>
                            <Form.Item name="nomineeMobile" label={translate('Mobile Number')}>
                                <Input id="nomineeMobile" name="nomineeMobile" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="nomineeDob" label={translate('Date of Birth')}>
                                <DatePicker id="nomineeDob" name="nomineeDob" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="agent" label={translate('Agent')}>
                                <Input id="agent" name="agent" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="isSameAddress"
                                valuePropName="checked"
                                label=" "
                                style={{ marginBottom: 0 }}
                            >
                                <Checkbox>
                                    Same as Client Address
                                </Checkbox>
                            </Form.Item>
                            <Form.Item name="nomineeAddress" label={translate('Address')}>
                                <Input id="nomineeAddress" name="nomineeAddress" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left">{translate('Payment Plan / Milestones')}</Divider>

                    <Form.List name="paymentPlan">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
                                        <Col span={8}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'name']}
                                                rules={[{ required: true, message: 'Missing milestone name' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="Milestone Name (e.g. Plinth)" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item
                                                shouldUpdate={(prev, curr) => prev.paymentPlan !== curr.paymentPlan}
                                                noStyle
                                            >
                                                {({ getFieldValue }) => {
                                                    const paymentPlan = getFieldValue('paymentPlan');
                                                    const amount = paymentPlan && paymentPlan[name] ? paymentPlan[name].amount : 0;
                                                    return (
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'amount']}
                                                            rules={[{ required: true, message: 'Missing amount' }]}
                                                            style={{ marginBottom: 0 }}
                                                            help={amount ? <span style={{ fontSize: '10px', color: '#aaa' }}>{numberToWords(amount)}</span> : null}
                                                        >
                                                            <InputNumber placeholder="Amount" style={{ width: '100%' }} />
                                                        </Form.Item>
                                                    );
                                                }}
                                            </Form.Item>
                                        </Col>
                                        <Col span={6}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'dueDate']}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <DatePicker placeholder="Due Date" style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'status']}
                                                hidden
                                            >
                                                <Input />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Col>
                                    </Row>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add({ status: 'pending' })} block icon={<PlusOutlined />}>
                                        Add Milestone
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {translate('Create Booking')}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
