try {
    const { validateEnvironment } = require('./src/utils/envValidator');
    console.log('✅ Module loaded successfully');
    validateEnvironment();
    console.log('✅ Validation function ran successfully');
} catch (error) {
    console.error('❌ Error loading/running module:', error);
}
