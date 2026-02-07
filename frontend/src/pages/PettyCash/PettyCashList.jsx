import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Tag, Form, Input, InputNumber, App, Card, Row, Col, Statistic, DatePicker } from 'antd';
import { PlusOutlined, MinusOutlined, WalletOutlined, PrinterOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useUserRole } from '@/hooks/useUserRole';
import { request } from '@/request';
import { useMoney } from '@/settings';
import dayjs from 'dayjs';
import storePersist from '@/redux/storePersist';

const PettyCashList = () => {
    const { message } = App.useApp();
    const { moneyFormatter, inputFormatter, inputParser } = useMoney();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({ totalInward: 0, totalOutward: 0, balance: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('outward'); // 'inward' or 'outward'
    const [form] = Form.useForm();
    const translate = useLanguage();
    const { role } = useUserRole();
    const [reportDate, setReportDate] = useState(dayjs());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                request.list({ entity: 'pettycashtransaction' }),
                request.summary({ entity: 'pettycashtransaction' })
            ]);
            setData(listRes.result);
            setSummary(summaryRes.result);
        } catch (e) {
            console.error(e);
            message.error('Failed to load petty cash data');
        }
        setLoading(false);
    };

    const handleDownloadReport = async () => {
        if (!reportDate) {
            message.warning('Please select a date for the report');
            return;
        }
        const formattedDate = reportDate.format('YYYY-MM-DD');

        try {
            message.loading({ content: 'Generating report...', key: 'reporting' });

            // Using axios directly from request module instance if possible, or just standard axios
            // const response = await request.get({ 
            //     entity: `pettycashtransaction/report?date=${formattedDate}`,
            //     options: { responseType: 'blob' } // This won't work with current standard request.get
            // });

            // Since request.get might not support blob easily without modification, 
            // I'll stick to a more controlled fetch but ensure it mimics axios exactly.
            const auth = storePersist.get('auth');
            const token = auth?.current?.token;
            const baseUrl = import.meta.env.VITE_BACKEND_SERVER.endsWith('/')
                ? import.meta.env.VITE_BACKEND_SERVER
                : import.meta.env.VITE_BACKEND_SERVER + '/';

            const downloadRes = await fetch(`${baseUrl}api/pettycashtransaction/report?date=${formattedDate}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                }
            });

            if (!downloadRes.ok) throw new Error('Failed to generate report');

            const contentType = downloadRes.headers.get('content-type');
            if (contentType && contentType.indexOf('application/pdf') === -1) {
                const text = await downloadRes.text();
                const json = JSON.parse(text);
                throw new Error(json.message || 'Server error');
            }

            const blob = await downloadRes.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `PettyCashReport_${formattedDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            message.success({ content: 'Report downloaded successfully', key: 'reporting' });
        } catch (error) {
            message.error({ content: error.message || 'Failed to download report', key: 'reporting' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (type) => {
        setModalType(type);
        setModalOpen(true);
    };

    useEffect(() => {
        if (modalOpen) {
            form.resetFields();
            form.setFieldsValue({ date: dayjs() });
        }
    }, [modalOpen]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            values.type = modalType;
            // Convert dayjs to JS Date for backend
            if (values.date) values.date = values.date.toDate();

            await request.post({ entity: 'pettycashtransaction/create', jsonData: values });
            message.success(modalType === 'inward' ? 'Cash added successfully' : 'Expense recorded successfully');
            setModalOpen(false);
            fetchData();
        } catch (e) {
            if (e.errorFields) return;
            message.error(e.response?.data?.message || 'Failed to save transaction');
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => dayjs(date).format('DD/MM/YYYY') },
        { title: 'Description', dataIndex: 'name', key: 'name' },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => type === 'inward' ? <Tag color="green">Top-up</Tag> : <Tag color="red">Expense</Tag>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount, record) => (
                <span style={{ color: record.type === 'inward' ? 'green' : 'red', fontWeight: 'bold' }}>
                    {record.type === 'inward' ? '+' : '-'}{moneyFormatter({ amount })}
                </span>
            )
        },
        { title: 'Receipt #', dataIndex: 'receiptNumber', key: 'receiptNumber' },
        { title: 'Notes', dataIndex: 'note', key: 'note' },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card bordered={false} className="summary-card">
                        <Statistic title="Total Cash Received" value={summary.totalInward} precision={2} prefix={<WalletOutlined />} valueStyle={{ color: '#3f8600' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="summary-card">
                        <Statistic title="Total Expenses" value={summary.totalOutward} precision={2} prefix={<MinusOutlined />} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="summary-card">
                        <Statistic title="Current Balance" value={summary.balance} precision={2} prefix={<WalletOutlined />} valueStyle={{ color: summary.balance < 0 ? '#cf1322' : '#1890ff' }} />
                    </Card>
                </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>Petty Cash Ledger</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ marginRight: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <DatePicker
                            value={reportDate}
                            onChange={setReportDate}
                            format="DD/MM/YYYY"
                            allowClear={false}
                        />
                        <Button
                            icon={<PrinterOutlined />}
                            onClick={handleDownloadReport}
                            title="Print Daily Report"
                        >
                            Daily Report
                        </Button>
                    </div>
                    {role === 'OWNER' && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('inward')} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                            Add Cash
                        </Button>
                    )}
                    {(role === 'OWNER' || role === 'ENGINEER') && (
                        <Button type="primary" danger icon={<MinusOutlined />} onClick={() => openModal('outward')}>
                            Log Expense
                        </Button>
                    )}
                </div>
            </div>

            <Table
                rowKey="_id"
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{ pageSize: 10 }}
                style={{ borderRadius: '8px', overflow: 'hidden' }}
            />

            <Modal
                title={modalType === 'inward' ? 'Add Petty Cash (Top-up)' : 'Record New Expense'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleOk}
                destroyOnClose
                okText="Confirm"
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label={modalType === 'inward' ? 'Reference / Title' : 'Expense Description'} rules={[{ required: true, message: 'Please enter a name' }]}>
                        <Input placeholder={modalType === 'inward' ? 'e.g. Weekly Cash for Site' : 'e.g. Material Purchase'} />
                    </Form.Item>
                    <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Please enter amount' }]}>
                        <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            placeholder="0.00"
                            formatter={inputFormatter}
                            parser={inputParser}
                        />
                    </Form.Item>
                    <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item name="receiptNumber" label="Receipt / Voucher Number">
                        <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item name="note" label="Additional Notes">
                        <Input.TextArea placeholder="Describe the transaction detail..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PettyCashList;
