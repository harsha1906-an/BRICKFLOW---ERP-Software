import React from 'react';
import dayjs from 'dayjs';
import useLanguage from '@/locale/useLanguage';
import BookingDataTableModule from '@/modules/BookingModule/BookingDataTableModule';
import { useMoney, useDate } from '@/settings';
import { App } from 'antd';

export default function BookingList() {
    const translate = useLanguage();
    const { dateFormat } = useDate();
    const { moneyFormatter } = useMoney();
    const { message } = App.useApp();

    const searchConfig = {
        entity: 'client',
        displayLabels: ['name'],
        searchFields: 'name',
        outputValue: '_id',
    };

    const deleteModalLabels = ['_id'];
    const dataTableColumns = [
        {
            title: translate('Client'),
            dataIndex: ['client', 'name'],
        },
        {
            title: translate('Villa'),
            dataIndex: ['villa', 'villaNumber'],
        },
        {
            title: translate('Status'),
            dataIndex: 'status',
            render: (status) => {
                let color = status === 'booked' ? 'green' : status === 'cancelled' ? 'red' : 'blue';
                return <span style={{ color: color, textTransform: 'capitalize' }}>{status}</span>;
            }
        },
        {
            title: translate('Total Amount'),
            dataIndex: 'totalAmount',
            render: (amount) => moneyFormatter({ amount }),
        },
        {
            title: translate('Paid Amount'),
            dataIndex: 'paymentPlan',
            render: (paymentPlan) => {
                const paid = paymentPlan?.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0) || 0;
                return <span style={{ color: 'green' }}>{moneyFormatter({ amount: paid })}</span>;
            },
        },
        {
            title: translate('Balance'),
            dataIndex: 'balance', // Virtual or calculated
            render: (_, record) => {
                const paid = record.paymentPlan?.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0) || 0;
                const balance = (record.totalAmount || 0) - paid;
                return <span style={{ color: balance > 0 ? 'red' : 'green', fontWeight: 'bold' }}>{moneyFormatter({ amount: balance })}</span>;
            },
        },
        {
            title: translate('Date'),
            dataIndex: 'created',
            render: (date) => dayjs(date).format(dateFormat),
        },
    ];

    const entity = 'booking'; // Matches the API route keys

    const Labels = {
        PANEL_TITLE: translate('Bookings'),
        DATATABLE_TITLE: translate('Booking List'),
        ADD_NEW_ENTITY: translate('Add New Booking'),
        ENTITY_NAME: translate('Booking'),
    };

    const configPage = {
        entity,
        ...Labels,
    };
    const config = {
        ...configPage,
        dataTableColumns,
        searchConfig,
        deleteModalLabels,
        // We will enable Add to route to our custom create page
        createRoute: '/booking/create'
    };
    return <BookingDataTableModule config={config} />;
}
