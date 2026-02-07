import { Table, Tag, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import useLanguage from '@/locale/useLanguage';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export default function InventoryAnalytics() {
    const translate = useLanguage();
    const [stats, setStats] = useState({ inward: 0, outward: 0, transactions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                console.log('Fetching inventory transactions...');
                // Fetch recent inventory transactions from material endpoint
                const response = await request.get({
                    entity: 'material/transactions?limit=10'
                });

                console.log('Inventory Response:', response);

                if (response.success && response.result) {
                    console.log('Found transactions:', response.result.length);

                    // Calculate totals for this month
                    const startOfMonth = dayjs().startOf('month');
                    const monthTransactions = response.result.filter(t =>
                        dayjs(t.date).isAfter(startOfMonth)
                    );

                    const inwardTotal = monthTransactions
                        .filter(t => t.type === 'inward')
                        .reduce((sum, t) => sum + (t.quantity || 0), 0);

                    const outwardTotal = monthTransactions
                        .filter(t => t.type === 'outward')
                        .reduce((sum, t) => sum + (t.quantity || 0), 0);

                    console.log('Month stats - Inward:', inwardTotal, 'Outward:', outwardTotal);

                    setStats({
                        inward: inwardTotal,
                        outward: outwardTotal,
                        transactions: response.result.slice(0, 5) // Show only 5 recent transactions
                    });
                } else {
                    console.log('No transactions found or API error');
                    setStats({ inward: 0, outward: 0, transactions: [] });
                }
            } catch (error) {
                console.error('Error fetching inventory data:', error);
                setStats({ inward: 0, outward: 0, transactions: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const columns = [
        {
            title: translate('Material'),
            dataIndex: ['material', 'name'],
            key: 'material',
            render: (text) => text || '-',
        },
        {
            title: translate('Type'),
            dataIndex: 'type',
            key: 'type',
            render: (type) => {
                const config = {
                    inward: { color: 'green', icon: <ArrowDownOutlined />, text: 'In' },
                    outward: { color: 'red', icon: <ArrowUpOutlined />, text: 'Out' },
                    adjustment: { color: 'blue', icon: null, text: 'Adj' }
                };
                const { color, icon, text } = config[type] || {};
                return (
                    <Tag color={color} icon={icon}>
                        {translate(text)}
                    </Tag>
                );
            },
        },
        {
            title: translate('Quantity'),
            dataIndex: 'quantity',
            key: 'quantity',
            render: (qty, record) => (
                <span style={{ fontWeight: 'bold' }}>
                    {qty} {record.material?.unit || ''}
                </span>
            ),
        },
        {
            title: translate('Date'),
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
            </div>
        );
    }

    return (
        <div>
            {/* Stats Summary */}
            <div style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '20px',
                padding: '10px 0'
            }}>
                <div style={{
                    flex: 1,
                    padding: '15px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #91d5ff'
                }}>
                    <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: '5px' }}>
                        {translate('This Month IN')}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        <ArrowDownOutlined style={{ marginRight: '8px' }} />
                        {stats.inward}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                        {translate('Total Inward')}
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    padding: '15px',
                    background: '#fff1f0',
                    borderRadius: '8px',
                    border: '1px solid #ffa39e'
                }}>
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginBottom: '5px' }}>
                        {translate('This Month OUT')}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                        <ArrowUpOutlined style={{ marginRight: '8px' }} />
                        {stats.outward}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>
                        {translate('Total Outward')}
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            {stats.transactions.length > 0 ? (
                <Table
                    columns={columns}
                    rowKey={(item) => item._id}
                    dataSource={stats.transactions}
                    pagination={false}
                    scroll={{ x: true }}
                    size="small"
                />
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#999',
                    background: '#fafafa',
                    borderRadius: '8px',
                    border: '1px dashed #d9d9d9'
                }}>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                        {translate('No inventory transactions found')}
                    </div>
                    <div style={{ fontSize: '12px' }}>
                        {translate('Add inventory inward/outward transactions to see analytics here')}
                    </div>
                </div>
            )}
        </div>
    );
}
