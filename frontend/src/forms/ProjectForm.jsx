import { Form, Input, InputNumber, Row, Col, Select, DatePicker } from 'antd';
import useMoney from '@/settings/useMoney';

export default function ProjectForm({ isUpdateForm = false }) {
    const { currency_symbol } = useMoney();
    return (
        <>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Form.Item
                        label="Project Name"
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Please input project name!',
                            },
                        ]}
                    >
                        <Input placeholder="e.g. Villa 101" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Location" name="location">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="State (Place of Supply)" name="state" initialValue="Tamil Nadu">
                        <Select>
                            <Select.Option value="Tamil Nadu">Tamil Nadu</Select.Option>
                            <Select.Option value="Karnataka">Karnataka</Select.Option>
                            <Select.Option value="Kerala">Kerala</Select.Option>
                            <Select.Option value="Andhra Pradesh">Andhra Pradesh</Select.Option>
                            <Select.Option value="Other">Other</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Project GSTIN" name="gstin">
                        <Input placeholder="If registered separately" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Status" name="status" initialValue="Planning">
                        <Select>
                            <Select.Option value="Planning">Planning</Select.Option>
                            <Select.Option value="In Progress">In Progress</Select.Option>
                            <Select.Option value="Completed">Completed</Select.Option>
                            <Select.Option value="On Hold">On Hold</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Budget" name="budget">
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={(value) => (value ? `${currency_symbol} ${value}` : '').replace(/\B(?=(?:\d{2})+(?!\d)(?:\d{3})?)/g, ',')}
                            parser={(value) => value.replace(new RegExp(`\\${currency_symbol}\\s?|(,*)`, 'g'), '')}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Start Date" name="startDate">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                {/* Note: Client and Manager selects would ideally be SearchSelects, but for simplicity relying on simple Inputs or omitted for now unless User requests advanced linking */}
                <Col span={24}>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
}
