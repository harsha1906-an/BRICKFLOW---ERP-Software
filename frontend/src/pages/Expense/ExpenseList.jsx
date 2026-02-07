import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Select, Row, Col, Space, App } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import { useMoney, useDate } from '@/settings';
import { request } from '@/request';
import SelectAsync from '@/components/SelectAsync';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function ExpenseList() {
    const { message } = App.useApp();
    const translate = useLanguage();
    const { dateFormat } = useDate();
    const { moneyFormatter } = useMoney();

    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // Filters
    const [dateRange, setDateRange] = useState(null);
    const [recipientType, setRecipientType] = useState('all');
    const [selectedVilla, setSelectedVilla] = useState('all');
    const [labourSkill, setLabourSkill] = useState('all');
    const [villaOptions, setVillaOptions] = useState([]);

    const fetchExpenses = async (page = 1) => {
        setLoading(true);
        try {
            const filters = {};

            // Add date range filter
            if (dateRange && dateRange[0] && dateRange[1]) {
                filters.startDate = dateRange[0].format('YYYY-MM-DD');
                filters.endDate = dateRange[1].format('YYYY-MM-DD');
            }

            // Add recipient type filter
            if (recipientType && recipientType !== 'all') {
                filters.recipientType = recipientType;
            }

            // Add labour-specific filters when Labour is selected
            if (recipientType === 'Labour') {
                if (selectedVilla && selectedVilla !== 'all') {
                    filters.villa = selectedVilla;
                }
                if (labourSkill && labourSkill !== 'all') {
                    filters.labourSkill = labourSkill;
                }
            }

            const response = await request.list({
                entity: 'expense',
                options: {
                    page,
                    items: pagination.pageSize,
                    ...filters
                }
            });

            if (response.success) {
                setExpenses(response.result);
                setPagination({
                    ...pagination,
                    current: page,
                    total: response.pagination?.total || response.result.length
                });
            }
        } catch (error) {
            message.error('Failed to fetch expenses');
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        const fetchVillas = async () => {
            const result = await request.list({ entity: 'villa', options: { items: 100 } });
            if (result.success) {
                const options = result.result.map(v => ({ label: v.villaNumber, value: v._id }));
                setVillaOptions([{ label: 'All Villas', value: 'all' }, ...options]);
            }
        };
        fetchVillas();
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [dateRange, recipientType, selectedVilla, labourSkill]);

    const handleExport = () => {
        // Create CSV content
        const headers = ['Number', 'Date', 'Recipient Type', 'Recipient', 'Amount', 'Payment Mode', 'Description'];
        const csvRows = [headers.join(',')];

        expenses.forEach(expense => {
            const row = [
                expense.number,
                dayjs(expense.date).format(dateFormat),
                expense.recipientType,
                expense.recipientType === 'Supplier' ? expense.supplier?.name || '-' : expense.labour?.name || '-',
                expense.amount,
                expense.paymentMode,
                `"${expense.description?.replace(/"/g, '""') || ''}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `expenses_${dayjs().format('YYYY-MM-DD')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        message.success('Expenses exported successfully');
    };

    const columns = [
        {
            title: translate('Number'),
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: translate('Date'),
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format(dateFormat),
        },
        {
            title: translate('Recipient Type'),
            dataIndex: 'recipientType',
            key: 'recipientType',
        },
        {
            title: translate('Recipient'),
            key: 'recipient',
            render: (_, record) => {
                if (record.recipientType === 'Supplier' && record.supplier) return record.supplier.name;
                if (record.recipientType === 'Labour' && record.labour) return record.labour.name;
                return '-';
            }
        },
        {
            title: translate('Amount'),
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => moneyFormatter({ amount }),
        },
        {
            title: translate('Payment Mode'),
            dataIndex: 'paymentMode',
            key: 'paymentMode',
        },
        {
            title: translate('Description'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        }
    ];

    return (
        <ErpLayout>
            <Card
                title={translate('Expenses')}
                extra={
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        disabled={expenses.length === 0}
                    >
                        Export CSV
                    </Button>
                }
            >
                <Card size="small" title={<><FilterOutlined /> Filters</>}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <label>Date Range</label>
                            <RangePicker
                                style={{ width: '100%' }}
                                value={dateRange}
                                onChange={setDateRange}
                                format={dateFormat}
                            />
                        </Col>
                        <Col span={8}>
                            <label>Recipient Type</label>
                            <Select
                                style={{ width: '100%' }}
                                value={recipientType}
                                onChange={setRecipientType}
                                options={[
                                    { value: 'all', label: 'All' },
                                    { value: 'Supplier', label: 'Supplier' },
                                    { value: 'Labour', label: 'Labour' }
                                ]}
                            />
                        </Col>
                    </Row>

                    {/* Labour-specific filters */}
                    {recipientType === 'Labour' && (
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={12}>
                                <label>Villa (Labour Contract)</label>
                                <label>Villa (Labour Contract)</label>
                                <Select
                                    style={{ width: '100%' }}
                                    value={selectedVilla}
                                    onChange={setSelectedVilla}
                                    options={villaOptions}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Col>
                            <Col span={12}>
                                <label>Labour Type/Skill</label>
                                <Select
                                    style={{ width: '100%' }}
                                    value={labourSkill}
                                    onChange={setLabourSkill}
                                    options={[
                                        { value: 'all', label: 'All Types' },
                                        { value: 'mason', label: 'Mason' },
                                        { value: 'electrician', label: 'Electrician' },
                                        { value: 'plumber', label: 'Plumber' },
                                        { value: 'helper', label: 'Helper' },
                                        { value: 'other', label: 'Other' }
                                    ]}
                                />
                            </Col>
                        </Row>
                    )}
                </Card>

                <div style={{ marginTop: '20px' }}>
                    <Table
                        columns={columns}
                        dataSource={expenses}
                        rowKey="_id"
                        loading={loading}
                        pagination={{
                            ...pagination,
                            onChange: fetchExpenses
                        }}
                    />
                </div>
            </Card>
        </ErpLayout>
    );
}
