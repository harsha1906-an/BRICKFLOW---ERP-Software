const Inventory = require('../src/models/inventory.model');
const PurchaseOrder = require('../src/models/purchaseOrder.model');
const { runQuery } = require('../src/config/db');

async function runTest() {
    console.log('🧪 Starting Inventory & PO Enforcement Verification...');

    try {
        // 0. Setup: Create material, project, supplier, user
        const projId = (await runQuery("INSERT INTO projects (name, status, created_by) VALUES ('InvTest Project', 'ongoing', 1)")).id;
        const matId = (await runQuery("INSERT INTO materials (name, unit, created_by) VALUES ('Test Brick', 'nos', 1)")).id;
        const suppId = (await runQuery("INSERT INTO suppliers (name, contact_person, phone) VALUES ('Test Supplier', 'Mr. Test', '1234567890')")).id;

        console.log('✅ Setup Complete');

        // 1. Test: Direct Inventory IN without PO (Should fail if enforced, or succeed if loose)
        // Note: The controller/model analysis showed NO check for PO status in createTransaction.
        // This test expects to SUCCEED currently (GAP DETECTION), unless I missed middleware.
        console.log('\n--- Test 1: Direct Inventory IN (No PO) ---');
        try {
            await Inventory.createTransaction({
                material_id: matId,
                project_id: projId,
                type: 'IN',
                quantity: 100,
                reference_type: 'manual', // or direct
                reference_id: null,
                notes: 'Direct add',
                usage_reason: 'Initial'
            });
            console.log('⚠️ GAP DETECTED: Inventory IN allowed without PO.');
        } catch (e) {
            console.log(`✅ BLOCKED: ${e.message}`);
        }

        // 2. Test: Inventory IN with Unapproved PO
        // Create Draft PO
        console.log('\n--- Test 2: Inventory IN with Draft PO ---');
        const poId = await PurchaseOrder.create({
            project_id: projId,
            supplier_id: suppId,
            order_date: '2023-01-01',
            expected_delivery_date: '2023-01-10',
            notes: 'Draft PO',
            items: [{ material_id: matId, quantity: 50, unit_price: 10, notes: 'Item 1' }]
        }, 1);

        // Try to reference this PO
        try {
            // Logic check: Does createTransaction check PO status?
            await Inventory.createTransaction({
                material_id: matId,
                project_id: projId,
                type: 'IN',
                quantity: 50,
                reference_type: 'purchase_order',
                reference_id: poId,
                notes: 'Received against Draft',
                usage_reason: 'Purchase'
            });
            console.log('⚠️ GAP DETECTED: Inventory IN allowed against Draft PO.');
        } catch (e) {
            console.log(`✅ BLOCKED: ${e.message}`);
        }

        // 3. Test: Stock Calculation
        const stock = await Inventory.getCurrentStock(matId, projId);
        console.log(`\nCurrent Derived Stock: ${stock}`);

    } catch (e) {
        console.error('❌ Test Failed:', e);
    }
}

runTest();
