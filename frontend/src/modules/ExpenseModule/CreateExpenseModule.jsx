import React, { useLayoutEffect, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Divider, Row, Col } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';

import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';
import useLanguage from '@/locale/useLanguage';
import Loading from '@/components/Loading';
import { ErpLayout } from '@/layout';

import ExpenseForm from './components/ExpenseForm';

export default function CreateExpenseModule({ config }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const translate = useLanguage();

    const { isSuccess, isLoading } = useSelector(selectCreatedItem);
    const [form] = Form.useForm();

    useLayoutEffect(() => {
        dispatch(erp.resetAction({ actionType: 'create' }));
        form.resetFields();
    }, []);

    useEffect(() => {
        if (isSuccess) {
            form.resetFields();
            dispatch(erp.resetAction({ actionType: 'create' }));
            navigate(`/${config.entity.toLowerCase()}`);
        }
    }, [isSuccess]);

    const onSubmit = (fieldsValue) => {
        dispatch(erp.create({ entity: config.entity, jsonData: fieldsValue }));
    };

    return (
        <ErpLayout>
            <PageHeader
                onBack={() => navigate(`/${config.entity.toLowerCase()}`)}
                title={translate('New Expense')}
                ghost={false}
                extra={[
                    <Button
                        key="cancel"
                        onClick={() => navigate(`/${config.entity.toLowerCase()}`)}
                        icon={<CloseCircleOutlined />}
                    >
                        {translate('Cancel')}
                    </Button>,
                ]}
                style={{ padding: '20px 0px' }}
            ></PageHeader>
            <Divider dashed />

            <Loading isLoading={isLoading}>
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <div className="whiteBox shadow" style={{ padding: '24px' }}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onSubmit}
                                initialValues={{
                                    recipientType: 'Other',
                                    paymentMode: 'Cash'
                                }}
                            >
                                <ExpenseForm />
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                                        {translate('Save')}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Loading>
        </ErpLayout>
    );
}
