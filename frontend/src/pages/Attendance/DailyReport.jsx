import React, { useEffect, useState } from 'react';
import { Card, DatePicker, Row, Col, Statistic, Spin, message, Button, Space, Table, Tag, Divider, Modal, Progress } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, WalletOutlined, BuildOutlined, UserOutlined, DownloadOutlined, EuroOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '@/request';
import { useAppContext } from '@/context/appContext';
import { useMoney } from '@/settings';

const DailyReport = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [date, setDate] = useState(dayjs());
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const { moneyFormatter, currency_symbol } = useMoney();
    const { state } = useAppContext();
    const companyId = state.currentCompany;

    useEffect(() => {
        fetchSummary();
    }, [date]);

    const fetchSummary = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const data = await request.get({ entity: `companies/${companyId}/daily-summary?date=${dateStr}` });
            setSummary(data);
        } catch (e) {
            messageApi.error('Failed to load daily summary');
        }
        setLoading(false);
    };

    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDownload = async () => {
        if (!summary) return;

        setDownloading(true);
        setProgress(0);

        // Fake progress up to 99%
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 99) {
                    clearInterval(timer);
                    return 99;
                }
                const increment = prev < 60 ? 10 : prev < 90 ? 5 : 1;
                return prev + increment;
            });
        }, 100);

        try {
            const dateStr = date.format('YYYY-MM-DD');
            const response = await request.pdf({
                entity: `companies/${companyId}/daily-report-pdf?date=${dateStr}`,
            });

            // Download complete
            clearInterval(timer);
            setProgress(100);

            // Handle direct blob response headers
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DailyReport_${dateStr}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Close modal after short delay
            setTimeout(() => {
                setDownloading(false);
                setProgress(0);
            }, 1000);

        } catch (error) {
            console.error('Download failed:', error);
            clearInterval(timer);
            setDownloading(false);
            messageApi.error('Failed to download PDF report');
        }
    };

    return (
        <Card>
            {contextHolder}
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                        <h2 style={{ margin: 0 }}>Daily Summary</h2>
                    </Space>
                    <Space>
                        <DatePicker value={date} onChange={setDate} allowClear={false} />
                        <Button icon={<ReloadOutlined />} onClick={fetchSummary} loading={loading} />
                        <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!summary}>Download</Button>
                    </Space>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
                ) : summary ? (
                    <>
                        <Row gutter={[16, 16]}>
                            <Col span={8}>
                                <Card bordered={true}>
                                    <Statistic
                                        title="Labour Wages (Net)"
                                        value={summary.labour.netWage}
                                        precision={2}
                                        prefix={<UserOutlined />}
                                        suffix={currency_symbol}
                                    />
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: 8 }}>
                                        {summary.labour.count} Workers Marked
                                    </div>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card bordered={true}>
                                    <Statistic
                                        title="Petty Cash Expenses"
                                        value={summary.pettyCash?.expense || 0}
                                        precision={2}
                                        prefix={<EuroOutlined />}
                                        suffix={currency_symbol}
                                    />
                                    <div style={{ fontSize: '12px', color: '#888', marginTop: 8 }}>
                                        {summary.pettyCash?.count || 0} Transactions
                                    </div>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card bordered={true}>
                                    <Statistic
                                        title="Customer Collections"
                                        value={summary.customerCollections}
                                        precision={2}
                                        prefix={<BuildOutlined />}
                                        suffix={currency_symbol}
                                        valueStyle={{ color: '#3f8600' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        <Card title="Detailed Breakdown" size="small">
                            <Row gutter={32}>
                                <Col span={12}>
                                    <h4>Labour Adjustments</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>Total Advances Deducted:</span>
                                        <b style={{ color: 'red' }}>-{moneyFormatter({ amount: summary.labour.advances })}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Total Penalties Deducted:</span>
                                        <b style={{ color: 'red' }}>-{moneyFormatter({ amount: summary.labour.penalties })}</b>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <h4>Expense Breakdown</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>Supplier Payments:</span>
                                        <b style={{ color: 'red' }}>-{moneyFormatter({ amount: summary.expenses?.supplier || 0 })}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>Labour Contracts:</span>
                                        <b style={{ color: 'red' }}>-{moneyFormatter({ amount: summary.expenses?.labourContract || 0 })}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>Other Expenses:</span>
                                        <b style={{ color: 'red' }}>-{moneyFormatter({ amount: summary.expenses?.other || 0 })}</b>
                                    </div>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Total (Non-Wage):</span>
                                        <b style={{ color: 'red' }}>-{moneyFormatter({ amount: summary.expenses?.amount || 0 })}</b>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <h4>Inventory Activity</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span>Materials Received (In):</span>
                                        <Tag color="green">{summary.inventory.inward} Items</Tag>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Materials Issued (Out):</span>
                                        <Tag color="orange">{summary.inventory.outward} Items</Tag>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    </>
                ) : null}
            </Space>
            <Modal
                title="Generating Report"
                open={downloading}
                footer={null}
                closable={false}
                centered
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>Please wait while we generate your PDF report...</p>
                    <Progress type="circle" percent={progress} status={progress === 100 ? "success" : "active"} />
                    <div style={{ marginTop: 10 }}>{progress === 100 ? "Download Complete!" : "Processing..."}</div>
                </div>
            </Modal>
        </Card>
    );
};

export default DailyReport;
