import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Table, Tag, Button, Row, Col, App, Statistic, Divider, Modal, Form, DatePicker, InputNumber, Select, Input, Tabs } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import useLanguage from '@/locale/useLanguage';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { request } from '@/request';
import { useMoney, useDate } from '@/settings';
import dayjs from 'dayjs';
import { PageHeader } from '@ant-design/pro-layout';

export default function BookingRead() {
    const { message } = App.useApp();
    const { id } = useParams();
    const navigate = useNavigate();
    const translate = useLanguage();
    const { moneyFormatter } = useMoney();
    const { dateFormat } = useDate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Payment Modal State ---
    const [paymentModal, setPaymentModal] = useState({ open: false, milestone: null });
    const [form] = Form.useForm(); // Needed for PaymentModal

    const handleDownloadReceipt = async () => {
        try {
            message.loading({ content: 'Generating Receipt...', key: 'pdf_download' });
            const response = await axios.get(`${DOWNLOAD_BASE_URL}bookingreceipt/bookingreceipt-${id}.pdf`, {
                responseType: 'blob',
                withCredentials: true,
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `BookingReceipt_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            message.success({ content: 'Receipt Downloaded', key: 'pdf_download' });
        } catch (error) {
            console.error(error);
            message.error({ content: 'Failed to download receipt', key: 'pdf_download' });
        }
    };

    const fetchBooking = async () => {
        setLoading(true);
        const response = await request.read({ entity: 'booking', id });
        if (response.success) {
            setBooking(response.result);
        } else {
            message.error('Failed to load booking');
            navigate('/booking');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    if (!booking) return <></>;

    const handlePay = (milestone) => {
        setPaymentModal({ open: true, milestone });
    };

    const handlePaymentSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Prepare data for backend
            const payload = {
                ...values,
                booking: id,
                client: booking.client._id, // Ensure client is passed
                villa: booking.villa._id, // Required for backend guards
                villaId: booking.villa._id, // Redundant but safe
                number: Math.floor(Math.random() * 1000000), // Required by schema
                buildingStage: paymentModal.milestone?.name,
                // We don't have an invoice ID, so we skip it. Backend handles this now.
            };

            setLoading(true);
            const response = await request.create({ entity: 'payment', jsonData: payload });

            if (response.success) {
                message.success('Payment recorded successfully');
                setPaymentModal({ open: false, milestone: null });
                form.resetFields();
                fetchBooking(); // Refresh to show updated status
            } else {
                message.error(response.message || 'Failed to record payment');
            }
        } catch (e) {
            console.error(e);
            message.error('Please check the form fields');
        } finally {
            setLoading(false);
        }
    };

    const paymentPlanColumns = [
        { title: translate('Milestone'), dataIndex: 'name', key: 'name' },
        { title: translate('Due Date'), dataIndex: 'dueDate', key: 'dueDate', render: (d) => d ? dayjs(d).format(dateFormat) : '-' },
        { title: translate('Amount'), dataIndex: 'amount', key: 'amount', render: (amount) => moneyFormatter({ amount }) },
        {
            title: translate('Paid'),
            dataIndex: 'paidAmount',
            key: 'paidAmount',
            render: (paid) => <b style={{ color: 'green' }}>{moneyFormatter({ amount: paid || 0 })}</b>
        },
        {
            title: translate('Status'), dataIndex: 'status', key: 'status', render: (status) => {
                let color = status === 'paid' ? 'green' : status === 'overdue' ? 'red' : 'gold';
                return <Tag color={color}>{status ? status.toUpperCase() : 'PENDING'}</Tag>;
            }
        },
        {
            title: translate('Action'), key: 'action', render: (_, record) => {
                const pending = record.amount - (record.paidAmount || 0);
                // If not fully paid, show Pay button
                if (pending > 0 && record.status !== 'paid') {
                    return <Button type="primary" size="small" onClick={() => handlePay(record)}>Pay</Button>
                }
                // If paid, show Download Receipt button
                return (
                    <Button
                        size="small"
                        icon={<FilePdfOutlined />}
                        onClick={() => downloadMilestoneReceipt(record)}
                    >
                        Receipt
                    </Button>
                );
            }
        }
    ];

    const downloadMilestoneReceipt = async (record) => {
        try {
            message.loading({ content: 'Generating Receipt...', key: 'pdf_download' });
            // Use the request helper instead of direct axios if possible, or keep axios but use new route
            const response = await request.pdf({ entity: `booking/${id}/pdf-receipt?milestoneId=${record._id}` });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt_${record.name}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.success({ content: 'Receipt Downloaded', key: 'pdf_download' });
        } catch (error) {
            console.error(error);
            message.error({ content: 'Failed to download receipt', key: 'pdf_download' });
        }
    };

    const tabItems = [
        {
            key: '1',
            label: translate('Booking Information'),
            children: (
                <Row gutter={24}>
                    <Col span={16}>
                        <Card title="Booking Information" bordered={false}>
                            <Descriptions column={2} title="Basic Information">
                                <Descriptions.Item label="Client">{booking.client?.name}</Descriptions.Item>
                                <Descriptions.Item label="Villa">{booking.villa?.villaNumber}</Descriptions.Item>
                                <Descriptions.Item label="Date">{dayjs(booking.bookingDate).format(dateFormat)}</Descriptions.Item>
                                <Descriptions.Item label="Status"><Tag color="blue">{booking.status}</Tag></Descriptions.Item>
                            </Descriptions>
                            <Divider />
                            <Descriptions column={2} title="Client Details">
                                <Descriptions.Item label="Customer ID">{booking.customerId}</Descriptions.Item>
                                <Descriptions.Item label="Gender">{booking.gender}</Descriptions.Item>
                                <Descriptions.Item label="Father Name">{booking.fatherName}</Descriptions.Item>
                                <Descriptions.Item label="DOB">{booking.dob ? dayjs(booking.dob).format(dateFormat) : '-'}</Descriptions.Item>
                                <Descriptions.Item label="Phone">{booking.phone}</Descriptions.Item>
                                <Descriptions.Item label="Email">{booking.email}</Descriptions.Item>
                                <Descriptions.Item label="PAN Card">{booking.panCardNumber}</Descriptions.Item>
                                <Descriptions.Item label="Aadhar Card">{booking.aadharCardNumber}</Descriptions.Item>
                                <Descriptions.Item label="Driving Licence" span={2}>{booking.drivingLicence}</Descriptions.Item>
                                <Descriptions.Item label="Address" span={2}>{booking.address}</Descriptions.Item>
                            </Descriptions>
                            <Divider />
                            <Descriptions column={2} title="Villa Details">
                                <Descriptions.Item label="Villa Number">{booking.villaNumber}</Descriptions.Item>
                                <Descriptions.Item label="House Type">{booking.houseType}</Descriptions.Item>
                                <Descriptions.Item label="Facing">{booking.facing}</Descriptions.Item>
                                <Descriptions.Item label="Land Area">{booking.landArea} sqft</Descriptions.Item>
                                <Descriptions.Item label="Built Up Area">{booking.builtUpArea} sqft</Descriptions.Item>
                                <Descriptions.Item label="Ground Floor">{booking.groundFloorArea} sqft</Descriptions.Item>
                                <Descriptions.Item label="1st Floor">{booking.firstFloorArea} sqft</Descriptions.Item>
                                <Descriptions.Item label="2nd Floor">{booking.secondFloorArea} sqft</Descriptions.Item>
                                <Descriptions.Item label="Official Price">{moneyFormatter({ amount: booking.accountableAmount || 0 })}</Descriptions.Item>
                                <Descriptions.Item label="Internal Price">{moneyFormatter({ amount: booking.nonAccountableAmount || 0 })}</Descriptions.Item>
                            </Descriptions>
                            <Divider />
                            <Descriptions column={2} title="Payment Details">
                                <Descriptions.Item label="Payment Mode">{booking.paymentMode?.toUpperCase()}</Descriptions.Item>
                                <Descriptions.Item label="Down Payment (D.P)">{moneyFormatter({ amount: booking.downPayment || 0 })}</Descriptions.Item>
                                <Descriptions.Item label="EMI Amount">{moneyFormatter({ amount: booking.emiAmount || 0 })}</Descriptions.Item>
                                <Descriptions.Item label="No. of EMIs">{booking.noOfEmi}</Descriptions.Item>
                            </Descriptions>
                            <Divider />
                            <Descriptions column={2} title="Nominee Information">
                                <Descriptions.Item label="Nominee Name">{booking.nomineeName}</Descriptions.Item>
                                <Descriptions.Item label="Father/Husband Name">{booking.nomineeFatherHusbandName}</Descriptions.Item>
                                <Descriptions.Item label="Relationship">{booking.nomineeRelationship}</Descriptions.Item>
                                <Descriptions.Item label="Mobile Number">{booking.nomineeMobile}</Descriptions.Item>
                                <Descriptions.Item label="Date of Birth">{booking.nomineeDob ? dayjs(booking.nomineeDob).format(dateFormat) : '-'}</Descriptions.Item>
                                <Descriptions.Item label="Agent">{booking.agent}</Descriptions.Item>
                                <Descriptions.Item label="Address" span={2}>{booking.nomineeAddress}</Descriptions.Item>
                            </Descriptions>
                            <Divider />
                            <h3>Payment Plan / Milestones</h3>
                            <Table
                                dataSource={booking.paymentPlan}
                                columns={paymentPlanColumns}
                                pagination={false}
                                rowKey={(record) => record._id || record.name}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card title="Financials" bordered={false}>
                            <Statistic title="Total Amount" value={moneyFormatter({ amount: booking.totalAmount })} />
                            <Divider style={{ margin: '12px 0' }} />
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="Official (White)"
                                        value={moneyFormatter({ amount: booking.officialAmount || 0 })}
                                        valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="Internal (Black)"
                                        value={moneyFormatter({ amount: booking.internalAmount || 0 })}
                                        valueStyle={{ fontSize: '14px', color: '#f5222d' }}
                                    />
                                </Col>
                            </Row>
                            <Divider style={{ margin: '12px 0' }} />
                            <Statistic
                                title="Paid Amount"
                                value={moneyFormatter({ amount: booking.paymentPlan.filter(p => p.paidAmount).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0) })}
                                valueStyle={{ color: '#3f8600' }}
                            />
                            <Divider style={{ margin: '12px 0' }} />
                            <Statistic
                                title="Pending Amount"
                                value={moneyFormatter({ amount: booking.totalAmount - booking.paymentPlan.filter(p => p.paidAmount).reduce((acc, curr) => acc + (curr.paidAmount || 0), 0) })}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )
        },
        {
            key: '2',
            label: translate('Payment Requests'),
            children: (
                <Card title={translate('Generate Payment Request Forms')} bordered={false}>
                    <Table
                        dataSource={booking.paymentPlan}
                        rowKey="_id"
                        pagination={false}
                        columns={[
                            { title: translate('Milestone'), dataIndex: 'name', key: 'name' },
                            { title: translate('Amount'), dataIndex: 'amount', key: 'amount', render: (val) => moneyFormatter({ amount: val }) },
                            { title: translate('Due Date'), dataIndex: 'dueDate', key: 'dueDate', render: (d) => d ? dayjs(d).format(dateFormat) : '-' },
                            {
                                title: translate('Form'),
                                key: 'download',
                                render: (_, record) => (
                                    <Button
                                        type="primary"
                                        icon={<FilePdfOutlined />}
                                        onClick={() => {
                                            window.open(
                                                `${DOWNLOAD_BASE_URL}paymentrequest/paymentrequest-${id}.pdf?milestoneId=${record._id}`,
                                                '_blank'
                                            );
                                        }}
                                    >
                                        Download Form
                                    </Button>
                                )
                            }
                        ]}
                    />
                </Card>
            )
        }
    ];

    return (
        <div style={{ padding: '20px' }}>
            <PageHeader
                onBack={() => navigate('/booking')}
                title={translate('Booking Details')}
                subTitle={`#${id.substr(-6)}`}
                extra={[
                    <Button key="receipt" icon={<FilePdfOutlined />} onClick={handleDownloadReceipt}>Download Receipt (Fix)</Button>,
                    <Button key="edit" onClick={() => navigate(`/booking/update/${id}`)}>Edit</Button>,
                    <Button key="refresh" onClick={fetchBooking}>Refresh</Button>
                ]}
            />

            <Tabs defaultActiveKey="1" items={tabItems} />

            {/* Record Payment Modal */}
            <Modal
                title={`Record Payment: ${paymentModal.milestone?.name}`}
                open={paymentModal.open}
                onCancel={() => setPaymentModal({ open: false, milestone: null })}
                onOk={handlePaymentSubmit}
                okText="Record Payment"
                destroyOnClose
            >
                <Form form={form} layout="vertical" initialValues={{
                    date: dayjs(),
                    amount: paymentModal.milestone ? (paymentModal.milestone.amount - (paymentModal.milestone.paidAmount || 0)) : 0,
                    paymentMode: 'Bank Transfer',
                    ledger: 'official'
                }}>
                    <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>
                    <Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="Cash">Cash</Select.Option>
                            <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                            <Select.Option value="Card">Card</Select.Option>
                            <Select.Option value="Loan">Loan</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="ledger"
                        label="Ledger / Account"
                        rules={[{ required: true, message: 'Please select an account type' }]}
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
                                    name="ref"
                                    label="Reference / Transaction ID"
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
                    <Form.Item name="description" label="Description">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
