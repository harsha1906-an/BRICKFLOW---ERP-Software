import CreateExpenseModule from '@/modules/ExpenseModule/CreateExpenseModule';

export default function ExpenseCreate() {
    const entity = 'expense';
    const Labels = {
        PANEL_TITLE: 'Expense',
        DATATABLE_TITLE: 'Expenses List',
        ADD_NEW_ENTITY: 'Add New Expense',
        ENTITY_NAME: 'Expense',
    };

    const configPage = {
        entity,
        ...Labels,
    };
    return <CreateExpenseModule config={configPage} />;
}
