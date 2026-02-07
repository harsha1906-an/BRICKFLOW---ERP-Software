const mongoose = require('mongoose');

// Helper for fuzzy matching (Levenshtein Distance)
const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const search = async (req, res) => {
    const { query } = req.body;
    const companyId = req.admin.companyId;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: "Query is required"
        });
    }

    const lowerQuery = query.toLowerCase().trim();
    let results = [];
    let responseText = "";

    // 1. Navigation & Feature Map (Expanded)
    const navMap = {
        'create invoice': { path: '/invoice/create', label: 'Create Invoice', keywords: ['add invoice', 'new invoice', 'billing', 'bill'] },
        'invoice list': { path: '/invoice', label: 'Invoice List', keywords: ['show invoices', 'view bills', 'all invoices', 'invoices'] },
        'create quote': { path: '/quote/create', label: 'Create Quote', keywords: ['add quote', 'new quote', 'estimate', 'calculation'] },
        'quote list': { path: '/quote', label: 'Quote List', keywords: ['show quotes', 'view estimates', 'all quotes', 'quotes'] },
        'customer list': { path: '/customer', label: 'Customer List', keywords: ['clients', 'all customers', 'peoples', 'client list'] },
        'leads': { path: '/lead', label: 'Lead Management', keywords: ['all leads', 'new leads', 'crm', 'prospects'] },
        'suppliers': { path: '/supplier', label: 'Supplier List', keywords: ['all suppliers', 'vendors', 'purchasing'] },
        'inventory': { path: '/inventory', label: 'Inventory & Stock', keywords: ['villa stock', 'materials', 'products', 'warehouse', 'store'] },
        'attendance': { path: '/attendance', label: 'Attendance', keywords: ['mark attendance', 'daily roll', 'presence'] },
        'labour': { path: '/labour', label: 'Labour Management', keywords: ['workers', 'people', 'staff', 'employees'] },
        'daily expense': { path: '/daily-summary', label: 'Daily Summary', keywords: ['expenses', 'daily report', 'summary'] },
        'petty cash': { path: '/pettycash', label: 'Petty Cash', keywords: ['small cash', 'outward', 'cash transactions', 'daily report', 'petty cash report'] },
        'settings': { path: '/settings', label: 'Settings', keywords: ['config', 'setup', 'options'] },
        'profile': { path: '/profile', label: 'My Profile', keywords: ['account', 'user profile'] },
        'dashboard': { path: '/', label: 'Dashboard', keywords: ['home', 'main page', 'overview'] },
        'booking list': { path: '/booking', label: 'Booking List', keywords: ['all bookings', 'real estate', 'villas booking'] }
    };

    // Check for exact/keyword matches first
    let foundFeature = null;
    for (const [key, config] of Object.entries(navMap)) {
        if (lowerQuery === key || config.keywords.some(k => lowerQuery.includes(k)) || lowerQuery.includes(key)) {
            foundFeature = { key, ...config };
            break;
        }
    }

    // Fuzzy matching if no exact match found
    if (!foundFeature && lowerQuery.length > 3) {
        let bestDist = 100;
        for (const [key, config] of Object.entries(navMap)) {
            const words = lowerQuery.split(' ');
            for (const word of words) {
                if (word.length < 3) continue;
                const dist = getLevenshteinDistance(word, key);
                const combinedKewords = [key, ...config.keywords];

                for (const k of combinedKewords) {
                    const d = getLevenshteinDistance(word, k);
                    if (d < bestDist && d <= 2) { // Allow 2 typos
                        bestDist = d;
                        foundFeature = { key, ...config };
                    }
                }
            }
        }
    }

    if (foundFeature) {
        results.push({
            type: 'action',
            action: 'navigate',
            path: foundFeature.path,
            label: `Go to ${foundFeature.label}`
        });
        responseText = `I found the ${foundFeature.label} for you. Click below to open it.`;
    }

    // 2. Data Search Handling
    // 2a. ID Pattern (#101 or 101)
    const numberMatch = query.match(/#?(\d+)/);
    if (numberMatch && !foundFeature) {
        const number = numberMatch[1];
        const Invoice = mongoose.model('Invoice');
        const invoice = await Invoice.findOne({ number: number, companyId, removed: false }).populate('client');
        if (invoice) {
            results.push({
                type: 'card',
                entity: 'Invoice',
                title: `Invoice #${invoice.number}`,
                status: invoice.status,
                amount: invoice.total,
                client: invoice.client?.name,
                date: invoice.date
            });
        }
    }

    // 2b. Name Search
    if (lowerQuery.length > 2 && results.length === 0) {
        const Client = mongoose.model('Client');
        const clients = await Client.find({ name: { $regex: new RegExp(lowerQuery, 'i') }, companyId, removed: false }).limit(2);
        clients.forEach(c => results.push({ type: 'card', entity: 'Client', title: c.name, email: c.email }));

        const Lead = mongoose.model('Lead');
        const leads = await Lead.find({ name: { $regex: new RegExp(lowerQuery, 'i') }, companyId, removed: false }).limit(2);
        leads.forEach(l => results.push({ type: 'card', entity: 'Lead', title: l.name, status: l.status }));
    }

    // 3. Special Updates Feature
    if (lowerQuery.includes('update') || lowerQuery.includes('new') || lowerQuery.includes('feature') || lowerQuery.includes('latest')) {
        responseText = "I've been updated with new capabilities! Check these out:";
        results.push({ type: 'text', content: "📊 **Petty Cash Report:** Generate printable daily reports with running balances and owner signature section." });
        results.push({ type: 'text', content: "🏗️ **Labour Milestones:** Customize 5-stage payment plans for different contract workers (Plumbers, Electricians, Masons)." });
        results.push({ type: 'text', content: "👥 **Customer View:** Simplified dashboard showing only name, phone, and booked villa. Expand rows for full details." });
        results.push({ type: 'text', content: "🏠 **Villa Stock:** Manage inventory specifically for each villa." });
        results.push({ type: 'text', content: "💰 **Payments:** Link payments to booking milestones." });
    }

    // 4. Final Response Construction
    if (results.length > 0) {
        if (!responseText) responseText = `I found ${results.length} item(s) that might help:`;
    } else {
        responseText = "I'm not exactly sure what you're looking for, but I can help with Invoices, Quotes, Inventory, and Tracking. Try asking for 'Villa Stock' or 'Create Invoice'.";
        // Always provide some helpful buttons if lost
        results.push({ type: 'action', action: 'navigate', path: '/invoice', label: 'Invoices' });
        results.push({ type: 'action', action: 'navigate', path: '/inventory', label: 'Inventory' });
    }

    return res.status(200).json({
        success: true,
        result: {
            text: responseText,
            data: results
        }
    });
};

module.exports = { search };
