const { getOne } = require('../src/config/db');

async function dumpDef() {
    try {
        const res = await getOne("SELECT sql FROM sqlite_master WHERE name='labours'");
        console.log('Definition:', res ? res.sql : 'NOT FOUND');
    } catch (e) {
        console.error(e);
    }
}
dumpDef();
