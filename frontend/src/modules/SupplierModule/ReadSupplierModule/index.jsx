import React, { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import ReadItem from '@/modules/ErpPanelModule/ReadItem';
import SupplierDetails from '../SupplierDetails';
import SupplierForm from '@/forms/SupplierForm';
import { ErpLayout } from '@/layout';
import PageLoader from '@/components/PageLoader';
import NotFound from '@/components/NotFound';

export default function ReadSupplierModule({ config }) {
    const dispatch = useDispatch();
    const { id } = useParams();

    useLayoutEffect(() => {
        dispatch(erp.read({ entity: config.entity, id }));
    }, [id]);

    const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

    if (isLoading) {
        return (
            <ErpLayout>
                <PageLoader />
            </ErpLayout>
        );
    }

    return (
        <ErpLayout>
            {isSuccess ? (
                <SupplierDetails item={currentResult} config={config} />
            ) : (
                <NotFound entity={config.entity} />
            )}
        </ErpLayout>
    );
}
