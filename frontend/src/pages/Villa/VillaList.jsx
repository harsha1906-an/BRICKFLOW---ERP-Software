import useLanguage from '@/locale/useLanguage';
import { Tag } from 'antd';
import { ErpLayout } from '@/layout';
import ErpPanel from '@/modules/ErpPanelModule';
import { useMoney } from '@/settings';

export default function VillaList() {
    const translate = useLanguage();
    const { moneyFormatter } = useMoney();

    const searchConfig = {
        entity: 'villa',
        displayLabels: ['villaNumber'],
        searchFields: 'villaNumber',
        outputValue: '_id',
    };

    const deleteModalLabels = ['villaNumber'];
    const dataTableColumns = [
        {
            title: translate('Villa Number'),
            dataIndex: 'villaNumber',
        },
        {
            title: translate('Type'),
            dataIndex: 'houseType',
        },
        {
            title: translate('Facing'),
            dataIndex: 'facing',
            render: (facing) => facing || '-',
        },
        {
            title: translate('Land Area'),
            dataIndex: 'landArea',
            render: (area) => area ? `${area} sqft` : '-',
        },
        {
            title: translate('Ground Floor'),
            dataIndex: 'groundFloorArea',
            render: (area) => area ? `${area} sqft` : '-',
        },
        {
            title: translate('1st Floor'),
            dataIndex: 'firstFloorArea',
            render: (area) => area ? `${area} sqft` : '-',
        },
        {
            title: translate('2nd Floor'),
            dataIndex: 'secondFloorArea',
            render: (area) => area ? `${area} sqft` : '-',
        },
        {
            title: translate('Total Built Up'),
            dataIndex: 'builtUpArea',
            render: (area) => area ? `${area} sqft` : '-',
        },
        {
            title: translate('Total Price'),
            dataIndex: 'totalAmount',
            render: (amount) => moneyFormatter({ amount: amount || 0 }),
        },
        {
            title: translate('Status'),
            dataIndex: 'status',
            render: (status) => {
                let color = status === 'booked' ? 'green' : status === 'sold' ? 'red' : 'blue';
                return <Tag color={color}>{status ? status.toUpperCase() : 'AVAILABLE'}</Tag>;
            }
        },
    ];

    const entity = 'villa';

    const Labels = {
        PANEL_TITLE: translate('Villas'),
        DATATABLE_TITLE: translate('Villa List'),
        ADD_NEW_ENTITY: translate('Add New Villa'),
        ENTITY_NAME: translate('Villa'),
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
        // We can define custom create/read routes if needed
        // readRoute: '/villa/read', 
    };

    return (
        <ErpLayout>
            <ErpPanel config={config}></ErpPanel>
        </ErpLayout>
    );
}
