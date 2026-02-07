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
