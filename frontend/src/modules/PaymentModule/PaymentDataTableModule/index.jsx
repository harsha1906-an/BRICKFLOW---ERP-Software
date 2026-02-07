import { ErpLayout } from '@/layout';
import ErpPanel from '@/modules/ErpPanelModule';

export default function PaymentDataTableModule({ config, customFilters }) {
  return (
    <ErpLayout>
      <ErpPanel config={config} customFilters={customFilters}></ErpPanel>
    </ErpLayout>
  );
}
