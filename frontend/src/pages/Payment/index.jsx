import dayjs from 'dayjs';
import useLanguage from '@/locale/useLanguage';
import PaymentDataTableModule from '@/modules/PaymentModule/PaymentDataTableModule';
import { Select, Tag } from 'antd';
import { useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';

import { useMoney, useDate } from '@/settings';

export default function Payment() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const { dateFormat } = useDate();
  const { moneyFormatter } = useMoney();
  const searchConfig = {
    entity: 'client',
    displayLabels: ['number'],
    searchFields: 'number',
    outputValue: '_id',
  };

  const deleteModalLabels = ['number'];
  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      width: 100,
      fixed: 'left',
    },
    {
      title: translate('Transaction Code'),
      dataIndex: 'transactionCode',
      width: 150,
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      width: 180,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: translate('Villa'),
      dataIndex: ['villa', 'villaNumber'],
      width: 100,
    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      width: 150,
      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (amount, record) =>
        moneyFormatter({ amount: amount, currency_code: record.currency }),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
      width: 120,
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
    {
      title: translate('Account Type'),
      dataIndex: 'ledger',
      width: 160,
      render: (ledger) => {
        const color = ledger === 'internal' ? 'volcano' : 'blue';
        const text = ledger === 'internal' ? 'Internal (Black)' : 'Official (White)';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: translate('Payment Mode'),
      dataIndex: 'paymentMode',
      width: 140,
    },
  ];

  const tableScroll = { x: 1200 };

  const entity = 'payment';

  const Labels = {
    PANEL_TITLE: translate('payment'),
    DATATABLE_TITLE: translate('payment_list'),
    ADD_NEW_ENTITY: translate('add_new_payment'),
    ENTITY_NAME: translate('payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    disableAdd: true,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
    scroll: tableScroll,
  };

  const onFilterChange = (value) => {
    if (value === 'all') {
      dispatch(erp.list({ entity }));
    } else {
      dispatch(erp.list({ entity, options: { filter: 'ledger', equal: value } }));
    }
  };

  const customFilters = (
    <Select
      defaultValue="all"
      style={{ width: 200, marginRight: 10 }}
      onChange={onFilterChange}
    >
      <Select.Option value="all">All Accounts (Total)</Select.Option>
      <Select.Option value="official">Official Account (White)</Select.Option>
      <Select.Option value="internal">Internal Account (Black)</Select.Option>
    </Select>
  );

  return <PaymentDataTableModule config={config} customFilters={customFilters} />;
}
