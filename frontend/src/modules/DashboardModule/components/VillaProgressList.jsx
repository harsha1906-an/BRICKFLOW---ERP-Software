import { List, Progress, Tag, Spin } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const stageColors = {
    foundation: 'orange',
    structure: 'blue',
    plastering: 'cyan',
    finishing: 'green',
    other: 'default',
    'Not Started': 'red'
};

const stageLabels = {
    foundation: 'Foundation',
    structure: 'Structure',
    plastering: 'Plastering',
    finishing: 'Finishing',
    other: 'Other',
    'Not Started': 'Not Started'
};

export default function VillaProgressList({ villas, isLoading }) {
    const translate = useLanguage();

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin />
            </div>
        );
    }

    if (!villas || villas.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999',
                background: '#fafafa',
                borderRadius: '8px',
                border: '1px dashed #d9d9d9'
            }}>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {translate('No villas found')}
                </div>
                <div style={{ fontSize: '12px' }}>
                    {translate('Add villas to track construction progress')}
                </div>
            </div>
        );
    }

    return (
        <List
            dataSource={villas}
            pagination={villas.length > 10 ? { pageSize: 10, size: 'small' } : false}
            renderItem={(villa) => (
                <List.Item style={{ padding: '12px 0' }}>
                    <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>
                                <HomeOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                                {villa.name || `Villa ${villa.villaNumber}`}
                                {villa.project && (
                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                        ({villa.project.name})
                                    </span>
                                )}
                            </span>
                            <Tag color={stageColors[villa.stage]} style={{ margin: 0 }}>
                                {stageLabels[villa.stage] || villa.stage}
                            </Tag>
                        </div>
                        <Progress
                            percent={villa.percentage}
                            size="small"
                            status={villa.percentage === 100 ? 'success' : 'active'}
                            strokeColor={
                                villa.percentage === 100 ? '#52c41a' :
                                    villa.percentage >= 75 ? '#1890ff' :
                                        villa.percentage >= 50 ? '#faad14' :
                                            villa.percentage >= 25 ? '#ff7a45' : '#ff4d4f'
                            }
                        />
                        {villa.lastUpdated && (
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                {translate('Last updated')}: {new Date(villa.lastUpdated).toLocaleDateString()}
                            </div>
                        )}
                        {villa.totalMilestones > 0 && (
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                📋 {villa.completedMilestones} of {villa.totalMilestones} milestones completed
                                {villa.totalContracts > 0 && ` • ${villa.totalContracts} labour contract(s)`}
                            </div>
                        )}
                    </div>
                </List.Item>
            )}
        />
    );
}
